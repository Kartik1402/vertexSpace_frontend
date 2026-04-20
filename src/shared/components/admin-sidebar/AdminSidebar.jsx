import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth } from "../../../services/authStorage";
import "./adminSidebar.css";

function getRoleKeyFromAuth(auth) {
  const raw =
    auth?.user?.role ||
    auth?.user?.roles?.[0] ||
    auth?.role ||
    auth?.roles?.[0] ||
    "";

  const r = String(raw).trim().toUpperCase();

  if (r.includes("SYSTEM")) return "SYSTEM_ADMIN";
  if (r.includes("DEPT") || r.includes("DEPARTMENT")) return "DEPARTMENT_ADMIN";

  // safest default: treat unknown as read-only
  return r || "DEPARTMENT_ADMIN";
}

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "building") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          {...stroke}
          d="M4.5 20.5V5.8c0-.7.6-1.3 1.3-1.3h7.4c.7 0 1.3.6 1.3 1.3v14.7"
        />
        <path {...stroke} d="M3 20.5h18" />
        <path {...stroke} d="M8 8h3M8 11h3M8 14h3" />
        <path {...stroke} d="M15.5 10h2.7c.7 0 1.3.6 1.3 1.3v9.2" />
        <path {...stroke} d="M17 13h1.8M17 16h1.8" />
      </svg>
    );
  }

  if (name === "layers") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M12 3l9 5-9 5-9-5 9-5Z" />
        <path {...stroke} d="M3 12l9 5 9-5" />
        <path {...stroke} d="M3 16l9 5 9-5" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M7.5 11V8.8a4.5 4.5 0 0 1 9 0V11" />
        <path
          {...stroke}
          d="M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z"
        />
      </svg>
    );
  }

  return null;
}

export default function AdminSidebar({
  roleKey: roleKeyOverride, // optional override (e.g., from parent)
  buildingListPath = "/admin/buildings",
  buildingCreatePath = "/admin/buildings/new",
  floorListPath = "/admin/floors",
  floorCreatePath = "/admin/floors/new",
}) {
  const navigate = useNavigate();

  const auth = getAuth();
  const roleKey = roleKeyOverride || getRoleKeyFromAuth(auth);

  const canCreate = roleKey === "SYSTEM_ADMIN";
  const createHint = canCreate ? "Create" : "System Admin only";

  return (
    <aside className="adminSide" aria-label="Admin sidebar">
      <div className="adminSide__inner">
        <div className="adminSide__section">
          <div className="adminSide__heading">Building Management</div>

{ (
  <NavLink to="/admin/buildings" className="adminSide__item" end>
    <span className="adminSide__icon">
      <Icon name="building" />
    </span>
    <span className="adminSide__label">List Buildings</span>
  </NavLink>
)}
        </div>

        <div className="adminSide__divider" />

        <div className="adminSide__section">
          <div className="adminSide__heading">Floor Management</div>

          <NavLink
            to={floorListPath}
            className={({ isActive }) =>
              `adminSide__item ${isActive ? "isActive" : ""}`
            }
          >
            <span className="adminSide__icon">
              <Icon name="layers" />
            </span>
            <span className="adminSide__label">List Floors</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
