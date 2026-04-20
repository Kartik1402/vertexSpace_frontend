import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  acceptWaitlistOfferById,
  declineWaitlistOfferById,
  getMyWaitlistOffer,
} from "../../../services/api";
import "./WaitlistOfferPanel.css";

function pickOffer(res) {
  // supports: object OR array OR { offers: [...] }
  if (!res) return null;
  if (Array.isArray(res)) return res[0] ?? null;
  if (Array.isArray(res?.offers)) return res.offers[0] ?? null;
  if (typeof res === "object") return res;
  return null;
}

function fmtRange(startUtc, endUtc) {
  const s = startUtc ? new Date(startUtc) : null;
  const e = endUtc ? new Date(endUtc) : null;

  const date = s
    ? s.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
    : "-";

  const time =
    s && e
      ? `${s.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} - ${e.toLocaleTimeString(
          undefined,
          { hour: "2-digit", minute: "2-digit" }
        )}`
      : "-";

  return { date, time };
}

function mmss(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function WaitlistOfferPanel({
  pollMs = 8000, // keeps checking backend
  showWhenEmpty = true,
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [offer, setOffer] = useState(null);
  const [busy, setBusy] = useState(false);

  // countdown
  const [remaining, setRemaining] = useState(0);
  const expiresAtRef = useRef(null);

  const hasActiveOffer = useMemo(() => {
    const st = String(offer?.status || "").toUpperCase();
    return !!offer?.id && (st === "OFFERED" || st === "ACTIVE");
  }, [offer]);

  async function refresh() {
    const controller = new AbortController();
    try {
      setErr(null);
      const res = await getMyWaitlistOffer({ signal: controller.signal });
      const o = pickOffer(res);

      // if API returns 404/no offer, you can handle it in apiGet; for now assume null/empty comes back
      setOffer(o || null);

      // set countdown baseline
      if (o?.expiresAt) {
        expiresAtRef.current = new Date(o.expiresAt).getTime();
        const secs = Math.max(0, Math.floor((expiresAtRef.current - Date.now()) / 1000));
        setRemaining(secs);
      } else if (typeof o?.remainingSeconds === "number") {
        expiresAtRef.current = Date.now() + o.remainingSeconds * 1000;
        setRemaining(o.remainingSeconds);
      } else {
        expiresAtRef.current = null;
        setRemaining(0);
      }
    } catch (e) {
      setErr(e?.message || "Failed to load waitlist offer");
      setOffer(null);
      expiresAtRef.current = null;
      setRemaining(0);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }

  useEffect(() => {
    let cleanup = null;
    (async () => {
      cleanup = await refresh();
    })();

    const t = setInterval(() => {
      refresh();
    }, pollMs);

    return () => {
      cleanup?.();
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  // local 1-second countdown tick (no extra API calls)
  useEffect(() => {
    if (!hasActiveOffer || !expiresAtRef.current) return;

    const tick = setInterval(() => {
      const secs = Math.max(0, Math.floor((expiresAtRef.current - Date.now()) / 1000));
      setRemaining(secs);

      // when expired, re-check backend quickly
      if (secs <= 0) {
        refresh();
      }
    }, 1000);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveOffer, offer?.id]);

  async function onAccept() {
    if (!offer?.id) return;
    try {
      setBusy(true);
      setErr(null);
      await acceptWaitlistOfferById(offer.id);
      await refresh();
    } catch (e) {
      setErr(e?.message || "Failed to accept offer");
    } finally {
      setBusy(false);
    }
  }

  async function onDecline() {
    if (!offer?.id) return;
    try {
      setBusy(true);
      setErr(null);
      await declineWaitlistOfferById(offer.id);
      await refresh();
    } catch (e) {
      setErr(e?.message || "Failed to decline offer");
    } finally {
      setBusy(false);
    }
  }

  const { date, time } = fmtRange(offer?.startUtc, offer?.endUtc);

  return (
    <aside className={`wo ${hasActiveOffer ? "wo--active" : ""}`}>
      <div className="wo__header">
        <div className="wo__titleRow">
          <div className="wo__title">Waitlist Offer</div>
          {hasActiveOffer ? (
            <span className="wo__pill wo__pill--active">OFFER ACTIVE</span>
          ) : (
            <span className="wo__pill">NO OFFER</span>
          )}
        </div>
        <div className="wo__desc">
          When someone cancels, you may receive a 10-minute offer.
        </div>
      </div>

      {loading ? <div className="wo__muted">Checking for offers...</div> : null}
      {err ? <div className="wo__error">{err}</div> : null}

      {!loading && !hasActiveOffer ? (
        showWhenEmpty ? (
          <div className="wo__empty">
            <div className="wo__emptyTitle">No active offers</div>
            <div className="wo__mutedSmall">We’ll keep checking automatically.</div>
          </div>
        ) : null
      ) : null}

      {hasActiveOffer ? (
        <div className="wo__card">
          <div className="wo__top">
            <div>
              <div className="wo__resource">{offer?.resourceName ?? "-"}</div>
              <div className="wo__sub">
                {(offer?.resourceType ?? "-") + " • " + date + " • " + time}
              </div>
            </div>

            <div className="wo__timer">
              <div className="wo__timerLabel">TIME REMAINING</div>
              <div className="wo__timerValue">{mmss(remaining)}</div>
            </div>
          </div>

          <div className="wo__note">
            A previous booking was cancelled. This slot is reserved exclusively for you
            for a limited time.
          </div>

          <div className="wo__actions">
            <button
              type="button"
              className="wo__btn wo__btn--primary"
              onClick={onAccept}
              disabled={busy || remaining <= 0}
            >
              {busy ? "Processing..." : "Claim Now"}
            </button>

            <button
              type="button"
              className="wo__btn"
              onClick={onDecline}
              disabled={busy || remaining <= 0}
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
