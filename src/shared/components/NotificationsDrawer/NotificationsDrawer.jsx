import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../../../services/api";
import { apiUrl } from "../../../services/config";
import "./notificationsDrawer.css";

const LIST_ENDPOINT = apiUrl("/api/v1/notifications");
const READ_ONE_ENDPOINT = (id) => apiUrl(`/api/v1/notifications/${id}/read`);
const READ_ALL_ENDPOINT = apiUrl("/api/v1/notifcations/readAll");

function fmt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function statusIsUnread(n) {
  return String(n?.status || "").toUpperCase() === "UNREAD";
}

function typeBadge(type) {
  const t = String(type || "INFO").toUpperCase();
  if (t.includes("WAITLIST")) return "OFFER";
  if (t.includes("CANCEL")) return "ALERT";
  return "INFO";
}

export default function NotificationsDrawer({
  open,
  onClose,
  onUnreadCountChange,
}) {
  const [tab, setTab] = useState("unread"); // unread | all
  const [page, setPage] = useState(0); // 0-based
  const [size, setSize] = useState(20);
  const [sort, setSort] = useState("createdAt"); // createdAt | priority | status
  const [direction, setDirection] = useState("desc"); // asc | desc

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const items = data?.content || [];
  const totalElements = Number(data?.totalElements || 0);
  const totalPages = Number(data?.totalPages || 1);
  const last = Boolean(data?.last);

  const unreadCount = useMemo(() => items.filter(statusIsUnread).length, [items]);

  const visible = useMemo(() => {
    if (tab === "all") return items;
    return items.filter(statusIsUnread);
  }, [items, tab]);

  const buildListUrl = () => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(size));
    if (sort) qs.set("sort", sort);
    if (direction) qs.set("direction", direction);
    return `${LIST_ENDPOINT}?${qs.toString()}`;
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet(buildListUrl());
      setData(res);
    } catch (e) {
      setError(e?.message || "Failed to load notifications.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, size, sort, direction]);

  useEffect(() => {
    if (!open) return;
    onUnreadCountChange?.(unreadCount);
  }, [open, unreadCount, onUnreadCountChange]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const markOneRead = async (id) => {
    if (!id) return;
    setBusyId(id);
    setError("");

    // optimistic
    setData((prev) => {
      if (!prev?.content) return prev;
      return {
        ...prev,
        content: prev.content.map((n) =>
          n.id === id ? { ...n, status: "READ", readAt: new Date().toISOString() } : n
        ),
      };
    });

    try {
      await apiPatch(READ_ONE_ENDPOINT(id));
    } catch (e) {
      setError(e?.message || "Failed to mark as read.");
      // rollback by refetching
      await fetchList();
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setLoading(true);
    setError("");

    // optimistic
    setData((prev) => {
      if (!prev?.content) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        content: prev.content.map((n) => ({ ...n, status: "READ", readAt: n.readAt || now })),
      };
    });

    try {
      await apiPatch(READ_ALL_ENDPOINT);
    } catch (e) {
      setError(e?.message || "Failed to mark all as read.");
      await fetchList();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="nd__overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <aside className="nd__drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="nd__head">
          <div>
            <div className="nd__title">Notifications</div>
            <div className="nd__sub">
              {loading ? "Loading…" : `${totalElements} total • ${unreadCount} unread`}
            </div>
          </div>

          <button className="nd__close" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="nd__controls">
          <div className="nd__tabs">
            <button
              type="button"
              className={`nd__tab ${tab === "unread" ? "isActive" : ""}`}
              onClick={() => setTab("unread")}
            >
              Unread
            </button>
            <button
              type="button"
              className={`nd__tab ${tab === "all" ? "isActive" : ""}`}
              onClick={() => setTab("all")}
            >
              All
            </button>
          </div>

          <div className="nd__filters">
            <select className="nd__select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="createdAt">Sort: createdAt</option>
              <option value="priority">Sort: priority</option>
              <option value="status">Sort: status</option>
            </select>

            <select className="nd__select" value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </div>
        </div>

        <div className="nd__body">
          {error && !loading ? <div className="nd__error">{error}</div> : null}

          {!loading && visible.length === 0 ? (
            <div className="nd__empty">No notifications in this view.</div>
          ) : null}

          {visible.map((n) => {
            const badge = typeBadge(n.type);
            const unread = statusIsUnread(n);

            const offerId = n?.metadata?.offerId;
            const minutesRemaining = n?.metadata?.minutesRemaining;
            const timeSlot = n?.metadata?.timeSlot;

            return (
              <div key={n.id} className={`nd__card ${unread ? "isUnread" : ""}`}>
                <div className="nd__cardTop">
                  <span className={`nd__pill nd__pill--${badge}`}>{badge}</span>
                  <span className="nd__time">{fmt(n.createdAt)}</span>
                </div>

                <div className="nd__cardTitle">{n.title}</div>
                <div className="nd__cardMsg">{n.message}</div>

                {timeSlot ? (
                  <div className="nd__meta">
                    <span className="nd__metaKey">Slot:</span> {timeSlot}
                  </div>
                ) : null}

                {badge === "OFFER" ? (
                  <div className="nd__meta">
                    <span className="nd__metaKey">Offer:</span> {offerId || "—"} •{" "}
                    <span className="nd__metaKey">Mins left:</span> {minutesRemaining || "—"}
                  </div>
                ) : null}

                <div className="nd__actions">
                  <button
                    className="nd__btn"
                    type="button"
                    onClick={() => markOneRead(n.id)}
                    disabled={!unread || busyId === n.id || loading}
                  >
                    {busyId === n.id ? "Marking…" : unread ? "Mark as read" : "Read"}
                  </button>
                  
                   {badge === "OFFER" && (
                   <span className="nd_metaKey">
                   Move to My Bookings to accept the offer in time.
                   </span>
                      )}
                    
        

                  {/* Accept/Decline endpoints not provided yet — keep UI ready
                  {badge === "OFFER" ? (
                    <>
                      <button className="nd__btn nd__btn--primary" type="button">
                        Claim now
                      </button>
                      <button className="nd__btn" type="button">
                        Decline
                      </button>
                    </>
                  ) : null} */}
                </div>
              </div>
            );
          })}
        </div>

        <div className="nd__footer">
          <div className="nd__pager">
            <button
              className="nd__footerBtn"
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={loading || page <= 0}
            >
              Prev
            </button>
            <div className="nd__pagerInfo">
              Page {page + 1} / {Math.max(1, totalPages)}
            </div>
            <button
              className="nd__footerBtn"
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || last}
            >
              Next
            </button>
          </div>

          <div className="nd__footerRight">
            <button className="nd__footerBtn" type="button" onClick={markAllRead} disabled={loading || unreadCount === 0}>
              Mark all read
            </button>
            <button className="nd__footerBtn" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
