import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminHeader from "../../shared/components/admin-header/AdminHeader";
import AdminSidebar from "../../shared/components/admin-sidebar/AdminSidebar";
import "./adminLayout.css";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const activeTab = pathname.startsWith("/admin/assignment") ? "assignment" : "overview";

  return (
    <>
      <AdminHeader
        activeTab={activeTab}
        overviewPath="/admin"
        assignmentPath="/admin/assignment"
      />
      <AdminSidebar />
      <main className="adminMain">
        <Outlet />
      </main>
    </>
  );
}
