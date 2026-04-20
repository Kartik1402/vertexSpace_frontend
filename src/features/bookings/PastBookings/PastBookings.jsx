import React, { useEffect, useMemo, useState } from "react";
import { getPastBookings } from "/src/services/api.js";
import  "./PastBookings.css"

function fmtRange(startISO, endISO) {
  const start = startISO ? new Date(startISO) : null;
  const end = endISO ? new Date(endISO) : null;

  const date = start
    ? start.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
    : "-";

  const time =
    start && end
      ? `${start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString(
          undefined,
          { hour: "2-digit", minute: "2-digit" }
        )}`
      : "-";

  return { date, time };
}

export default function PastBookings() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [payload, setPayload] = useState({
    bookings: [],
    totalCount: 0,
    upcomingCount: 0,
    pastCount: 0,
  });

  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await getPastBookings({ signal: controller.signal });

        setPayload({
          bookings: Array.isArray(res?.bookings) ? res.bookings : [],
          totalCount: Number(res?.totalCount ?? 0),
          upcomingCount: Number(res?.upcomingCount ?? 0),
          pastCount: Number(res?.pastCount ?? 0),
        });
      } catch (e) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Failed to load past bookings");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payload.bookings;

    return payload.bookings.filter((b) => {
      const hay = [
        b?.resourceName,
        b?.resourceType,
        b?.buildingName,
        b?.floorName,
        b?.status,
        b?.purpose,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [payload.bookings, query]);

  if (loading) return <div className="bookingsCard">Loading past bookings...</div>;
  if (err) return <div className="bookingsCard bookingsCard--error">{err}</div>;

  return (
    <section className="bookingsCard">
      <header className="bookingsCard__header">
        <div>
          <div className="bookingsCard__title">Past Bookings</div>
          <div className="bookingsCard__sub">
            Showing {filtered.length} of {payload.pastCount}
          </div>
        </div>

        <input
          className="bookingsCard__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search past bookings..."
          aria-label="Search past bookings"
        />
      </header>

      {filtered.length === 0 ? (
        <div className="bookingsCard__empty">No past bookings found.</div>
      ) : (
        <div className="bookingsTableWrap">
          <table className="bookingsTable">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th style={{ width: 110 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((b) => {
                const { date, time } = fmtRange(b?.startTime, b?.endTime);
                const isOpen = openId === b?.id;

                return (
                  <React.Fragment key={b?.id}>
                    <tr>
                      <td>
                        <div className="cellMain">{b?.resourceName ?? "-"}</div>
                        <div className="cellSub">
                          {(b?.buildingName || "-") + " • " + (b?.floorName || "-")}
                        </div>
                      </td>
                      <td>{b?.resourceType ?? "-"}</td>
                      <td>{date}</td>
                      <td>{time}</td>
                      <td>
                        <span className={`statusPill statusPill--${String(b?.status || "").toLowerCase()}`}>
                          {b?.status ?? "-"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => setOpenId(isOpen ? null : b?.id)}
                        >
                          {isOpen ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr className="detailsRow">
                        <td colSpan={6}>
                          <div className="detailsGrid">
                            <div>
                              <div className="detailsLabel">Booking ID</div>
                              <div className="detailsValue">{b?.id}</div>
                            </div>
                            <div>
                              <div className="detailsLabel">Purpose</div>
                              <div className="detailsValue">{b?.purpose ?? "-"}</div>
                            </div>
                            <div>
                              <div className="detailsLabel">Created</div>
                              <div className="detailsValue">
                                {b?.createdAt ? new Date(b.createdAt).toLocaleString() : "-"}
                              </div>
                            </div>
                            <div>
                              <div className="detailsLabel">Updated</div>
                              <div className="detailsValue">
                                {b?.updatedAt ? new Date(b.updatedAt).toLocaleString() : "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
