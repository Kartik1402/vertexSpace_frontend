import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../../services/api";
import { apiUrl } from "../../../services/config";
import { useNavigate } from "react-router-dom";
import RecurringBookingModal from "../RecurringBookingModal/RecurringBookingModal"; // adjust path

function formatMaybe(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function nextRoundedISO(stepMinutes = 15) {
  const now = new Date();
  const ms = now.getTime();
  const step = stepMinutes * 60 * 1000;
  const rounded = new Date(Math.ceil(ms / step) * step);
  return rounded.toISOString();
}

function addMinutesISO(iso, minutes) {
  const d = new Date(iso);
  return new Date(d.getTime() + minutes * 60 * 1000).toISOString();
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

const DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function ResourceDetailsModal({ open, resourceId, onClose }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [recOpen, setRecOpen] = useState(false);

  useEffect(() => {
    if (!open || !resourceId) return;

    const ctrl = new AbortController();
    setLoading(true);
    setError("");
    setDetails(null);

    apiGet(apiUrl(`/api/v1/resources/${resourceId}`), { signal: ctrl.signal })
      .then((data) => setDetails(data))
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load resource details.");
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [open, resourceId]);

  // Supports: {resource:{...}} or {...}
  const d = details?.resource || details || {};
  const canBook = !loading && !error && !!resourceId;

  const styles = useMemo(
    () => ({
      overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: open ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      },
      modal: {
        width: "min(720px, 100%)",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        border: "1px solid #E8EEF6",
        overflow: "hidden",
      },
      head: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px",
        borderBottom: "1px solid #E8EEF6",
      },
      title: { fontSize: 16, fontWeight: 700, color: "#0F172A" },
      close: {
        border: "1px solid #E8EEF6",
        background: "#fff",
        borderRadius: 10,
        width: 36,
        height: 36,
        cursor: "pointer",
      },
      body: { padding: 18 },
      grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 },
      item: { border: "1px solid #E8EEF6", borderRadius: 12, padding: 12, background: "#F9FBFF" },
      k: { fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" },
      v: { marginTop: 6, fontSize: 14, fontWeight: 600, color: "#0F172A" },
      footer: {
        padding: 18,
        borderTop: "1px solid #E8EEF6",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        flexWrap: "wrap",
      },
      btn: {
        height: 40,
        padding: "0 14px",
        borderRadius: 12,
        border: "1px solid #E8EEF6",
        background: "#fff",
        fontWeight: 600,
        cursor: "pointer",
      },
      primary: (disabled) => ({
        height: 40,
        padding: "0 14px",
        borderRadius: 12,
        border: 0,
        background: "#1A5CFF",
        color: "#fff",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }),
      hint: { fontSize: 12, color: "#64748B", marginTop: 6 },
      error: {
        padding: 12,
        borderRadius: 12,
        border: "1px solid #FECACA",
        background: "#FEF2F2",
        color: "#991B1B",
        fontSize: 13,
      },
    }),
    [open]
  );

  const recSeed = useMemo(() => {
    const startTime = nextRoundedISO(15);
    const endTime = addMinutesISO(startTime, 60);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const day = DAY_NAMES[new Date(startTime).getUTCDay()] || "WEDNESDAY";

    return {
      resourceId: resourceId || "",
      startTime,
      endTime,
      bufferMinutes: 60,
      purpose: "",
      pattern: "WEEKLY",
      daysOfWeek: [day],
      endType: "END_DATE",
      recurrenceEndDate: addDaysISO(startTime, 14),
      timezone: tz,
      conflictResolution: "SKIP_CONFLICTS",
      resourceName: d.resourceName || d.name || "",
      resourceType: d.resourceType || d.type || "",
    };
  }, [resourceId, d?.resourceName, d?.name, d?.resourceType, d?.type]);

  const onBook = () => {
    if (!canBook) return;

    const startTime = nextRoundedISO(15);
    const endTime = addMinutesISO(startTime, 60);

    navigate("/book-resource", {
      state: {
        resourceId,
        resourceName: d.resourceName || d.name || "",
        resourceType: d.resourceType || d.type || "",
        startTime,
        endTime,
        bufferMinutes: 15,
        purpose: "",
      },
    });
  };

  if (!open) return null;

  return (
    <>
      <div style={styles.overlay} onMouseDown={onClose} role="dialog" aria-modal="true">
        <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
          <div style={styles.head}>
            <div style={styles.title}>{formatMaybe(d.resourceName || d.name || "Resource Details")}</div>
            <button type="button" style={styles.close} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <div style={styles.body}>
            {loading && <div style={styles.hint}>Loading details…</div>}
            {error && !loading && <div style={styles.error}>{error}</div>}

            {!loading && !error && (
              <>
                <div style={styles.hint}>
                  Type: <b>{formatMaybe(d.resourceType || d.type)}</b>
                </div>

                <div style={styles.grid}>
                  <div style={styles.item}>
                    <div style={styles.k}>Building</div>
                    <div style={styles.v}>{formatMaybe(d.buildingName)}</div>
                  </div>
                  <div style={styles.item}>
                    <div style={styles.k}>Floor</div>
                    <div style={styles.v}>{formatMaybe(d.floorName)}</div>
                  </div>
                  <div style={styles.item}>
                    <div style={styles.k}>Capacity</div>
                    <div style={styles.v}>{formatMaybe(d.capacity)}</div>
                  </div>
                  <div style={styles.item}>
                    <div style={styles.k}>Department</div>
                    <div style={styles.v}>{formatMaybe(d.owningDepartmentName)}</div>
                  </div>
                </div>

                <div style={styles.hint}>
                  Booking opens with a default 1-hour slot; you can edit on the next screen.
                </div>
              </>
            )}
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.btn} onClick={onClose}>
              Close
            </button>

            <button
              type="button"
              style={styles.btn}
              disabled={!canBook}
              onClick={() => setRecOpen(true)}
              title="Create recurring booking"
            >
              Recurring Booking
            </button>

            <button type="button" style={styles.primary(!canBook)} disabled={!canBook} onClick={onBook}>
              Book Resource
            </button>
          </div>
        </div>
      </div>

      <RecurringBookingModal open={recOpen} onClose={() => setRecOpen(false)} seed={recSeed} />
    </>
  );
}

export default ResourceDetailsModal;
