import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuth, isLoggedIn, getRoleKey } from "../../../services/authStorage";

export default function RequireRole({
  allowedRoles = [],
  redirectTo = "/login",
  unauthorizedTo = "/403",
}) {
  const location = useLocation();
  const auth = getAuth();

  if (!isLoggedIn()) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  const role = getRoleKey(auth);
  const ok = allowedRoles.length === 0 || allowedRoles.includes(role);

  return ok ? <Outlet /> : <Navigate to={unauthorizedTo} replace />;
}
