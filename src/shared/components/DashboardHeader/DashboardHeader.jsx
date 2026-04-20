import React, { useEffect, useMemo, useRef, useState } from "react";
import "./dashboardHeader.css";
import { getAuth, clearAuth } from "../../../services/authStorage";
import { useNavigate } from "react-router-dom";
import RecurringBookingModal from "../RecurringBookingModal/RecurringBookingModal";
import NotificationsDrawer from "../NotificationsDrawer/NotificationsDrawer"; // adjust path if needed
import { logout } from "../../../services/api";

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}

export default function DashboardHeader({
  activeTab = "overview",
  notificationCount = 0,
  onNotificationCountChange, // optional
}) {
  const navigate = useNavigate();

  const [auth, setAuth] = useState(() => getAuth());
  const [recOpen, setRecOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(Number(notificationCount) || 0);

  // profile menu (logout)
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuWrapRef = useRef(null);

  // keep local badge in sync if parent updates it
  useEffect(() => {
    setUnreadCount(Number(notificationCount) || 0);
  }, [notificationCount]);

  // Updates if localStorage changes in another tab/window
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key) setAuth(getAuth());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // close profile menu on outside click + Escape
  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e) => {
      const el = menuWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setMenuOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const { displayName, subLabel, initials } = useMemo(() => {
    const user = auth?.user || {};
    const name = (user.displayName || user.email || "User").trim();
    const label = String(user.departmentName || user.role || "USER");
    return { displayName: name, subLabel: label, initials: getInitials(name) };
  }, [auth]);

  const handleUnreadCountChange = (n) => {
    const val = Number(n) || 0;
    setUnreadCount(val);
    onNotificationCountChange?.(val);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();     // backend must return 2xx/200 to succeed
      clearAuth();        // remove token/auth from localStorage
      setAuth(null);      // update current tab immediately
      setMenuOpen(false);
      navigate("/login", { replace: true });
    } catch (e) {
      alert(e?.message || "Logout failed.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="dashHeader">
        <div className="dashHeader__left">
          <div className="dashHeader__brandWrap">
            <div className="dashHeader__logo" aria-hidden="true" />
            <div className="dashHeader__brand">VertexSpace</div>
          </div>

          <nav className="dashHeader__nav" aria-label="Dashboard navigation">
            <button
              type="button"
              className={`dashHeader__tab ${activeTab === "overview" ? "isActive" : ""}`}
              disabled
            >
              Overview
            </button>

            <button
              type="button"
              className={`dashHeader__tab ${activeTab === "bookings" ? "isActive" : ""}`}
              onClick={() => navigate("/my-bookings")}
            >
              My Bookings
            </button>

            <button type="button" className="dashHeader__recBtn" onClick={() => setRecOpen(true)}>
              Create Recurrence Booking
            </button>
          </nav>
        </div>

        <div className="dashHeader__right">
          <button
            type="button"
            className="dashHeader__iconBtn"
            onClick={() => setNotifOpen(true)}
            aria-label="Open notifications"
          >
            <span className="dashHeader__bell" aria-hidden="true" />
            {unreadCount > 0 && <span className="dashHeader__badge">{unreadCount}</span>}
          </button>

          <div className="dashHeader__divider" aria-hidden="true" />

          {/* Profile + Logout dropdown */}
          <div className="dashHeader__menuWrap" ref={menuWrapRef}>
            <button
              type="button"
              className="dashHeader__profile"
              aria-label="Open profile menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <div className="dashHeader__profileText">
                <div className="dashHeader__name">{displayName}</div>
                <div className="dashHeader__subLabel">{subLabel}</div>
              </div>
              <div className="dashHeader__avatar" aria-hidden="true">
                {initials}
              </div>
            </button>

            {menuOpen && (
              <div className="dashHeader__menu" role="menu" aria-label="Profile actions">
                <button
                  type="button"
                  className="dashHeader__menuItem dashHeader__menuItem--danger"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  role="menuitem"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <RecurringBookingModal
        open={recOpen}
        onClose={() => setRecOpen(false)}
        seed={{
          resourceId: "",
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          bufferMinutes: 60,
          purpose: "test recurring booking",
          pattern: "WEEKLY",
          daysOfWeek: ["WEDNESDAY"],
          endType: "END_DATE",
          recurrenceEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          timezone: "UTC",
          conflictResolution: "SKIP_CONFLICTS",
        }}
      />

      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </>
  );
}
