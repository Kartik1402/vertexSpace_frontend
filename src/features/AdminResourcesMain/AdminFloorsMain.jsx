import { useEffect, useMemo, useState } from "react";
import { getAuth } from "../../services/authStorage";
import {
  getAllFloors,
  getAllBuildings,
  createFloor,
  updateFloorById,
  deleteFloorById,
} from "../../services/api";

import "./AdminFloorsMain.css";

const PAGE_SIZE = 10;

export default function AdminFloorsMain() {
  const auth = getAuth?.() ?? {};
  const role =
    auth?.role ||
    auth?.user?.role ||
    auth?.userRole ||
    (Array.isArray(auth?.roles) ? auth.roles[0] : undefined);

  const isSystemAdmin =
    role === "SYSTEM_ADMIN" || (Array.isArray(auth?.roles) && auth.roles.includes("SYSTEM_ADMIN"));

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);

  // client-side pagination
  const [page, setPage] = useState(1);

  // add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [addForm, setAddForm] = useState({
    buildingId: "",
    floorNumber: "",
    floorName: "",
  });

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editForm, setEditForm] = useState({
    id: "",
    buildingId: "",
    floorNumber: "",
    floorName: "",
    isActive: true,
  });

  const normalizeList = (res, key) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res[key])) return res[key];
    return [];
  };

  const fetchFloors = async () => {
    const res = await getAllFloors();
    const list = normalizeList(res, "floors");
    setFloors(list);
    setPage(1);
  };

  const fetchBuildings = async () => {
    setBuildingsLoading(true);
    try {
      const res = await getAllBuildings();
      const list = normalizeList(res, "buildings");
      setBuildings(list);
    } finally {
      setBuildingsLoading(false);
    }
  };

  const loadAll = async () => {
    setErr("");
    setLoading(true);
    try {
      await Promise.all([fetchFloors(), fetchBuildings()]);
    } catch (e) {
      setErr(e?.message || "Failed to load floors/buildings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(floors.length / PAGE_SIZE)), [floors.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return floors.slice(start, start + PAGE_SIZE);
  }, [floors, page]);

  const buildingNameById = useMemo(() => {
    const m = new Map();
    buildings.forEach((b) => m.set(b.id, b.name));
    return m;
  }, [buildings]);

  const onAddChange = (k) => (e) => setAddForm((p) => ({ ...p, [k]: e.target.value }));
  const onEditChange = (k) => (e) => setEditForm((p) => ({ ...p, [k]: e.target.value }));

  const openAdd = () => {
    setAddErr("");
    setAddSaving(false);
    setAddForm({ buildingId: "", floorNumber: "", floorName: "" });
    setAddOpen(true);
  };

  const openEdit = (row) => {
    setEditErr("");
    setEditSaving(false);
    setEditForm({
      id: row.id,
      buildingId: row.buildingId || "",
      floorNumber: row.floorNumber ?? "",
      floorName: row.floorName || "",
      isActive: !!row.isActive,
    });
    setEditOpen(true);
  };

  const validateFloor = ({ buildingId, floorNumber, floorName }) => {
    if (!buildingId) return "Building is required.";
    if (floorNumber === "" || Number.isNaN(Number(floorNumber))) return "Floor Number must be a number.";
    if (!String(floorName || "").trim()) return "Floor Name is required.";
    return "";
  };

  const createOne = async (e) => {
    e?.preventDefault?.();
    if (!isSystemAdmin) return;

    const msg = validateFloor(addForm);
    if (msg) return setAddErr(msg);

    setAddErr("");
    setAddSaving(true);
    try {
      await createFloor({
        buildingId: addForm.buildingId,
        floorNumber: Number(addForm.floorNumber),
        floorName: addForm.floorName.trim(),
      });
      setAddOpen(false);
      await fetchFloors();
    } catch (e2) {
      setAddErr(e2?.message || "Create failed.");
    } finally {
      setAddSaving(false);
    }
  };

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    if (!isSystemAdmin) return;

    if (!editForm.id) return setEditErr("Missing floor id.");
    const msg = validateFloor(editForm);
    if (msg) return setEditErr(msg);

    setEditErr("");
    setEditSaving(true);
    try {
      await updateFloorById(editForm.id, {
        buildingId: editForm.buildingId,
        floorNumber: Number(editForm.floorNumber),
        floorName: editForm.floorName.trim(),
        isActive: !!editForm.isActive,
      });
      setEditOpen(false);
      await fetchFloors();
    } catch (e2) {
      setEditErr(e2?.message || "Update failed.");
    } finally {
      setEditSaving(false);
    }
  };

  const removeOne = async (row) => {
    if (!isSystemAdmin) return;

    const ok = window.confirm(`Delete floor "${row.floorName}"?`);
    if (!ok) return;

    try {
      await deleteFloorById(row.id);
      await fetchFloors();
    } catch (e) {
      alert(e?.message || "Delete failed.");
    }
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="admFloors">
      <div className="admFloors__head">
        <div>
          <h2 className="admFloors__title">Floors</h2>
          <div className="admFloors__sub">Add, edit, and deactivate floors</div>
        </div>

        <button type="button" className="admRes__btnPrimary" onClick={openAdd} disabled={!isSystemAdmin}>
          + Add Floor
        </button>
      </div>

      {err && <div className="admFloors__error">{err}</div>}

      <div className="admFloors__tableWrap">
        <table className="admFloors__table">
          <thead>
            <tr>
              <th>Building</th>
              <th>Floor #</th>
              <th>Name</th>
              <th>Active</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading…</td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={5}>No floors found.</td>
              </tr>
            ) : (
              pageItems.map((f) => (
                <tr key={f.id}>
                  <td>{f.buildingName || buildingNameById.get(f.buildingId) || f.buildingId}</td>
                  <td>{f.floorNumber}</td>
                  <td>{f.floorName}</td>
                  <td>{f.isActive ? "Yes" : "No"}</td>
                  <td>
                    <button type="button" className="admRes__btn" onClick={() => openEdit(f)} disabled={!isSystemAdmin}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admRes__btnDanger"
                      onClick={() => removeOne(f)}
                      disabled={!isSystemAdmin}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admFloors__pager">
        <button
          type="button"
          className="admRes__btn"
          disabled={prevDisabled}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="admFloors__pagerText">
          Page {page} of {totalPages}
        </div>
        <button
          type="button"
          className="admRes__btn"
          disabled={nextDisabled}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      {/* Add Floor */}
      {addOpen && (
        <div className="bDlg__backdrop" role="dialog" aria-modal="true" aria-label="Add Floor">
          <div className="bDlg__card">
            <div className="bDlg__head">
              <div>
                <div className="bDlg__title">Add Floor</div>
                <div className="bDlg__sub">System admin only</div>
              </div>
              <button type="button" className="bDlg__iconBtn" onClick={() => setAddOpen(false)} disabled={addSaving}>
                ✕
              </button>
            </div>

            {addErr && <div className="bDlg__error">{addErr}</div>}

            <form onSubmit={createOne} className="bDlg__form">
              <div className="bDlg__grid">
                <label className="bDlg__field bDlg__field--wide">
                  <div className="bDlg__label">Building *</div>
                  <select
                    className="bDlg__input"
                    value={addForm.buildingId}
                    onChange={onAddChange("buildingId")}
                    disabled={buildingsLoading || buildings.length === 0 || !isSystemAdmin}
                  >
                    <option value="">{buildingsLoading ? "Loading buildings..." : "Select a building"}</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bDlg__field">
                  <div className="bDlg__label">Floor Number *</div>
                  <input
                    className="bDlg__input"
                    type="number"
                    value={addForm.floorNumber}
                    onChange={onAddChange("floorNumber")}
                    disabled={!isSystemAdmin}
                  />
                </label>

                <label className="bDlg__field">
                  <div className="bDlg__label">Floor Name *</div>
                  <input
                    className="bDlg__input"
                    value={addForm.floorName}
                    onChange={onAddChange("floorName")}
                    disabled={!isSystemAdmin}
                  />
                </label>
              </div>

              <div className="bDlg__actions">
                <button
                  type="button"
                  className="bDlg__btn bDlg__btn--ghost"
                  onClick={() => setAddOpen(false)}
                  disabled={addSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bDlg__btn bDlg__btn--primary"
                  disabled={addSaving || !isSystemAdmin}
                >
                  {addSaving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Floor */}
      {editOpen && (
        <div className="bDlg__backdrop" role="dialog" aria-modal="true" aria-label="Edit Floor">
          <div className="bDlg__card">
            <div className="bDlg__head">
              <div>
                <div className="bDlg__title">Edit Floor</div>
                <div className="bDlg__sub">System admin only</div>
              </div>
              <button
                type="button"
                className="bDlg__iconBtn"
                onClick={() => setEditOpen(false)}
                disabled={editSaving}
              >
                ✕
              </button>
            </div>

            {editErr && <div className="bDlg__error">{editErr}</div>}

            <form onSubmit={saveEdit} className="bDlg__form">
              <div className="bDlg__grid">
                <label className="bDlg__field bDlg__field--wide">
                  <div className="bDlg__label">Building *</div>
                  <select
                    className="bDlg__input"
                    value={editForm.buildingId}
                    onChange={onEditChange("buildingId")}
                    disabled={buildingsLoading || buildings.length === 0 || !isSystemAdmin}
                  >
                    <option value="">{buildingsLoading ? "Loading buildings..." : "Select a building"}</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bDlg__field">
                  <div className="bDlg__label">Floor Number *</div>
                  <input
                    className="bDlg__input"
                    type="number"
                    value={editForm.floorNumber}
                    onChange={onEditChange("floorNumber")}
                    disabled={!isSystemAdmin}
                  />
                </label>

                <label className="bDlg__field">
                  <div className="bDlg__label">Floor Name *</div>
                  <input
                    className="bDlg__input"
                    value={editForm.floorName}
                    onChange={onEditChange("floorName")}
                    disabled={!isSystemAdmin}
                  />
                </label>

                <label className="bDlg__field bDlg__field--wide admFloors__activeRow">
                  <input
                    type="checkbox"
                    checked={!!editForm.isActive}
                    onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                    disabled={!isSystemAdmin}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="bDlg__actions">
                <button
                  type="button"
                  className="bDlg__btn bDlg__btn--ghost"
                  onClick={() => setEditOpen(false)}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bDlg__btn bDlg__btn--primary"
                  disabled={editSaving || !isSystemAdmin}
                >
                  {editSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
