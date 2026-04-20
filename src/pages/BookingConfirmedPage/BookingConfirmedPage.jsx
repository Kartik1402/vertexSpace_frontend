import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookingConfirmedPage.css";

export default function BookingConfirmedPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const b = state?.booking;

  return (
    <div className="bc">
      <div className="bc__card">
        <div className="bc__check">✓</div>
        <div className="bc__title">Booking Confirmed!</div>
        <div className="bc__sub">Your workspace has been successfully secured.</div>

        <div className="bc__box">
          <div className="bc__name">{b?.resourceName || "Resource"}</div>
          <div className="bc__meta">
            <span className="bc__pill">{b?.status || "CONFIRMED"}</span>
            <span className="bc__muted">{b?.resourceType || ""}</span>
          </div>

          <div className="bc__grid">
            <div>
              <div className="bc__label">Start</div>
              <div className="bc__value">{b?.startTime ? new Date(b.startTime).toLocaleString() : "-"}</div>
            </div>
            <div>
              <div className="bc__label">End</div>
              <div className="bc__value">{b?.endTime ? new Date(b.endTime).toLocaleString() : "-"}</div>
            </div>
            <div>
              <div className="bc__label">Location</div>
              <div className="bc__value">
                {(b?.buildingName || "-") + " • " + (b?.floorName || "-")}
              </div>
            </div>
            <div>
              <div className="bc__label">Buffer</div>
              <div className="bc__value">{Number(b?.bufferMinutes ?? 0)} minutes</div>
            </div>
          </div>
        </div>

        <div className="bc__actions">
          <button className="bc__btn bc__btn--primary" onClick={() => navigate("/my-bookings")}>
            View in My Bookings
          </button>
          <button className="bc__btn" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
