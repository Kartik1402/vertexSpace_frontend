import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiGet } from "../../services/api";
import { getAuth } from "../../services/authStorage";
import { apiUrl } from "../../services/config";
import "../AdminResourcesMain/adminResourcesMain.css";

const API_BOOKINGS_ALL = apiUrl("/api/v1/bookings/all");
const API_BOOKING_CANCEL = (id) => apiUrl(`/api/v1/bookings/${id}`);

function normalizeBookings(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.bookings)) return data.bookings;
  return [];
}

function roleFromAuth() {
  const auth = getAuth?.() ?? null;
  return (
    auth?.role ||
    auth?.user?.role ||
    auth?.userRole ||
    (Array.isArray(auth?.roles) ? auth.roles[0] : null) ||
    ""
  );
}

function departmentFromAuth() {
  const auth = getAuth?.() ?? null;
  return (
    auth?.departmentName ||
    auth?.user?.departmentName ||
    auth?.userDepartmentName ||
    auth?.department ||
    auth?.user?.department ||
    ""
  );
}

const norm = (s) => String(s || "").trim().toLowerCase();

function fmt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function AdminBookingsMain() {
  const role = roleFromAuth();
  const myDept = departmentFromAuth();

  const isSystemAdmin = role === "SYSTEM_ADMIN";
  const isDeptAdmin = role === "DEPT_ADMIN";
  const canAccess = isSystemAdmin || isDeptAdmin;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const abortRef = useRef(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await apiGet(API_BOOKINGS_ALL, { signal: controller.signal });
      const list = normalizeBookings(data);
      list.sort((a, b) => new Date(b?.startTime).getTime() - new Date(a?.startTime).getTime());
      setRaw(list);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load bookings.");
      setRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    fetchBookings();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  useEffect(() => setPage(1), [q, status, pageSize]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return raw.filter((b) => {
      const hay = [
        b?.resourceName,
        b?.resourceType,
        b?.buildingName,
        b?.floorName,
        b?.userDisplayName,
        b?.userEmail,
        b?.userDepartmentName,
        b?.purpose,
        b?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okQ = !query || hay.includes(query);
      const okStatus = !status || String(b?.status || "").toUpperCase() === status;
      return okQ && okStatus;
    });
  }, [raw, q, status]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const canSeeCancel = (b) => {
    if (isSystemAdmin) return true;
    if (isDeptAdmin && norm(myDept) && norm(b?.userDepartmentName) === norm(myDept)) return true;
    return false;
  };

  const onCancel = async (bookingId) => {
    // optimistic UI update (we only allow cancelling CONFIRMED bookings)
    setRaw((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b)));

    try {
      await apiDelete(API_BOOKING_CANCEL(bookingId));
    } catch (e) {
      // rollback if delete fails
      setRaw((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "CONFIRMED" } : b)));
      throw e;
    }
  };

  if (!canAccess) {
    return (
      <main className="admRes">
        <div className="admRes__error">You don’t have access to Bookings.</div>
      </main>
    );
  }

  return (
    <main className="admRes">
      <div className="admRes__head">
        <div>
          <div className="admRes__title">Bookings</div>
          <div className="admRes__sub">
            {loading ? "Loading…" : `${total} booking${total === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="admRes__headActions">
          <button
            type="button"
            className="admRes__btn admRes__btn--ghost"
            onClick={fetchBookings}
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="admRes__filters">
        <input
          className="admRes__input admRes__input--wide"
          placeholder="Search bookings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select className="admRes__input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status (All)</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="PENDING_WAITLIST">Pending waitlist</option>
        </select>

        <select
          className="admRes__input admRes__input--small"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
      </div>

      {error && <div className="admRes__error">{error}</div>}

      <div className="admRes__card">
        <div className="admRes__tableWrap" role="region" aria-label="Bookings table">
          <table className="admRes__table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>User</th>
                <th>Department</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th className="admRes__thRight">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="admRes__empty">
                    No bookings match your filters.
                  </td>
                </tr>
              )}

              {pageRows.map((b) => {
                const statusUpper = String(b?.status || "").toUpperCase();
                const isConfirmed = statusUpper === "CONFIRMED";

                return (
                  <tr key={b.id} className="admRes__row">
                    <td>
                      <div className="admRes__name">{b?.resourceName || "—"}</div>
                      <div className="admRes__muted">
                        {b?.resourceType || "—"} • {b?.buildingName || "—"} • {b?.floorName || "—"}
                      </div>
                    </td>

                    <td>
                      <div className="admRes__name">{b?.userDisplayName || "—"}</div>
                      <div className="admRes__muted">{b?.userEmail || "—"}</div>
                    </td>

                    <td>{b?.userDepartmentName || "—"}</td>

                    <td>
                      <span className="admRes__pill">{b?.status || "—"}</span>
                    </td>

                    <td>{fmt(b?.startTime)}</td>
                    <td>{fmt(b?.endTime)}</td>

                    <td className="admRes__tdRight">
                      {canSeeCancel(b) && isConfirmed && (
                        <button
                          type="button"
                          className="admRes__linkBtn admRes__linkBtn--danger"
                          disabled={loading}
                          onClick={async () => {
                            const ok = window.confirm(`Cancel booking "${b?.id}"?`);
                            if (!ok) return;

                            try {
                              await onCancel(b.id);
                            } catch (e) {
                              setError(e?.message || "Cancel failed.");
                            }
                          }}
                          title="Cancel this booking"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="admRes__pager">
          <button
            type="button"
            className="admRes__btn admRes__btn--ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Prev
          </button>

          <div className="admRes__pagerInfo">
            Page {page} of {totalPages}
          </div>

          <button
            type="button"
            className="admRes__btn admRes__btn--ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
