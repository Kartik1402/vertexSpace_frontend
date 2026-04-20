import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../../services/api";
import { apiUrl } from "../../../services/config";
import ResourceDetailsModal from "../../../shared/components/ResourceDetailsModal/ResourceDetailsModal";
import { useNavigate } from "react-router-dom";
import "./bestSlotsSection.css";

import roomImg from "../../../assets/room.jpg";
import deskImg from "../../../assets/desk.jpg";
import parkingImg from "../../../assets/parking.jpg";

const API_URL = apiUrl("/api/v1/availability/best-slots");

const WINDOW_START = 8 * 60; // 08:00 IST
const WINDOW_END = 20 * 60; // 20:00 IST

function typeToImage(resourceType) {
  const t = String(resourceType || "").toUpperCase();
  if (t.includes("PARK")) return parkingImg;
  if (t.includes("DESK") || t.includes("POD")) return deskImg;
  return roomImg;
}

function toDateInputValue(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function stripZoneBracket(zoned) {
  // Handles: 2026-02-22T10:00:00+05:30[Asia/Kolkata]
  if (!zoned) return zoned;
  return String(zoned).split("[")[0];
}

function hhmmFromMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function format12hFromMinutes(min) {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatTimeRangeIST(startIst, endIst) {
  const s = new Date(stripZoneBracket(startIst));
  const e = new Date(stripZoneBracket(endIst));
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";

  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${fmt.format(s)} - ${fmt.format(e)}`;
}

function formatUtcSync(startUtc, endUtc) {
  const s = new Date(startUtc);
  const e = new Date(endUtc);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return `${fmt.format(s)}-${fmt.format(e)} UTC`;
}

function suggestionStartMinutesIST(suggestion) {
  const startIst = new Date(stripZoneBracket(suggestion?.startIst));
  if (!Number.isNaN(startIst.getTime())) {
    return startIst.getHours() * 60 + startIst.getMinutes();
  }

  const startUtc = new Date(suggestion?.startUtc);
  if (Number.isNaN(startUtc.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).formatToParts(startUtc);

  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hh * 60 + mm;
}

function buildIstOffsetDateTime(dateUi, minutesFromMidnight) {
  // Build an IST timestamp string with explicit offset so JS can convert to UTC reliably.
  // Example: 2026-02-22T10:00:00+05:30
  if (!dateUi) return null;
  const hhmm = hhmmFromMinutes(minutesFromMidnight);
  return `${dateUi}T${hhmm}:00+05:30`;
}

export default function BestSlotsSection() {
  const navigate = useNavigate();

  const [dateUi, setDateUi] = useState(toDateInputValue(new Date()));
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState(""); // optional

  const [startMin, setStartMin] = useState(10 * 60); // default 10:00

  const latestStartMin = useMemo(() => {
    const d = Number(duration || 0);
    return Math.max(WINDOW_START, WINDOW_END - d);
  }, [duration]);

  useEffect(() => {
    // clamp startMin when duration changes
    setStartMin((v) => Math.min(Math.max(v, WINDOW_START), latestStartMin));
  }, [latestStartMin]);

  const slotStartLabel = format12hFromMinutes(startMin);
  const slotEndLabel = format12hFromMinutes(startMin + Number(duration || 0));

  // Selected slot in UTC (to use for card display sync + booking payload)
  const selectedSlot = useMemo(() => {
    const dur = Number(duration || 0);
    if (!dateUi || !Number.isFinite(dur) || dur <= 0) return null;

    const startIstOffset = buildIstOffsetDateTime(dateUi, startMin);
    if (!startIstOffset) return null;

    const startDate = new Date(startIstOffset);
    if (Number.isNaN(startDate.getTime())) return null;

    const endDate = new Date(startDate.getTime() + dur * 60_000);

    return {
      startUtcIso: startDate.toISOString(),
      endUtcIso: endDate.toISOString(),
      utcSyncLabel: formatUtcSync(startDate.toISOString(), endDate.toISOString()),
    };
  }, [dateUi, startMin, duration]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [raw, setRaw] = useState(null);
  const suggestions = raw?.suggestions || [];

  const filteredSuggestions = useMemo(() => {
    if (!Array.isArray(suggestions)) return [];

    return suggestions
      .filter((s) => {
        const sMin = suggestionStartMinutesIST(s);
        if (sMin === null) return true;

        // show suggestions starting at/after chosen start time
        // and also not after latestStartMin (so slot end stays within window)
        return sMin >= startMin && sMin <= latestStartMin;
      })
      .sort((a, b) => (suggestionStartMinutesIST(a) ?? 0) - (suggestionStartMinutesIST(b) ?? 0));
  }, [suggestions, startMin, latestStartMin]);

  const primarySuggestion = filteredSuggestions[0] || null;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const openDetails = (resourceId) => {
    setSelectedId(resourceId);
    setDetailsOpen(true);
  };

  const onQuickBook = (s) => {
    // Use the slider-selected slot times (UTC) for booking
    const startTime = selectedSlot?.startUtcIso ?? s.startUtc;
    const endTime = selectedSlot?.endUtcIso ?? s.endUtc;

    navigate("/book-resource", {
      state: {
        resourceId: s.resourceId,
        resourceName: s.resourceName,
        resourceType: s.resourceType,
        startTime,
        endTime,
        bufferMinutes: 15,
        purpose: "",
      },
    });
  };

  const submit = async () => {
    setLoading(true);
    setError("");

    try {
      const qs = new URLSearchParams();
      qs.set("dateIst", dateUi);
      qs.set("durationMinutes", String(Number(duration)));
      if (type) qs.set("type", type);

      const url = `${API_URL}?${qs.toString()}`;
      const data = await apiGet(url);

      setRaw(data);
    } catch (e) {
      setError(e?.message || "Failed to load best slots.");
      setRaw(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bestSlots">
      <div className="bestSlots__header">
        <div className="bestSlots__titleRow">
          <div className="bestSlots__icon" aria-hidden="true">
            ↻
          </div>
          <div className="bestSlots__title">Smart Slot Search</div>
        </div>

        <div className="bestSlots__status">
          <span className="bestSlots__dot" />
          <span>UTC BACKEND SYNC ACTIVE</span>
        </div>
      </div>

      <div className="bestSlots__panel">
        <div className="bestSlots__top">
          <div className="bestSlots__controls">
            <div className="bestSlots__field">
              <label className="bestSlots__label">SELECT DATE</label>
              <input
                className="bestSlots__input"
                type="date"
                value={dateUi}
                onChange={(e) => setDateUi(e.target.value)}
              />
            </div>

            <div className="bestSlots__field">
              <label className="bestSlots__label">DURATION (MINUTES)</label>
              <select
                className="bestSlots__input"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
            </div>

            <div className="bestSlots__field bestSlots__field--full">
              <div className="bestSlots__labelRow">
                <label className="bestSlots__label">
                  START TIME (08:00 - 20:00 IST WINDOW)
                </label>
                <div className="bestSlots__mini">{hhmmFromMinutes(startMin)} IST</div>
              </div>

              <input
                className="bestSlots__slider"
                type="range"
                min={WINDOW_START}
                max={latestStartMin}
                step={15}
                value={startMin}
                onChange={(e) => setStartMin(Number(e.target.value))}
              />

              <div className="bestSlots__sliderTicks">
                {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>

            <div className="bestSlots__actions">
              <button
                className="bestSlots__btn"
                onClick={submit}
                disabled={loading || !dateUi || !duration}
                type="button"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          <div className="bestSlots__slotPreview">
            <div className="bestSlots__slotLabel">TIME SLOT</div>

            <div className="bestSlots__slotValue">
              {slotStartLabel} - {slotEndLabel}
            </div>

            <div className="bestSlots__slotHint">Current Zone: Asia/Kolkata</div>

            {primarySuggestion && (
              <div className="bestSlots__nextHint">
                Next available:{" "}
                {formatTimeRangeIST(primarySuggestion.startIst, primarySuggestion.endIst)} IST
              </div>
            )}
          </div>
        </div>

        {error && <div className="bestSlots__error">{error}</div>}

        <div className="bestSlots__divider" />

        <div className="bestSlots__subhead">BEST-SLOT SUGGESTIONS</div>

        <div className="bestSlots__cards">
          {(loading ? [] : filteredSuggestions.length ? filteredSuggestions : suggestions)
            .slice(0, 5)
            .map((s) => {
              // Card should reflect the slider-selected slot time + UTC sync
              const sync = selectedSlot?.utcSyncLabel ?? formatUtcSync(s.startUtc, s.endUtc);
              const imgSrc = typeToImage(s.resourceType);

              const canQuickBook = !!(
                s?.resourceId &&
                (selectedSlot?.startUtcIso || s?.startUtc) &&
                (selectedSlot?.endUtcIso || s?.endUtc)
              );

              return (
                <div
                  key={`${s.resourceId}-${s.startUtc}`}
                  className="bestSlots__card"
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(s.resourceId)}
                  onKeyDown={(e) => e.key === "Enter" && openDetails(s.resourceId)}
                >
                  <div className="bestSlots__cardImgWrap">
                    {imgSrc ? (
                      <img className="bestSlots__cardImg" alt="" src={imgSrc} />
                    ) : (
                      <div className="bestSlots__cardImgPlaceholder" aria-hidden="true" />
                    )}
                  </div>

                  <div className="bestSlots__cardBody">
                    <div className="bestSlots__cardName">{s.resourceName}</div>

                    <div className="bestSlots__cardMeta">
                      {slotStartLabel} - {slotEndLabel} IST
                    </div>

                    {sync ? <div className="bestSlots__cardMeta">Sync: {sync}</div> : null}

                    <div className="bestSlots__cardMeta">
                      {s.capacity ? `Capacity: ${s.capacity}` : ""}
                      {(s.capacity && (s.buildingName || s.floorName)) ? " • " : ""}
                      {(s.buildingName || s.floorName)
                        ? `${s.buildingName || "—"} • ${s.floorName || "—"}`
                        : ""}
                    </div>

                    <button
                      className="bestSlots__quickBtn"
                      type="button"
                      disabled={!canQuickBook}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canQuickBook) onQuickBook(s);
                      }}
                    >
                      QuickBook
                    </button>
                  </div>
                </div>
              );
            })}

          {!loading && !error && suggestions.length === 0 && (
            <div className="bestSlots__empty">No suggestions found for this search.</div>
          )}
        </div>
      </div>

      <ResourceDetailsModal
        open={detailsOpen}
        resourceId={selectedId}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}
