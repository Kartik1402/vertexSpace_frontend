import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { createBooking } from "/src/services/api.js";
import "./BookResourcePage.css";

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function fromDatetimeLocalToISO(dtLocal) {
  if (!dtLocal) return "";
  // Interpret datetime-local as local time and convert to ISO (UTC Z)
  const d = new Date(dtLocal);
  return d.toISOString();
}

export default function BookResourcePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  // allow passing values via navigation state OR query params
  const seed = useMemo(() => {
    const s = location.state || {};
    return {
      resourceId: s.resourceId || params.get("resourceId") || "",
      resourceName: s.resourceName || params.get("resourceName") || "",
      resourceType: s.resourceType || params.get("resourceType") || "",
      startTime: s.startTime || params.get("startTime") || "",
      endTime: s.endTime || params.get("endTime") || "",
      bufferMinutes:
        s.bufferMinutes ?? (params.get("bufferMinutes") ? Number(params.get("bufferMinutes")) : 15),
      purpose: s.purpose || params.get("purpose") || "",
    };
  }, [location.state, params]);

  const [resourceId, setResourceId] = useState(seed.resourceId);
  const [startLocal, setStartLocal] = useState(toDatetimeLocalValue(seed.startTime));
  const [endLocal, setEndLocal] = useState(toDatetimeLocalValue(seed.endTime));
  const [bufferMinutes, setBufferMinutes] = useState(Number.isFinite(seed.bufferMinutes) ? seed.bufferMinutes : 15);
  const [purpose, setPurpose] = useState(seed.purpose);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const startIso = useMemo(() => fromDatetimeLocalToISO(startLocal), [startLocal]);
  const endIso = useMemo(() => fromDatetimeLocalToISO(endLocal), [endLocal]);

  const validation = useMemo(() => {
    if (!resourceId) return "Resource is required";
    if (!startLocal) return "Start time is required";
    if (!endLocal) return "End time is required";
    const s = new Date(startLocal).getTime();
    const e = new Date(endLocal).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e)) return "Invalid date/time";
    if (e <= s) return "End time must be after start time";
    if (!Number.isFinite(bufferMinutes) || bufferMinutes < 0) return "Buffer must be 0 or higher";
    return null;
  }, [resourceId, startLocal, endLocal, bufferMinutes]);

  async function onSubmit(e) {
    e.preventDefault();
    const v = validation;
    if (v) return setErr(v);

    try {
      setSubmitting(true);
      setErr(null);

      const payload = {
        resourceId,
        startTime: startIso,
        endTime: endIso,
        bufferMinutes: Number(bufferMinutes),
        purpose: purpose || "Booking",
      };

      const res = await createBooking(payload);

      navigate("/booking-confirmed", { state: { booking: res } });
    } catch (e2) {
      setErr(e2?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="br">
      <div className="br__header">
        <div className="br__crumbs">
          Dashboard › Resources › <span className="br__crumbStrong">Book Resource</span>
        </div>
        <h1 className="br__title">Book Resource</h1>
        <div className="br__subtitle">Choose time and confirm your booking.</div>
      </div>

      <div className="br__grid">
        <section className="br__card br__card--preview">
          <div className="br__cardTitle">Selected Resource</div>
          <div className="br__previewName">{seed.resourceName || "Resource"}</div>
          <div className="br__previewMeta">
            <span className="br__pill">{seed.resourceType || "TYPE"}</span>
            {resourceId ? <span className="br__mutedSmall">ID: {resourceId}</span> : null}
          </div>
          <div className="br__infoBox">
            <div className="br__infoTitle">Tip</div>
            <div className="br__infoText">
              Buffer minutes add a small block after the booking to avoid overlap.
            </div>
          </div>

          <button type="button" className="br__backBtn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </section>

        <section className="br__card">
          <div className="br__cardTitle">Booking Details</div>

          <form className="br__form" onSubmit={onSubmit}>
            <label className="br__label">
              Resource ID
              <input
                className="br__input"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                placeholder="Resource UUID"
              />
            </label>

            <div className="br__row2">
              <label className="br__label">
                Start time
                <input
                  className="br__input"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </label>

              <label className="br__label">
                End time
                <input
                  className="br__input"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                />
              </label>
            </div>

            <div className="br__row2">
              <label className="br__label">
                Buffer (minutes)
                <input
                  className="br__input"
                  type="number"
                  min="0"
                  step="5"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                />
              </label>

              <label className="br__label">
                Purpose
                <input
                  className="br__input"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Team meeting"
                />
              </label>
            </div>

            <div className="br__summary">
              <div>
                <div className="br__mutedSmall">Will be sent to API as</div>
                <div className="br__mono">
                  startTime: {startIso || "-"}
                  <br />
                  endTime: {endIso || "-"}
                </div>
              </div>
              <span className="br__pill br__pill--soft">{bufferMinutes} min buffer</span>
            </div>

            {err ? <div className="br__error">{err}</div> : null}

            <button className="br__primaryBtn" type="submit" disabled={submitting || !!validation}>
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
