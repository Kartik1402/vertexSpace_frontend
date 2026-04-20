import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../services/api";
import { getAuth } from "../../services/authStorage";
import { apiUrl } from "../../services/config";
import ResourceDialog from "./ResourceDialog";
import "./adminResourcesMain.css";

const API_LIST = apiUrl("/api/v1/resources");
const API_DELETE = (id) => apiUrl(`/api/v1/resources/${id}`);
const API_PATCH = (id) => apiUrl(`/api/v1/resource/${id}`);
const API_CREATE = apiUrl("/api/v1/resources");

const API_ASSIGNMENT_MODE_PATCH = (resourceId, newMode) =>
  apiUrl(`/api/v1/resources/${resourceId}/assignment-mode?newMode=${encodeURIComponent(newMode)}`);
const API_DESK_ASSIGN = apiUrl("/api/v1/desk-assignments");

const onCreateDeskAssignment = async (payload) => {
  // payload = { deskId, userId, startUtc, endUtc, notes }
  return await apiPost(API_DESK_ASSIGN, payload);
};

// in <ResourceDialog ... />
// onCreateDeskAssignment={onCreateDeskAssignment}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.resources)) return data.resources;
  return [];
}

function roleFromAuth() {
  const auth = getAuth?.() ?? null;
  // Support a few common shapes
  return (
    auth?.role ||
    auth?.user?.role ||
    auth?.userRole ||
    (Array.isArray(auth?.roles) ? auth.roles[0] : null) ||
    ""
  );
}

function labelType(t) {
  const v = String(t || "").toUpperCase();
  if (!v) return "—";
  return v.replaceAll("_", " ");
}

function statusLabel(isActive) {
  if (typeof isActive !== "boolean") return "—";
  return isActive ? "Active" : "Maintenance";
}

export default function AdminResourcesMain() {
  const role = roleFromAuth();
  const canManage = role === "SYSTEM_ADMIN";
  const isSystemAdmin = role === "SYSTEM_ADMIN"; // NEW (explicit prop for dialog)

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState([]);

  // UI state
  const [q, setQ] = useState("");
  const [type, setType] = useState(""); // e.g., ROOM / DESK / PARKING
  const [status, setStatus] = useState(""); // "", "ACTIVE", "MAINTENANCE"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view"); // "view" | "create" | "edit"
  const [selected, setSelected] = useState(null);

  const abortRef = useRef(null);

  const fetchResources = async () => {
    setLoading(true);
    setError("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Backend supports only limited filtering now; do all filtering client-side.
      const data = await apiGet(API_LIST, { signal: controller.signal });
      setRaw(normalizeList(data));
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load resources.");
      setRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [q, type, status, pageSize]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return raw.filter((r) => {
      const name = String(r?.name || "").toLowerCase();

      const okQ = !query || name.includes(query);
      const okType = !type || String(r?.resourceType || "").toUpperCase() === type;
      const okStatus =
        !status ||
        (status === "ACTIVE" && r?.isActive === true) ||
        (status === "MAINTENANCE" && r?.isActive === false);

      return okQ && okType && okStatus;
    });
  }, [raw, q, type, status]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const openView = (row) => {
    setSelected(row);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const openCreate = () => {
    setSelected(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const onCreate = async (payload) => {
    await apiPost(API_CREATE, payload);
    await fetchResources();
  };

  const onUpdate = async (id, patch) => {
    await apiPatch(API_PATCH(id), patch);
    await fetchResources();
  };

  const onDelete = async (id) => {
    await apiDelete(API_DELETE(id));
    await fetchResources();
  };

  // NEW: assignment mode change handler for ResourceDialog
  const onChangeAssignmentMode = async (resourceId, newMode) => {
    // Endpoint uses query param and typically no body.
    // If your apiPatch requires a body, pass {} instead of null.
    const updated = await apiPatch(API_ASSIGNMENT_MODE_PATCH(resourceId, newMode), null);

    const nextMode = updated?.assignment_mode ?? newMode;

    // Update list + currently selected so UI reflects change immediately
    setRaw((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, assignment_mode: nextMode } : r))
    );

    setSelected((prev) =>
      prev?.id === resourceId ? { ...prev, assignment_mode: nextMode } : prev
    );

    return updated;
  };
    const onCreateDeskAssignment = async (payload) => {
    const res = await apiPost(API_DESK_ASSIGN, payload);
    const deskId = payload?.deskId;

    if (deskId) {
      setRaw((prev) => prev.map((r) => (r.id === deskId ? { ...r, desk_is_assigned: true } : r)));
      setSelected((prev) => (prev?.id === deskId ? { ...prev, desk_is_assigned: true } : prev));
    }

    return res;
  };

  return (
    <main className="admRes">
      <div className="admRes__head">
        <div>
          <div className="admRes__title">All Resources</div>
          <div className="admRes__sub">
            {loading ? "Loading…" : `${total} resource${total === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="admRes__headActions">
          <button
            type="button"
            className="admRes__btn admRes__btn--ghost"
            onClick={fetchResources}
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              className="admRes__btn admRes__btn--primary"
              onClick={openCreate}
              disabled={loading}
            >
              + Add Resource
            </button>
          )}
        </div>
      </div>

      <div className="admRes__filters">
        <input
          className="admRes__input admRes__input--wide"
          placeholder="Search resources by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select className="admRes__input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Type (All)</option>
          <option value="ROOM">Room</option>
          <option value="DESK">Desk</option>
          <option value="PARKING">Parking</option>
        </select>

        <select className="admRes__input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status (All)</option>
          <option value="ACTIVE">Active</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        <select
          className="admRes__input admRes__input--small"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={5}>5 rows</option>
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
        </select>
      </div>

      {error && <div className="admRes__error">{error}</div>}

      <div className="admRes__card">
        <div className="admRes__tableWrap" role="region" aria-label="Resources table">
          <table className="admRes__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Status</th>
                <th className="admRes__thRight">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="admRes__empty">
                    No resources match your filters.
                  </td>
                </tr>
              )}

              {pageRows.map((r) => (
                <tr key={r.id} className="admRes__row" onClick={() => openView(r)}>
                  <td className="admRes__nameCell">
                    <div className="admRes__name">{r?.name || "—"}</div>
                    <div className="admRes__muted">{r?.id || ""}</div>
                  </td>
                  <td>
                    <span className="admRes__pill">{labelType(r?.resourceType)}</span>
                  </td>
                  <td>{r?.buildingName || "—"}</td>
                  <td>
                    {r?.floorName || "—"}
                    {Number.isFinite(r?.floorNumber) ? ` (Floor ${r.floorNumber})` : ""}
                  </td>
                  <td>{Number.isFinite(r?.capacity) ? r.capacity : r?.capacity || "—"}</td>
                  <td>
                    <span
                      className={
                        r?.isActive === true
                          ? "admRes__status admRes__status--active"
                          : r?.isActive === false
                            ? "admRes__status admRes__status--maint"
                            : "admRes__status"
                      }
                    >
                      {statusLabel(r?.isActive)}
                    </span>
                  </td>
                  <td className="admRes__tdRight" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="admRes__linkBtn" onClick={() => openView(r)}>
                      View
                    </button>

                    {canManage && (
                      <>
                        <button type="button" className="admRes__linkBtn" onClick={() => openEdit(r)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admRes__linkBtn admRes__linkBtn--danger"
                          onClick={async () => {
                            const ok = window.confirm(`Delete "${r?.name || "resource"}"?`);
                            if (!ok) return;
                            await onDelete(r.id);
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
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

      <ResourceDialog
        open={dialogOpen}
        mode={dialogMode}
        resource={selected}
        canManage={canManage}
        isSystemAdmin={isSystemAdmin}
        onClose={() => setDialogOpen(false)}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onChangeAssignmentMode={onChangeAssignmentMode}
        onCreateDeskAssignment={onCreateDeskAssignment}
      />
    </main>
  );
}
