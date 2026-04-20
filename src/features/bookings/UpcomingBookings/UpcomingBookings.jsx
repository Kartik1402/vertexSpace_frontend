import React, { useEffect, useMemo, useState } from "react";
import { getUpcomingBookings, cancelBooking } from "../../../services/api"; // adjust path

const TZ = "Asia/Kolkata";

function fmtDate(iso) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function fmtTime(iso) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function ymdInTz(iso) {
  // returns YYYY-MM-DD in Asia/Kolkata for reliable date filtering
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export default function UpcomingBookings() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");

  // NEW: filters
  const [building, setBuilding] = useState("ALL");
  const [resourceType, setResourceType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [dateYmd, setDateYmd] = useState(""); // YYYY-MM-DD

  const [data, setData] = useState(null); // {bookings,totalCount,upcomingCount,pastCount}
  const bookings = data?.bookings ?? [];

  // NEW: dropdown options based on data
  const buildingOptions = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => b?.buildingName && set.add(String(b.buildingName)));
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [bookings]);

  const resourceTypeOptions = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => b?.resourceType && set.add(String(b.resourceType)));
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [bookings]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => b?.status && set.add(String(b.status)));
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return bookings.filter((b) => {
      // search
      if (q) {
        const hay = `${b?.resourceName || ""} ${b?.buildingName || ""} ${b?.floorName || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // building filter
      if (building !== "ALL" && String(b?.buildingName || "") !== building) return false;

      // type filter
      if (resourceType !== "ALL" && String(b?.resourceType || "") !== resourceType) return false;

      // status filter
      if (status !== "ALL" && String(b?.status || "") !== status) return false;

      // date filter (IST)
      if (dateYmd) {
        const start = b?.startTime;
        if (!start) return false;
        if (ymdInTz(start) !== dateYmd) return false;
      }

      return true;
    });
  }, [bookings, search, building, resourceType, status, dateYmd]);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await getUpcomingBookings();
      const payload = res?.data ?? res;

      console.log("Upcoming bookings response:", payload);
      setData(payload);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "Failed to load upcoming bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCancel = async (booking) => {
    const ok = window.confirm(`Cancel booking for "${booking.resourceName}"?`);
    if (!ok) return;

    try {
      setLoading(true);
      setErr("");
      await cancelBooking(booking.id);
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

 const controlStyle = {
  height: 38,
  borderRadius: 12,
  border: "1px solid #E8EEF6",
  padding: "0 12px",
  background: "#fff",
  fontWeight: 800,
  color: "#0f172a",
  fontFamily: '"Times New Roman", Times, serif',
};

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Top Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            style={{ ...controlStyle, width: 280, fontWeight: 700 }}
          />


          {/* NEW: Resource Type */}
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} style={controlStyle}>
            {resourceTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "ALL" ? "All Types" : opt}
              </option>
            ))}
          </select>

          {/* NEW: Date */}
          <input
            type="date"
            value={dateYmd}
            onChange={(e) => setDateYmd(e.target.value)}
            style={{ ...controlStyle, fontWeight: 700 ,  fontFamily: '"Times New Roman", Times, serif',}}
            aria-label="Filter by date (IST)"
          />

          {/* Keep Filters button (disabled) if you still want it */}
          <button
            type="button"
            disabled
            style={{ height: 38, padding: "0 14px", borderRadius: 12, border: "1px solid #E8EEF6", background: "#fff", fontWeight: 800, opacity: 0.6 ,  fontFamily: '"Times New Roman", Times, serif',}}
          >
            Filters
          </button>

          {/* NEW: Clear filters */}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setBuilding("ALL");
              setResourceType("ALL");
              setStatus("ALL");
              setDateYmd("");
            }}
            style={{ height: 38, padding: "0 14px", borderRadius: 12, border: "1px solid #E8EEF6", background: "#fff", fontWeight: 900 ,  fontFamily: '"Times New Roman", Times, serif'}}
          >
            Clear
          </button>
        </div>

        {!!data && (
          <div style={{ display: "flex", gap: 10, color: "#64748b", fontWeight: 700, fontSize: 13, flexWrap: "wrap" }}>
            <div>Total: {data.totalCount}</div>
            <div>Upcoming: {data.upcomingCount}</div>
            <div>Past: {data.pastCount}</div>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #E8EEF6", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 0.8fr 1.2fr 0.9fr 1.1fr",
            gap: 12,
            padding: 14,
            fontSize: 11,
            fontWeight: 900,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            background: "#f8fafc",
            borderBottom: "1px solid #eef2f7",
          }}
        >
          <div>Resource</div>
          <div>Type</div>
          <div>Date & Time (IST)</div>
          <div>Status</div>
          <div style={{ textAlign: "right" }}>Action</div>
        </div>

        {loading && <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>Loading…</div>}
        {!loading && err && <div style={{ padding: 16, color: "#b91c1c", fontWeight: 700 }}>{err}</div>}

        {!loading &&
          !err &&
          filtered.map((b) => (
            <div
              key={b.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2.2fr 0.8fr 1.2fr 0.9fr 1.1fr",
                gap: 12,
                padding: 14,
                borderTop: "1px solid #eef2f7",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eef2ff", border: "1px solid #e8eef6" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.resourceName}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.buildingName} • {b.floorName}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ display: "inline-flex", height: 24, alignItems: "center", padding: "0 10px", borderRadius: 999, border: "1px solid #e8eef6", fontSize: 11, fontWeight: 900, background: "#f8fafc" }}>
                  {b.resourceType}
                </span>
              </div>

              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{fmtDate(b.startTime)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                  {fmtTime(b.startTime)} - {fmtTime(b.endTime)}
                </div>
              </div>

              <div>
                <span style={{ display: "inline-flex", height: 24, alignItems: "center", padding: "0 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: "#dcfce7", color: "#166534" }}>
                  {b.status}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => onCancel(b)}
                  style={{ height: 34, padding: "0 14px", borderRadius: 12, fontWeight: 900, background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}

        {!loading && !err && filtered.length === 0 && (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>No upcoming bookings found.</div>
        )}
      </div>
    </div>
  );
}
