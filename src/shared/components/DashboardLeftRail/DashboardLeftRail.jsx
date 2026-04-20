import React from "react";
import "./dashboardLeftRail.css";

export default function DashboardLeftRail({ onOpenNotifications, notificationCount = 0 }) {
  return (
    <div className="dlr" aria-label="Dashboard left rail">
      <button
        type="button"
        className="dlr__btn"
        onClick={onOpenNotifications}
        aria-label="Open notifications"
      >
        <span className="dlr__icon" aria-hidden="true">🔔</span>
        {Number(notificationCount) > 0 ? <span className="dlr__badge">{notificationCount}</span> : null}
      </button>
    </div>
  );
}
