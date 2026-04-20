import React, { useEffect, useMemo, useState } from "react";
import { getWaitlistEntries, withdrawWaitlistEntryById } from "../../../services/api";
import "./WaitlistPanel.css";

function normalizeWaitlistResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.entries)) return res.entries;
  if (Array.isArray(res?.waitlistEntries)) return res.waitlistEntries;
  return [];
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

export default function WaitlistPanel({ compact = false }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [items, setItems] = useState([]);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await getWaitlistEntries({ signal: controller.signal });
        setItems(normalizeWaitlistResponse(res));
      } catch (e) {
        if (e?.name !== "AbortError") setErr(e?.message || "Failed to load waitlist");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const activeCount = useMemo(() => {
    return items.filter((x) => String(x?.status || "").toUpperCase() === "ACTIVE").length;
  }, [items]);

  async function onWithdraw(id) {
    if (!id) return;

    try {
      setWithdrawingId(id);
      await withdrawWaitlistEntryById(id);
      setItems((prev) => prev.filter((x) => x?.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to withdraw request");
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <aside className={`wl ${compact ? "wl--compact" : ""}`}>
      <div className="wl__header">
        <div className="wl__titleRow">
          <div className="wl__title">Waitlist Section</div>
          <span className="wl__badge">{activeCount} ACTIVE</span>
        </div>
        <div className="wl__desc">Items currently unavailable. You will be notified if a slot opens up.</div>
      </div>

      {loading ? <div className="wl__muted">Loading waitlist...</div> : null}
      {err ? <div className="wl__error">{err}</div> : null}

      {!loading && !err && items.length === 0 ? (
        <div className="wl__empty">
          <div className="wl__emptyTitle">No waitlist items</div>
          <div className="wl__mutedSmall">You don’t have any active requests.</div>
        </div>
      ) : null}

      <div className="wl__list">
        {items.map((w) => {
          const { date, time } = fmtRange(w?.startUtc, w?.endUtc);
          const pos = w?.queuePosition ?? null;

          const statusUpper = String(w?.status || "").toUpperCase();
          const isExpired = statusUpper === "EXPIRED";
          const isCancelled = statusUpper === "CANCELLED"
          const isWithdrawing = withdrawingId === w?.id;

          return (
            <div className="wl__card" key={w?.id}>
              <div className="wl__cardTop">
                <div className="wl__cardLeft">
                  <div className="wl__resource">{w?.resourceName ?? "-"}</div>
                  <div className="wl__message">{w?.message || w?.purpose || ""}</div>
                </div>

                <div className="wl__cardRight">
                  {pos !== null ? <span className="wl__posPill">Pos #{pos}</span> : null}
                </div>
              </div>

              <div className="wl__meta">
                <div className="wl__metaItem">
                  <span className="wl__metaLabel">Date</span>
                  <span className="wl__metaValue">{date}</span>
                </div>

                <div className="wl__metaItem">
                  <span className="wl__metaLabel">Time</span>
                  <span className="wl__metaValue">{time}</span>
                </div>

                <div className="wl__metaItem">
                  <span className="wl__metaLabel">Status</span>
                  <span className={`wl__status wl__status--${String(w?.status || "").toLowerCase()}`}>
                    {w?.status ?? "-"}
                  </span>
                </div>
              </div>

              {!isExpired && !isCancelled ? (
                <button
                  type="button"
                  className="wl__withdrawBtn"
                  onClick={() => onWithdraw(w?.id)}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw Request"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
