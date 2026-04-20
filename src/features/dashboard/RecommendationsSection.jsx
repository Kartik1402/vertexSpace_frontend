import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../services/api";
import { apiUrl } from "../../services/config";
import ResourceDetailsModal from "../../shared/components/ResourceDetailsModal/ResourceDetailsModal";
import { useNavigate } from "react-router-dom";

// If you later add images, return them from typeToImage()
// import roomImg from "../../assets/images/resources/room.png";
// import deskImg from "../../assets/images/resources/desk.png";
// import parkingImg from "../../assets/images/resources/parking.png";

function pickTag(bookingCount) {
  const n = Number(bookingCount || 0);
  if (n >= 1 && n <= 2) return "FREQUENT";
  if (n >= 3 && n <= 5) return "HIGH USAGE";
  if (n > 5) return "POWER USER";
  return "RECOMMENDED";
}

function typeToImage(resourceType) {
  const t = String(resourceType || "").toUpperCase();
  // if (t.includes("PARK")) return parkingImg;
  // if (t.includes("DESK") || t.includes("POD")) return deskImg;
  // return roomImg;
  return null;
}

function typeToMonogram(resourceType) {
  const t = String(resourceType || "").toUpperCase();
  if (t.includes("PARK")) return "P";
  if (t.includes("DESK") || t.includes("POD")) return "D";
  return "R";
}

function formatLastBooked(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfToday - startOfThat) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 14) return `${diffDays} days ago`;

  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
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

function RecommendationsSection() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError("");

    apiGet(apiUrl("/api/v1/me/recommendations"), { signal: ctrl.signal })
      .then((data) => {
        const list = Array.isArray(data?.recommendations) ? data.recommendations : [];
        const top = [...list]
          .sort((a, b) => {
            const bc = Number(b.bookingCount || 0) - Number(a.bookingCount || 0);
            if (bc !== 0) return bc;
            return new Date(b.lastBookedAt || 0) - new Date(a.lastBookedAt || 0);
          })
          .slice(0, 3);
        setRows(top);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load recommendations.");
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, []);

  const styles = useMemo(
    () => ({
      section: { marginTop: 18 },
      head: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
      titleWrap: { display: "flex", alignItems: "center", gap: 10 },
      sparkle: {
        width: 18,
        height: 18,
        borderRadius: 6,
        background: "#E8F0FF",
        display: "grid",
        placeItems: "center",
        color: "#1A5CFF",
        fontWeight: 900,
      },
      title: { fontSize: 16, fontWeight: 800, color: "#0F172A" },
      hint: { fontSize: 12, color: "#64748B" },
      grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 },
      card: {
        border: "1px solid #E8EEF6",
        borderRadius: 16,
        background: "#fff",
        padding: 16,
        cursor: "pointer",
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "0 2px 0 rgba(15,23,42,0.02)",
      },
      topRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
      imgWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "#F3F7FF",
        border: "1px solid #E8EEF6",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      },
      img: { width: "100%", height: "100%", objectFit: "cover" },
      mono: { fontWeight: 950, color: "#1A5CFF" },
      pill: {
        fontSize: 10,
        fontWeight: 800,
        padding: "4px 8px",
        borderRadius: 999,
        background: "#E9F9EE",
        color: "#166534",
        border: "1px solid #CFF3DA",
        letterSpacing: "0.06em",
      },
      name: { fontSize: 14, fontWeight: 800, color: "#0F172A" },
      sub: { fontSize: 12, color: "#64748B" },
      btn: {
        marginTop: "auto",
        height: 36,
        borderRadius: 12,
        border: "1px solid #E8EEF6",
        background: "#F9FBFF",
        fontWeight: 700,
        cursor: "pointer",
        opacity: 0.9,
      },
      skeleton: { borderRadius: 16, border: "1px solid #E8EEF6", background: "#fff", padding: 16, minHeight: 120 },
      err: { padding: 12, borderRadius: 12, border: "1px solid #FECACA", background: "#FEF2F2", color: "#991B1B", fontSize: 13 },
      empty: { padding: 12, borderRadius: 12, border: "1px dashed #CBD5E1", background: "#fff", color: "#64748B", fontSize: 13 },
      responsiveStyleText: `
        @media (max-width: 980px) {
          .recGrid { grid-template-columns: 1fr; }
        }
      `,
    }),
    []
  );

  const openDetails = (resourceId) => {
    setSelectedId(resourceId);
    setDetailsOpen(true);
  };

  const onQuickBook = (r) => {
    // Defaults: next 15-min slot, 60-min duration (user can change on Book Resource page)
    const startTime = nextRoundedISO(15);
    const endTime = addMinutesISO(startTime, 60);

    navigate("/book-resource", {
      state: {
        resourceId: r.resourceId,
        resourceName: r.resourceName,
        resourceType: r.resourceType,
        startTime,
        endTime,
        bufferMinutes: 15,
        purpose: "",
      },
    });
  };

  return (
    <section style={styles.section}>
      <style>{styles.responsiveStyleText}</style>

      <div style={styles.head}>
        <div style={styles.titleWrap}>
          <div style={styles.sparkle} aria-hidden="true">✦</div>
          <div style={styles.title}>Recommended for You</div>
        </div>
        <div style={styles.hint}>Top 3 Most-Booked</div>
      </div>

      {error && <div style={styles.err}>{error}</div>}

      {!error && (
        <div className="recGrid" style={styles.grid}>
          {loading && [0, 1, 2].map((i) => <div key={i} style={styles.skeleton} />)}

          {!loading && rows.length === 0 && <div style={styles.empty}>No recommendations yet.</div>}

          {!loading &&
            rows.map((r) => {
              const imgSrc = typeToImage(r.resourceType);

              return (
                <div
                  key={r.resourceId}
                  style={styles.card}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(r.resourceId)}
                  onKeyDown={(e) => e.key === "Enter" && openDetails(r.resourceId)}
                >
                  <div style={styles.topRow}>
                    <div style={styles.imgWrap}>
                      {imgSrc ? (
                        <img alt="" src={imgSrc} style={styles.img} />
                      ) : (
                        <div style={styles.mono}>{typeToMonogram(r.resourceType)}</div>
                      )}
                    </div>
                    <div style={styles.pill}>{pickTag(r.bookingCount)}</div>
                  </div>

                  <div style={styles.name}>{r.resourceName}</div>
                  <div style={styles.sub}>Last Booked: {formatLastBooked(r.lastBookedAt)}</div>

                  <button
                    type="button"
                    style={styles.btn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBook(r);
                    }}
                  >
                    QuickBook
                  </button>
                </div>
              );
            })}
        </div>
      )}

      <ResourceDetailsModal
        open={detailsOpen}
        resourceId={selectedId}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}

export default RecommendationsSection;
