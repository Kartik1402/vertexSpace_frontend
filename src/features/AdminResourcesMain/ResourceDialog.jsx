import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminResourcesMain.css";

function labelType(t) {
  const v = String(t || "").toUpperCase();
  if (!v) return "—";
  return v.replaceAll("_", " ");
}

function statusLabel(isActive) {
  if (typeof isActive !== "boolean") return "—";
  return isActive ? "Active" : "Maintenance";
}

function normalizeAssignmentMode(v) {
  const m = String(v || "").toUpperCase().trim();
  if (!m) return "";
  if (m === "ASSIGNED") return "ASSIGNED";
  if (m === "HOT-DESK" || m === "HOT_DESK" || m === "HOTDESK") return "HOT-DESK";
  return m;
}

function toUtcIso(datetimeLocalValue) {
  // datetime-local gives "YYYY-MM-DDTHH:mm" (local time); convert to ISO UTC with Z
  const d = new Date(datetimeLocalValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function ResourceDialog({
  open,
  mode, // "view" | "create" | "edit"
  resource,
  canManage,
  isSystemAdmin = false,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onChangeAssignmentMode,
  onCreateDeskAssignment, // NEW: async (payload) => response
}) {
  const navigate = useNavigate();

  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [resourceType, setResourceType] = useState("ROOM");
  const [capacity, setCapacity] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [owningDepartmentId, setOwningDepartmentId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Desk assignment UI state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignStartLocal, setAssignStartLocal] = useState("");
  const [assignEndLocal, setAssignEndLocal] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignedDone, setAssignedDone] = useState(false); // local flag per dialog session

  useEffect(() => {
    if (!open) return;

    setErr("");
    setBusy(false);

    // reset assignment dialog fields on open/resource change
    setAssignOpen(false);
    setAssignUserId("");
    setAssignStartLocal("");
    setAssignEndLocal("");
    setAssignNotes("");
    setAssignedDone(false);

    if (isCreate) {
      setName("");
      setResourceType("ROOM");
      setCapacity("");
      setBuildingId("");
      setFloorId("");
      setOwningDepartmentId("");
      setIsActive(true);
      return;
    }

    setName(resource?.name || "");
    setResourceType(String(resource?.resourceType || "ROOM").toUpperCase());
    setCapacity(resource?.capacity ?? "");
    setBuildingId(resource?.buildingId || "");
    setFloorId(resource?.floorId || "");
    setOwningDepartmentId(resource?.owningDepartmentId || "");
    setIsActive(typeof resource?.isActive === "boolean" ? resource.isActive : true);
  }, [open, isCreate, resource]);

  const title = useMemo(() => {
    if (isCreate) return "Add Resource";
    if (isEdit) return "Edit Resource";
    return "Resource Details";
  }, [isCreate, isEdit]);

  const readOnly = isView || !canManage;

  const canBook = useMemo(() => {
    if (!resource?.id) return false;
    if (typeof resource?.isActive === "boolean" && resource.isActive === false) return false;
    return true;
  }, [resource]);

  const isDesk = useMemo(
    () => String(resource?.resourceType || "").toUpperCase() === "DESK",
    [resource]
  );

  const currentAssignmentMode = useMemo(
    () => normalizeAssignmentMode(resource?.assignment_mode),
    [resource]
  );

  // If switched to HOT-DESK, hide assign UI and clear "assigned already" local flag
  useEffect(() => {
    if (currentAssignmentMode === "HOT-DESK") {
      setAssignOpen(false);
      setAssignedDone(false);
    }
  }, [currentAssignmentMode]);

  const showAssignmentToggle = isView && isDesk && isSystemAdmin;

  const canShowDeskAssign =
    isView &&
    isDesk &&
    isSystemAdmin &&
    currentAssignmentMode === "ASSIGNED";

  const showAssignToBtn = canShowDeskAssign && !assignedDone;
  const showAssignedAlreadyBtn = canShowDeskAssign && assignedDone;

  const onBook = () => {
    if (!resource?.id) return;

    navigate("/book-resource", {
      state: {
        resourceId: resource.id,
        resourceName: resource.name || "",
        resourceType: resource.resourceType || "",
      },
    });

    onClose?.();
  };

  const submit = async () => {
    setBusy(true);
    setErr("");

    try {
      if (isCreate) {
        if (!name.trim()) throw new Error("Name is required.");

        await onCreate({
          name: name.trim(),
          resourceType,
          capacity: capacity === "" ? null : Number(capacity),
          buildingId: buildingId || null,
          floorId: floorId || null,
          owningDepartmentId: owningDepartmentId || null,
          isActive,
        });

        onClose();
        return;
      }

      if (isEdit) {
        if (!resource?.id) throw new Error("Missing resource id.");
        if (!name.trim()) throw new Error("Name is required.");

        await onUpdate(resource.id, {
          name: name.trim(),
          resourceType,
          capacity: capacity === "" ? null : Number(capacity),
          buildingId: buildingId || null,
          floorId: floorId || null,
          owningDepartmentId: owningDepartmentId || null,
          isActive,
        });

        onClose();
      }
    } catch (e) {
      setErr(e?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const changeAssignmentMode = async (newMode) => {
    if (!resource?.id) return;
    if (!onChangeAssignmentMode) {
      setErr("Missing onChangeAssignmentMode handler.");
      return;
    }

    setBusy(true);
    setErr("");
    try {
      await onChangeAssignmentMode(resource.id, newMode);
    } catch (e) {
      setErr(e?.message || "Failed to change assignment mode.");
    } finally {
      setBusy(false);
    }
  };

  const createDeskAssignment = async () => {
    if (!resource?.id) 
        {setErr("missing resource id");
            return;}
    if (!onCreateDeskAssignment) {
      setErr("Missing onCreateDeskAssignment handler.");
      return;
    }

    if (!assignUserId.trim()) {
      setErr("User ID is required.");
      return;
    }

    const startUtc = toUtcIso(assignStartLocal);
    const endUtc = toUtcIso(assignEndLocal);
    if (!startUtc || !endUtc) {
      setErr("Start and End date/time are required.");
      return;
    }
    if (new Date(endUtc).getTime() <= new Date(startUtc).getTime()) {
      setErr("End must be after Start.");
      return;
    }

    setBusy(true);
    setErr("");
    try {
      await onCreateDeskAssignment({
        deskId: resource.id,
        userId: assignUserId.trim(),
        startUtc,
        endUtc,
        notes: assignNotes || "",
      });

      setAssignOpen(false);
      setAssignedDone(true); // change button to "Assigned already" (disabled)
    } catch (e) {
      setErr(e?.message || "Desk assignment failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="admRes__modalOverlay" role="dialog" aria-modal="true">
      <div className="admRes__modal">
        <div className="admRes__modalHead">
          <div>
            <div className="admRes__modalTitle">{title}</div>
            {!isCreate && (
              <div className="admRes__muted">
                {resource?.name || "—"} • {labelType(resource?.resourceType)} •{" "}
                {statusLabel(resource?.isActive)}
              </div>
            )}
          </div>

          <button type="button" className="admRes__iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {err && <div className="admRes__error">{err}</div>}

        <div className="admRes__formGrid">
          <label className="admRes__field">
            <span>Name</span>
            <input
              className="admRes__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Conference Room Alpha"
              disabled={busy || readOnly}
            />
          </label>

          <label className="admRes__field">
            <span>Type</span>
            <select
              className="admRes__input"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              disabled={busy || readOnly}
            >
              <option value="ROOM">Room</option>
              <option value="DESK">Desk</option>
              <option value="PARKING">Parking</option>
            </select>
          </label>

          <label className="admRes__field">
            <span>Capacity</span>
            <input
              className="admRes__input"
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g., 8"
              disabled={busy || readOnly}
            />
          </label>

          <label className="admRes__field">
            <span>Building ID</span>
            <input
              className="admRes__input"
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              placeholder="UUID"
              disabled={busy || readOnly}
            />
          </label>

          <label className="admRes__field">
            <span>Floor ID</span>
            <input
              className="admRes__input"
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              placeholder="UUID"
              disabled={busy || readOnly}
            />
          </label>

          <label className="admRes__field">
            <span>Owning Department ID</span>
            <input
              className="admRes__input"
              value={owningDepartmentId}
              onChange={(e) => setOwningDepartmentId(e.target.value)}
              placeholder="UUID"
              disabled={busy || readOnly}
            />
          </label>

          <label className="admRes__field admRes__field--row">
            <span>Status</span>
            <select
              className="admRes__input"
              value={isActive ? "ACTIVE" : "MAINTENANCE"}
              onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
              disabled={busy || readOnly}
            >
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </label>

          {!isCreate && isDesk && (
            <div className="admRes__field">
              <span>Assignment Mode</span>
              <div className="admRes__muted" style={{ paddingTop: 10 }}>
                {currentAssignmentMode ? currentAssignmentMode : "—"}
              </div>
            </div>
          )}
        </div>

        <div className="admRes__modalActions">
          {/* Assignment mode toggle */}
          {showAssignmentToggle && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="admRes__btn"
                disabled={busy || currentAssignmentMode === "HOT-DESK"}
                onClick={() => changeAssignmentMode("HOT-DESK")}
                title="Set to Hot Desk"
              >
                Hot desk
              </button>
              <button
                type="button"
                className="admRes__btn"
                disabled={busy || currentAssignmentMode === "ASSIGNED"}
                onClick={() => changeAssignmentMode("ASSIGNED")}
                title="Set to Assigned"
              >
                Assigned
              </button>
            </div>
          )}

          {/* NEW: Desk assignment (only when DESK + ASSIGNED mode; hidden in HOT-DESK) */}
          {showAssignToBtn && (
            <button
              type="button"
              className="admRes__btn"
              disabled={busy}
              onClick={() => setAssignOpen(true)}
              title="Assign this desk to a user"
            >
              Assign to
            </button>
          )}

          {showAssignedAlreadyBtn && (
            <button
              type="button"
              className="admRes__btn"
              disabled={true}
              title="Desk already assigned"
            >
              Assigned already
            </button>
          )}

          {isView && (
            <button
              type="button"
              className="admRes__btn admRes__btn--primary"
              onClick={onBook}
              disabled={busy || !canBook}
            >
              Book Resource
            </button>
          )}

          {!isCreate && canManage && (
            <button
              type="button"
              className="admRes__btn admRes__btn--danger"
              disabled={busy || !resource?.id}
              onClick={async () => {
                const ok = window.confirm(`Delete "${resource?.name || "resource"}"?`);
                if (!ok) return;

                setBusy(true);
                setErr("");
                try {
                  await onDelete(resource.id);
                  onClose();
                } catch (e) {
                  setErr(e?.message || "Delete failed.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete
            </button>
          )}

          <div className="admRes__spacer" />

          <button type="button" className="admRes__btn admRes__btn--ghost" onClick={onClose} disabled={busy}>
            Close
          </button>

          {canManage && (isCreate || isEdit) && (
            <button type="button" className="admRes__btn admRes__btn--primary" onClick={submit} disabled={busy}>
              {isCreate ? "Create" : "Save"}
            </button>
          )}
        </div>

        {/* NEW: Assign-to modal */}
        {assignOpen && (
          <div className="admRes__modalOverlay" role="dialog" aria-modal="true">
            <div className="admRes__modal">
              <div className="admRes__modalHead">
                <div>
                  <div className="admRes__modalTitle">Assign Desk</div>
                  <div className="admRes__muted">{resource?.name || resource?.id || ""}</div>
                </div>
                <button
                  type="button"
                  className="admRes__iconBtn"
                  onClick={() => setAssignOpen(false)}
                  aria-label="Close"
                  disabled={busy}
                >
                  ✕
                </button>
              </div>

              <div className="admRes__formGrid">
                <label className="admRes__field">
                  <span>User ID</span>
                  <input
                    className="admRes__input"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    placeholder="UUID"
                    disabled={busy}
                  />
                </label>

                <label className="admRes__field">
                  <span>Start (local time)</span>
                  <input
                    className="admRes__input"
                    type="datetime-local"
                    value={assignStartLocal}
                    onChange={(e) => setAssignStartLocal(e.target.value)}
                    disabled={busy}
                  />
                </label>

                <label className="admRes__field">
                  <span>End (local time)</span>
                  <input
                    className="admRes__input"
                    type="datetime-local"
                    value={assignEndLocal}
                    onChange={(e) => setAssignEndLocal(e.target.value)}
                    disabled={busy}
                  />
                </label>

                <label className="admRes__field" style={{ gridColumn: "1 / -1" }}>
                  <span>Notes</span>
                  <input
                    className="admRes__input"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="Optional"
                    disabled={busy}
                  />
                </label>
              </div>

              <div className="admRes__modalActions">
                <button
                  type="button"
                  className="admRes__btn admRes__btn--ghost"
                  onClick={() => setAssignOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admRes__btn admRes__btn--primary"
                  onClick={createDeskAssignment}
                  disabled={busy}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
