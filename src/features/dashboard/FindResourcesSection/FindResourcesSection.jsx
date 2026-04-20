import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../../services/api";
import { apiUrl } from "../../../services/config";
import ResourceDetailsModal from "../../../shared/components/ResourceDetailsModal/ResourceDetailsModal";
import { useNavigate } from "react-router-dom";
import "./findResourcesSection.css";
import imgurl from "../../../assets/Hero.jpg"
const API_URL = apiUrl("/api/v1/resources");

// If your backend uses different names (e.g., pageNo/pageSize), change here:
const PAGE_PARAM = "page"; // try: "page" or "pageNo"
const SIZE_PARAM = "size"; // try: "size" or "pageSize"

// IST helpers for availability filter (Instant)
const IST_OFFSET = "+05:30";
function toIsoInstantFromIst(dateYYYYMMDD, timeHHMM) {
  if (!dateYYYYMMDD || !timeHHMM) return null;
  const d = new Date(`${dateYYYYMMDD}T${timeHHMM}:00${IST_OFFSET}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function addMinutesToIsoInstant(isoInstant, minutes) {
  const d = new Date(isoInstant);
  if (Number.isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() + Number(minutes || 0));
  return d.toISOString();
}

function toDateInputValue(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function badgeLabel(type) {
  const t = String(type || "").toUpperCase();
  if (!t) return "RESOURCE";
  return t.replaceAll("_", " ");
}

function nextRoundedISO(stepMinutes = 15) {
  const now = new Date();
  const ms = now.getTime();
  const step = stepMinutes * 60 * 1000;
  const rounded = new Date(Math.ceil(ms / step) * step);
  return rounded.toISOString();
}

function addMinutesISO(iso, minutes) {
  const d = new Date(iso);
  return new Date(d.getTime() + minutes * 60 * 1000).toISOString();
}

export default function FindResourcesSection() {
  const navigate = useNavigate();

  // UI filters (all optional)
  const [searchText, setSearchText] = useState(""); // client-side filter by name/building/floor
  const [type, setType] = useState(""); // ResourceType
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [minCapacity, setMinCapacity] = useState("");

  // Availability optional filter
  const [available, setAvailable] = useState(false);
  const [dateUi, setDateUi] = useState(toDateInputValue(new Date()));
  const [startTimeUi, setStartTimeUi] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Pagination
  const [page, setPage] = useState(1); // 1-based for UI
  const [pageSize, setPageSize] = useState(10);

  // Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState(null);

  const resources = raw?.resources || [];
  const totalCount = Number(raw?.totalCount ?? resources.length ?? 0);

  const filteredClientSide = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return resources;

    return resources.filter((r) => {
      const name = String(r?.name || "").toLowerCase();
      const b = String(r?.buildingName || "").toLowerCase();
      const f = String(r?.floorName || "").toLowerCase();
      return name.includes(q) || b.includes(q) || f.includes(q);
    });
  }, [resources, searchText]);

  // If backend ignores paging and returns all, this still paginates UI.
  const pagedClientSide = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredClientSide.slice(start, end);
  }, [filteredClientSide, page, pageSize]);

  const effectiveTotal = useMemo(() => {
    // Prefer backend totalCount when it looks valid; else use client filtered length.
    if (Number.isFinite(totalCount) && totalCount > 0) return totalCount;
    return filteredClientSide.length;
  }, [totalCount, filteredClientSide.length]);

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const openDetails = (resourceId) => {
    setSelectedId(resourceId);
    setDetailsOpen(true);
  };

  const seedBookingTimes = () => {
    // If availability filter is ON, seed booking with that exact window.
    if (available) {
      const startIso = toIsoInstantFromIst(dateUi, startTimeUi);
      const endIso = startIso ? addMinutesToIsoInstant(startIso, durationMinutes) : null;
      return { startTime: startIso || "", endTime: endIso || "" };
    }

    // Otherwise seed something reasonable (next 15-min slot + 60 mins).
    const startTime = nextRoundedISO(15);
    const endTime = addMinutesISO(startTime, 60);
    return { startTime, endTime };
  };

  const onBookResource = (r) => {
    const { startTime, endTime } = seedBookingTimes();

    navigate("/book-resource", {
      state: {
        resourceId: r.id,
        resourceName: r.name,
        resourceType: r.resourceType,
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

      // Pagination params (most important to avoid only 2 results)
      qs.set(PAGE_PARAM, String(page));
      qs.set(SIZE_PARAM, String(pageSize));

      // Optional filters
      if (type) qs.set("type", type);
      if (buildingId) qs.set("buildingId", buildingId);
      if (floorId) qs.set("floorId", floorId);
      if (departmentId) qs.set("departmentId", departmentId);
      if (minCapacity) qs.set("minCapacity", String(Number(minCapacity)));

      // Availability filter: available=true requires startTime & endTime
      if (available) {
        const startIso = toIsoInstantFromIst(dateUi, startTimeUi);
        const endIso = startIso ? addMinutesToIsoInstant(startIso, durationMinutes) : null;

        if (!startIso || !endIso) {
          setError("Start time and end time are required.");
          setLoading(false);
          return;
        }

        const now = new Date();
        const start = new Date(startIso);

        if (start.getTime() < now.getTime()) {
          setError("Please choose a future time for availability.");
          setLoading(false);
          return;
        }

        qs.set("available", "true");
        qs.set("startTime", startIso);
        qs.set("endTime", endIso);
      }

      const url = `${API_URL}?${qs.toString()}`;
      const data = await apiGet(url);
      setRaw(data);
    } catch (e) {
      setError(e?.message || "Failed to load resources.");
      setRaw(null);
    } finally {
      setLoading(false);
    }
  };

  // Load once
  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When paging values change, refetch (so backend paging works)
  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // If filters change, reset to page 1 (don’t strand user on later pages)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, buildingId, floorId, departmentId, minCapacity, available, dateUi, startTimeUi, durationMinutes]);

  const onSearchClick = () => submit();

  return (
    <section className="findResources">
      <div className="findResources__head">
        <div className="findResources__title">Find a Resource</div>
        <div className="findResources__meta">
          {loading ? "Loading..." : `${effectiveTotal} total`}
        </div>
      </div>

      <div className="findResources__filters">
        <input
          className="findResources__input findResources__input--wide"
          placeholder="Search building, floor, or resource name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select
          className="findResources__input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Resource Type (All)</option>
          <option value="MEETING_ROOM"> Room</option>
          <option value="DESK">Desk</option>
          <option value="PARKING">Parking</option>
        </select>

        <button
          className="findResources__btn"
          type="button"
          onClick={onSearchClick}
          disabled={loading}
        >
          Search
        </button>

        <div className="findResources__advanced">
          <div className="findResources__advancedRow">
            <input
              className="findResources__input"
              placeholder="Min capacity (optional)"
              inputMode="numeric"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
            />
          </div>

          <div className="findResources__advancedRow">
            <label className="findResources__check">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span>Check availability</span>
            </label>

            <input
              className="findResources__input"
              type="date"
              value={dateUi}
              onChange={(e) => setDateUi(e.target.value)}
              disabled={!available}
            />

            <input
              className="findResources__input"
              type="time"
              value={startTimeUi}
              onChange={(e) => setStartTimeUi(e.target.value)}
              disabled={!available}
            />

            <select
              className="findResources__input"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              disabled={!available}
            >
              <option value={30}>30m</option>
              <option value={45}>45m</option>
              <option value={60}>60m</option>
              <option value={90}>90m</option>
              <option value={120}>120m</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="findResources__error">{error}</div>}

      <div className="findResources__pager">
        <div className="findResources__pagerLeft">
          <button
            className="findResources__pagerBtn"
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Prev
          </button>

          <div className="findResources__pagerInfo">
            Page {page} of {totalPages}
          </div>

          <button
            className="findResources__pagerBtn"
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>

        <div className="findResources__pagerRight">
          <span className="findResources__pagerLabel">Rows:</span>
          <select
            className="findResources__input findResources__input--small"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            disabled={loading}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      <div className="findResources__list">
        {(loading ? [] : pagedClientSide).map((r) => (
          <div
            key={r.id}
            className="findResources__row"
            role="button"
            tabIndex={0}
            onClick={() => openDetails(r.id)}
            onKeyDown={(e) => e.key === "Enter" && openDetails(r.id)}
          >
            <div className="findResources__thumb" aria-hidden="true" >
              <image src={imgurl} alt="nothing"/>
              </div>

            <div className="findResources__body">
              <div className="findResources__nameRow">
                <span className="findResources__badge">{badgeLabel(r.resourceType)}</span>
                <span className="findResources__name">{r.name}</span>
              </div>

              <div className="findResources__sub">
                {r.buildingName || "—"} • {r.floorName || "—"}
                {Number.isFinite(r.floorNumber) ? ` (Floor ${r.floorNumber})` : ""}
              </div>

              <div className="findResources__sub">
                {r.owningDepartmentName ? `${r.owningDepartmentName} (${r.owningDepartmentCode || "—"})` : ""}
                {r.capacity ? ` • Capacity: ${r.capacity}` : ""}
                {typeof r.isActive === "boolean" ? ` • ${r.isActive ? "Active" : "Inactive"}` : ""}
              </div>
            </div>

            <div className="findResources__right">
              <button
                className="findResources__bookBtn"
                type="button"
                disabled={!r?.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onBookResource(r);
                }}
              >
                Book Resource
              </button>
            </div>
          </div>
        ))}

        {!loading && !error && filteredClientSide.length === 0 && (
          <div className="findResources__empty">No resources match your filters.</div>
        )}
      </div>

      <ResourceDetailsModal
        open={detailsOpen}
        resourceId={selectedId}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}
