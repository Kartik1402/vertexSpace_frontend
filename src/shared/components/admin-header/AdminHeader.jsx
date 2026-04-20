import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../../../services/authStorage";
import { logout } from "../../../services/api";
import "./adminHeader.css";

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}

function normalizeRole(auth) {
  const raw =
    auth?.user?.role ||
    auth?.user?.roles?.[0] ||
    auth?.role ||
    auth?.roles?.[0] ||
    "";

  const r = String(raw).toUpperCase();
  if (r.includes("SYSTEM")) return "SYSTEM_ADMIN";
  if (r.includes("DEPARTMENT")) return "DEPARTMENT_ADMIN";
  return r || "DEPARTMENT_ADMIN";
}

export default function AdminHeader({
  activeTab = "overview", // "overview" | "assignment"
  overviewPath = "/admin/overview",
  bookingPath = "/admin/bookings",
}) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() => getAuth());

  // logout menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuWrapRef = useRef(null);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key) setAuth(getAuth());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // close menu on outside click + Escape
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

  const { displayName, subLabel, initials, roleKey, roleLabel } = useMemo(() => {
    const user = auth?.user || {};
    const name = (user.displayName || user.email || "Admin").trim();
    const roleKey = normalizeRole(auth);

    const roleLabel =
      roleKey === "SYSTEM_ADMIN"
        ? "System Admin"
        : roleKey === "DEPARTMENT_ADMIN"
          ? "Department Admin (Read-only)"
          : roleKey;

    const sub = String(user.departmentName || user.title || roleLabel);

    return {
      displayName: name,
      subLabel: sub,
      initials: getInitials(name),
      roleKey,
      roleLabel,
    };
  }, [auth]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();     // success only if backend returns 2xx/200
      clearAuth();        // remove token/auth from localStorage
      setAuth(null);      // update same tab immediately
      setMenuOpen(false);
      navigate("/login", { replace: true });
    } catch (e) {
      alert(e?.message || "Logout failed.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="adminHeader">
      <div className="adminHeader__left">
        <button
          type="button"
          className="adminHeader__brand"
          onClick={() => navigate(overviewPath)}
          aria-label="Go to admin overview"
        >
          <span className="adminHeader__logo" aria-hidden="true" />
          <span className="adminHeader__brandName">VertexSpace</span>
        </button>
      </div>

      <nav className="adminHeader__center" aria-label="Admin navigation">
        <button
          type="button"
          className={`adminHeader__tab`}
          onClick={() => navigate(overviewPath)}
        >
          Overview
        </button>
        <button
          type="button"
          className={`adminHeader__tab ${activeTab === "bookings" ? "isActive" : ""}`}
          onClick={() => navigate(bookingPath)}
        >
          Bookings
        </button>
        
        {/* {(roleKey === "SYSTEM_ADMIN" || roleKey === "DEPARTMENT_ADMIN") && (
          <NavLink to="/admin/bookings" className="header__link">
            Bookings  
          </NavLink>
        )} */}
      </nav>

      <div className="adminHeader__right">
        <span
          className={`adminHeader__pill ${roleKey === "DEPARTMENT_ADMIN" ? "isReadOnly" : ""}`}
          aria-label={`Admin mode: ${roleLabel}`}
        >
          ADMIN MODE • {roleLabel}
        </span>

        <div className="adminHeader__divider" aria-hidden="true" />

        {/* Profile + Logout dropdown */}
        <div className="adminHeader__menuWrap" ref={menuWrapRef}>
          <button
            type="button"
            className="adminHeader__profile"
            aria-label="Open profile menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <div className="adminHeader__profileText">
              <div className="adminHeader__name">{displayName}</div>
              <div className="adminHeader__role">{subLabel}</div>
            </div>

            <div className="adminHeader__avatar" aria-hidden="true">
              {initials}
            </div>
          </button>

          {menuOpen && (
            <div className="adminHeader__menu" role="menu" aria-label="Profile actions">
              <button
                type="button"
                className="adminHeader__menuItem adminHeader__menuItem--danger"
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
  );
}
