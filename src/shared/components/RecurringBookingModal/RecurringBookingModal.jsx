import React, { useMemo, useState } from "react";
import { createRecurringBooking } from "../../../services/api";
import "./RecurringBookingModal.css";

const PATTERNS = ["DAILY", "WEEKLY", "MONTHLY"];
const END_TYPES = ["END_DATE", "OCCURRENCES", "NEVER"];
const CONFLICTS = ["SKIP_CONFLICTS", "FAIL_ON_CONFLICTS"];
const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const TIMEZONES = ["UTC", "Asia/Kolkata"];

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalToISO(dtLocal) {
  if (!dtLocal) return "";
  return new Date(dtLocal).toISOString();
}

export default function RecurringBookingModal({ open, seed, onClose }) {
  const [resourceId, setResourceId] = useState(seed?.resourceId || "");
  const [startLocal, setStartLocal] = useState(toDatetimeLocalValue(seed?.startTime));
  const [endLocal, setEndLocal] = useState(toDatetimeLocalValue(seed?.endTime));
  const [bufferMinutes, setBufferMinutes] = useState(seed?.bufferMinutes ?? 60);
  const [purpose, setPurpose] = useState(seed?.purpose || "");

  const [pattern, setPattern] = useState(seed?.pattern || "WEEKLY");
  const [daysOfWeek, setDaysOfWeek] = useState(seed?.daysOfWeek || ["WEDNESDAY"]);
  const [dayOfMonth, setDayOfMonth] = useState(seed?.dayOfMonth ?? 1); // 1..31 (MONTHLY only)

  const [endType, setEndType] = useState(seed?.endType || "END_DATE");
  const [recurrenceEndLocal, setRecurrenceEndLocal] = useState(toDatetimeLocalValue(seed?.recurrenceEndDate));
  const [occurrences, setOccurrences] = useState(seed?.occurrences ?? 2);

  const [timezone, setTimezone] = useState(seed?.timezone || "UTC");
  const [conflictResolution, setConflictResolution] = useState(seed?.conflictResolution || "SKIP_CONFLICTS");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const startTime = useMemo(() => fromDatetimeLocalToISO(startLocal), [startLocal]);
  const endTime = useMemo(() => fromDatetimeLocalToISO(endLocal), [endLocal]);
  const recurrenceEndDate = useMemo(() => fromDatetimeLocalToISO(recurrenceEndLocal), [recurrenceEndLocal]);

  const validation = useMemo(() => {
    if (!resourceId) return "Resource ID is required";
    if (!startLocal || !endLocal) return "Start and end time are required";
    const s = new Date(startLocal).getTime();
    const e = new Date(endLocal).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e)) return "Invalid start/end time";
    if (e <= s) return "End time must be after start time";
    if (!Number.isFinite(Number(bufferMinutes)) || Number(bufferMinutes) < 0) return "Buffer must be 0 or higher";

    if (pattern === "WEEKLY" && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
      return "Select at least one day of week";
    }

    if (pattern === "MONTHLY") {
      const dom = Number(dayOfMonth);
      if (!Number.isFinite(dom) || dom < 1 || dom > 31) return "Day of month must be 1 to 31";
    }

    if (endType === "END_DATE" && !recurrenceEndLocal) return "Recurrence end date is required";
    if (endType === "END_DATE") {
      const rEnd = new Date(recurrenceEndLocal).getTime();
      if (!Number.isFinite(rEnd)) return "Invalid recurrence end date";
    }
    if (endType === "OCCURRENCES" && (!Number.isFinite(Number(occurrences)) || Number(occurrences) <= 0)) {
      return "Occurrences must be > 0";
    }

    return null;
  }, [
    resourceId,
    startLocal,
    endLocal,
    bufferMinutes,
    pattern,
    daysOfWeek,
    dayOfMonth,
    endType,
    recurrenceEndLocal,
    occurrences
  ]);

  const toggleDay = (day) => {
    setDaysOfWeek((prev) => {
      const set = new Set(prev || []);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return Array.from(set);
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validation;
    if (v) return setErr(v);

    setSubmitting(true);
    setErr("");
    setResult(null);

    try {
      const payload = {
        resourceId,
        startTime,
        endTime,
        bufferMinutes: Number(bufferMinutes),
        purpose: purpose || "Recurring booking",
        pattern,
        daysOfWeek: pattern === "WEEKLY" ? daysOfWeek : [],
        dayOfMonth: pattern === "MONTHLY" ? Number(dayOfMonth) : null,
        endType,
        recurrenceEndDate: endType === "END_DATE" ? recurrenceEndDate : null,
        occurrences: endType === "OCCURRENCES" ? Number(occurrences) : null,
        timezone,
        conflictResolution,
      };

      const res = await createRecurringBooking(payload);
      setResult(res);
    } catch (e2) {
      setErr(e2?.message || "Failed to create recurring booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="rbm__overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="rbm__modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rbm__head">
          <div>
            <div className="rbm__title">Create Recurrence Booking</div>
            <div className="rbm__sub">Set a pattern and we’ll create bookings in a series.</div>
          </div>
          <button className="rbm__close" type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="rbm__body" onSubmit={onSubmit}>
          <div className="rbm__grid2">
            <label className="rbm__label">
              Resource ID
              <input className="rbm__input" value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="UUID" />
            </label>

            <label className="rbm__label">
              Buffer minutes
              <input className="rbm__input" type="number" min="0" step="5" value={bufferMinutes} onChange={(e) => setBufferMinutes(e.target.value)} />
            </label>
          </div>

          <div className="rbm__grid2">
            <label className="rbm__label">
              Start time
              <input className="rbm__input" type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
            </label>

            <label className="rbm__label">
              End time
              <input className="rbm__input" type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
            </label>
          </div>

          <label className="rbm__label">
            Purpose
            <input className="rbm__input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g., Weekly team sync" />
          </label>

          <div className="rbm__grid3">
            <label className="rbm__label">
              Pattern
              <select className="rbm__input" value={pattern} onChange={(e) => setPattern(e.target.value)}>
                {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <label className="rbm__label">
              End type
              <select className="rbm__input" value={endType} onChange={(e) => setEndType(e.target.value)}>
                {END_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="rbm__label">
              Conflict resolution
              <select className="rbm__input" value={conflictResolution} onChange={(e) => setConflictResolution(e.target.value)}>
                {CONFLICTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="rbm__grid2">
            <label className="rbm__label">
              Timezone
              <select className="rbm__input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </label>

            {endType === "END_DATE" && (
              <label className="rbm__label">
                Recurrence end date
                <input className="rbm__input" type="datetime-local" value={recurrenceEndLocal} onChange={(e) => setRecurrenceEndLocal(e.target.value)} />
              </label>
            )}

            {endType === "OCCURRENCES" && (
              <label className="rbm__label">
                Occurrences
                <input className="rbm__input" type="number" min="1" step="1" value={occurrences} onChange={(e) => setOccurrences(e.target.value)} />
              </label>
            )}
          </div>

          {pattern === "MONTHLY" && (
            <div className="rbm__grid2">
              <label className="rbm__label">
                Day of month (1–31)
                <input
                  className="rbm__input"
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                />
              </label>
              <div />
            </div>
          )}

          {pattern === "WEEKLY" && (
            <div className="rbm__days">
              <div className="rbm__daysLabel">Days of week</div>
              <div className="rbm__daysGrid">
                {DAYS.map((d) => {
                  const checked = (daysOfWeek || []).includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`rbm__day ${checked ? "rbm__day--on" : ""}`}
                      onClick={() => toggleDay(d)}
                    >
                      {d.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {err ? <div className="rbm__error">{err}</div> : null}

          {result ? (
            <div className="rbm__result">
              <div className="rbm__resultTitle">{result.message || "Recurring booking created."}</div>
              <div className="rbm__resultMeta">
                Series: <b>{result.recurringSeriesId}</b> • Created: <b>{result.successfullyCreated}</b> • Skipped: <b>{result.skippedDueToConflicts}</b>
              </div>
            </div>
          ) : null}

          <div className="rbm__actions">
            <button className="rbm__btn" type="button" onClick={onClose}>Cancel</button>
            <button className="rbm__btn rbm__btn--primary" type="submit" disabled={submitting || !!validation}>
              {submitting ? "Creating..." : "Create Recurrence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
