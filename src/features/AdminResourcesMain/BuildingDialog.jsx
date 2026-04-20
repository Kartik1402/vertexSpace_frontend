import React, { useEffect, useMemo, useState } from "react";
import "./BuildingDialog.css";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  isActive: true,
};

export default function BuildingDialog({
  open,
  building,
  onClose,
  onSave,   // (id, payload) => Promise
  onDelete, // (id) => Promise
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(emptyForm);

  const id = building?.id || "";
  const title = useMemo(() => (building ? "Edit Building" : "Building"), [building]);

  useEffect(() => {
    if (!open) return;
    setErr("");
    setSaving(false);

    if (building) {
      setForm({
        name: building?.name ?? "",
        address: building?.address ?? "",
        city: building?.city ?? "",
        state: building?.state ?? "",
        zipCode: building?.zipCode ?? "",
        country: building?.country ?? "",
        isActive: typeof building?.isActive === "boolean" ? building.isActive : true,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, building]);

  if (!open) return null;

  const update = (k) => (e) => {
    const v = k === "isActive" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!id) {
      setErr("Missing building id.");
      return;
    }
    if (!form.name.trim()) {
      setErr("Name is required.");
      return;
    }

    setSaving(true);
    try {
      await onSave(id, {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        country: form.country.trim(),
        isActive: !!form.isActive,
      });
      onClose();
    } catch (e2) {
      setErr(e2?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setErr("");
    if (!id) return;

    const ok = window.confirm(`Delete "${building?.name || "building"}"?`);
    if (!ok) return;

    setSaving(true);
    try {
      await onDelete(id);
      onClose();
    } catch (e2) {
      setErr(e2?.message || "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bDlg__backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bDlg__card">
        <div className="bDlg__head">
          <div>
            <div className="bDlg__title">{title}</div>
            <div className="bDlg__sub">{id}</div>
          </div>

          <button type="button" className="bDlg__iconBtn" onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>

        {err && <div className="bDlg__error">{err}</div>}

        <form onSubmit={submit} className="bDlg__form">
          <div className="bDlg__grid">
            <label className="bDlg__field">
              <div className="bDlg__label">Name</div>
              <input className="bDlg__input" value={form.name} onChange={update("name")} />
            </label>

            <label className="bDlg__field">
              <div className="bDlg__label">Country</div>
              <input className="bDlg__input" value={form.country} onChange={update("country")} />
            </label>

            <label className="bDlg__field bDlg__field--wide">
              <div className="bDlg__label">Address</div>
              <input className="bDlg__input" value={form.address} onChange={update("address")} />
            </label>

            <label className="bDlg__field">
              <div className="bDlg__label">City</div>
              <input className="bDlg__input" value={form.city} onChange={update("city")} />
            </label>

            <label className="bDlg__field">
              <div className="bDlg__label">State</div>
              <input className="bDlg__input" value={form.state} onChange={update("state")} />
            </label>

            <label className="bDlg__field">
              <div className="bDlg__label">Zip</div>
              <input className="bDlg__input" value={form.zipCode} onChange={update("zipCode")} />
            </label>

            <label className="bDlg__check">
              <input type="checkbox" checked={!!form.isActive} onChange={update("isActive")} />
              <span>Active</span>
            </label>
          </div>

          <div className="bDlg__actions">
            <button type="button" className="bDlg__btn bDlg__btn--ghost" onClick={onClose} disabled={saving}>
              Close
            </button>

            <button type="button" className="bDlg__btn bDlg__btn--danger" onClick={doDelete} disabled={saving}>
              Delete
            </button>

            <button type="submit" className="bDlg__btn bDlg__btn--primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
