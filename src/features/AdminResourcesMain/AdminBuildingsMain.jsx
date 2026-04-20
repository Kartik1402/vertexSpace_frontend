import React, { useEffect, useMemo, useRef, useState } from "react";

import { apiDelete, apiGet, apiPut,apiPost } from "../../services/api";
import { getAuth } from "../../services/authStorage";
import { apiUrl } from "../../services/config";

import BuildingDialog from "./BuildingDialog";
import "./adminResourcesMain.css";

const API_BUILDINGS_LIST = apiUrl("/api/v1/buildings");
const API_BUILDING_BY_ID = (id) => apiUrl(`/api/v1/buildings/${id}`);

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

function normalizeBuildings(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.buildings)) return data.buildings;
  return [];
}

function statusLabel(isActive) {
  if (typeof isActive !== "boolean") return "—";
  return isActive ? "Active" : "Inactive";
}

function fmt(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function AdminBuildingsMain() {
  const role = roleFromAuth();
  const isSystemAdmin = role === "SYSTEM_ADMIN";
  const isDeptAdmin = role === "DEPT_ADMIN"

  const canAccess = isSystemAdmin||isDeptAdmin; 
  const canManage = isSystemAdmin; 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // "", "ACTIVE", "INACTIVE"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // NEW: dialog state
  const [dlgOpen, setDlgOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
const [addSaving, setAddSaving] = useState(false);
const [addErr, setAddErr] = useState("");

const [addForm, setAddForm] = useState({
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
});

  const abortRef = useRef(null);

  const fetchBuildings = async () => {
    setLoading(true);
    setError("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await apiGet(API_BUILDINGS_LIST, { signal: controller.signal });
      setRaw(normalizeBuildings(data));
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load buildings.");
      setRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) return;
    fetchBuildings();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  useEffect(() => {
    setPage(1);
  }, [q, status, pageSize]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return raw.filter((b) => {
      const hay = [
        b?.name,
        b?.address,
        b?.city,
        b?.state,
        b?.zipCode,
        b?.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okQ = !query || hay.includes(query);
      const okStatus =
        !status ||
        (status === "ACTIVE" && b?.isActive === true) ||
        (status === "INACTIVE" && b?.isActive === false);

      return okQ && okStatus;
    });
  }, [raw, q, status]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const openEdit = (b) => {
    setSelected(b ?? null);
    setDlgOpen(true);
  };

  const closeDialog = () => {
    setDlgOpen(false);
    setSelected(null);
  };

  const onSave = async (id, payload) => {
    if (!id) throw new Error("Missing building id.");
    setLoading(true);
    setError("");
    try {
      await apiPut(API_BUILDING_BY_ID(id), payload);
      await fetchBuildings();
    } finally {
      setLoading(false);
    }
  };

  const onRemove = async (id) => {
    if (!id) throw new Error("Missing building id.");
    setLoading(true);
    setError("");
    try {
      await apiDelete(API_BUILDING_BY_ID(id));
      await fetchBuildings();
    } finally {
      setLoading(false);
    }
  };
const openAdd = () => {
  setAddErr("");
  setAddSaving(false);
  setAddForm({ name: "", address: "", city: "", state: "", zipCode: "", country: "" });
  setAddOpen(true);
};

const closeAdd = () => setAddOpen(false);

const onAddChange = (k) => (e) => {
  setAddForm((p) => ({ ...p, [k]: e.target.value }));
};

const createBuilding = async (e) => {
  e?.preventDefault?.();
  setAddErr("");

  if (!addForm.name.trim()) {
    setAddErr("Name is required.");
    return;
  }

  setAddSaving(true);
  try {
    await apiPost(apiUrl("/api/v1/buildings"), {
      name: addForm.name.trim(),
      address: addForm.address.trim(),
      city: addForm.city.trim(),
      state: addForm.state.trim(),
      zipCode: addForm.zipCode.trim(),
      country: addForm.country.trim(),
    });

    setAddOpen(false);
    await fetchBuildings(); // uses your existing loader
  } catch (e2) {
    setAddErr(e2?.message || "Create failed.");
  } finally {
    setAddSaving(false);
  }
};


  if (!canAccess) {
    return (
      <main className="admRes">
        <div className="admRes__error">You don’t have access to Buildings.</div>
      </main>
    );
  }

  return (
    <main className="admRes">
      <div className="admRes__head">
        <div>
          <div className="admRes__title">Buildings</div>
          <div className="admRes__sub">
            {loading ? "Loading…" : `${total} building${total === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="admRes__headActions">
          <button
            type="button"
            className="admRes__btn admRes__btn--ghost"
            onClick={fetchBuildings}
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>
        </div>
           {isSystemAdmin && (
  <button type="button" className="admRes__btnPrimary" onClick={openAdd}>
    + Add Building
  </button>
)}
      </div>
   

      <div className="admRes__filters">
        <input
          className="admRes__input admRes__input--wide"
          placeholder="Search buildings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="admRes__input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Status (All)</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
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
        <div className="admRes__tableWrap" role="region" aria-label="Buildings table">
          <table className="admRes__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Zip</th>
                <th>Country</th>
                <th>Floors</th>
                <th>Status</th>
                <th>Created</th>
                <th className="admRes__thRight">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="admRes__empty">
                    No buildings match your filters.
                  </td>
                </tr>
              )}

              {pageRows.map((b) => (
                <tr key={b?.id ?? `${b?.name ?? "row"}-${Math.random()}`} className="admRes__row">
                  <td className="admRes__nameCell">
                    <div className="admRes__name">{b?.name || "—"}</div>
                    <div className="admRes__muted">{b?.id || ""}</div>
                  </td>
                  <td>{b?.address || "—"}</td>
                  <td>{b?.city || "—"}</td>
                  <td>{b?.state || "—"}</td>
                  <td>{b?.zipCode || "—"}</td>
                  <td>{b?.country || "—"}</td>
                  <td>{Number.isFinite(b?.floorCount) ? b.floorCount : b?.floorCount ?? "—"}</td>
                  <td>
                    <span
                      className={
                        b?.isActive === true
                          ? "admRes__status admRes__status--active"
                          : b?.isActive === false
                            ? "admRes__status admRes__status--maint"
                            : "admRes__status"
                      }
                    >
                      {statusLabel(b?.isActive)}
                    </span>
                  </td>
                  <td>{fmt(b?.createdAt)}</td>

                  <td className="admRes__tdRight">
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          className="admRes__linkBtn"
                          onClick={() => openEdit(b)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admRes__linkBtn admRes__linkBtn--danger"
                          disabled={loading || !b?.id}
                          onClick={async () => {
                            const ok = window.confirm(`Delete "${b?.name || "building"}"?`);
                            if (!ok) return;
                            try {
                              await onRemove(b.id);
                            } catch (e) {
                              setError(e?.message || "Delete failed.");
                            }
                          }}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      "—"
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
{addOpen && (
  <div className="bDlg__backdrop" role="dialog" aria-modal="true" aria-label="Add Building">
    <div className="bDlg__card">
      <div className="bDlg__head">
        <div>
          <div className="bDlg__title">Add Building</div>
          <div className="bDlg__sub">Create a new building</div>
        </div>

        <button type="button" className="bDlg__iconBtn" onClick={closeAdd} disabled={addSaving}>
          ✕
        </button>
      </div>

      {addErr && <div className="bDlg__error">{addErr}</div>}

      <form onSubmit={createBuilding} className="bDlg__form">
        <div className="bDlg__grid">
          <label className="bDlg__field">
            <div className="bDlg__label">Name *</div>
            <input className="bDlg__input" value={addForm.name} onChange={onAddChange("name")} />
          </label>

          <label className="bDlg__field">
            <div className="bDlg__label">Country</div>
            <input className="bDlg__input" value={addForm.country} onChange={onAddChange("country")} />
          </label>

          <label className="bDlg__field bDlg__field--wide">
            <div className="bDlg__label">Address</div>
            <input className="bDlg__input" value={addForm.address} onChange={onAddChange("address")} />
          </label>

          <label className="bDlg__field">
            <div className="bDlg__label">City</div>
            <input className="bDlg__input" value={addForm.city} onChange={onAddChange("city")} />
          </label>

          <label className="bDlg__field">
            <div className="bDlg__label">State</div>
            <input className="bDlg__input" value={addForm.state} onChange={onAddChange("state")} />
          </label>

          <label className="bDlg__field">
            <div className="bDlg__label">Zip</div>
            <input className="bDlg__input" value={addForm.zipCode} onChange={onAddChange("zipCode")} />
          </label>
        </div>

        <div className="bDlg__actions">
          <button type="button" className="bDlg__btn bDlg__btn--ghost" onClick={closeAdd} disabled={addSaving}>
            Cancel
          </button>

          <button type="submit" className="bDlg__btn bDlg__btn--primary" disabled={addSaving}>
            {addSaving ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      <BuildingDialog
        open={dlgOpen}
        building={selected}
        onClose={closeDialog}
        onSave={onSave}
        onDelete={onRemove}
      />
    </main>
  );
}
