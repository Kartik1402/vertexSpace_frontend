import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage.jsx";
import LoginPage from "./pages/auth/login/LoginPage.jsx";
import RegisterPage from "./pages/auth/register/RegisterPage.jsx";
import UserDashboard from "./pages/userDashboard/UserDashboard.jsx";
import BookingDashboardPage from "./pages/booking-dashboard/booking-dashboard.jsx";
import BookingConfirmedPage from "./pages/BookingConfirmedPage/BookingConfirmedPage.jsx";
import BookResourcePage from "./pages/BookResourcePage/BookResourcePage.jsx";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import RequireRole from "./shared/components/route-guards/RequireRole.jsx";
import AdminResourcesPage from "./pages/admin/AdminResourcesPage.jsx";
import { Navigate } from "react-router-dom";
import AdminBookingsMain from "./features/AdminBookingsMain/AdminBookingsMain.jsx";
import AdminBuildingsMain from "./features/AdminResourcesMain/AdminBuildingsMain.jsx";
import AdminFloorsMain from "./features/AdminResourcesMain/AdminFloorsMain.jsx";
import { AccessDenied } from "./pages/AccessDenid.jsx";
import { NotFound } from "./pages/Notfound.jsx";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage/>}/>
        <Route element={<RequireRole allowedRoles={["SYSTEM_ADMIN","DEPT_ADMIN","USER"]} />}>

      <Route path="/user-dashboard" element={<UserDashboard/>}></Route>
       <Route path="/my-bookings" element={<BookingDashboardPage />} />
       <Route path="/book-resource" element={<BookResourcePage />} />
       <Route path="/booking-confirmed" element={<BookingConfirmedPage />} />
       </Route>
        <Route element={<RequireRole allowedRoles={["SYSTEM_ADMIN","DEPT_ADMIN"]} />}>
        <Route path="/admin/buildings" element={<AdminBuildingsMain />} />
        <Route path="/admin/floors" element={<AdminFloorsMain/>}/>
        <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="resources" replace />} />
        <Route path="resources" element={<AdminResourcesPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsMain />} />
        </Route>
        </Route>
         <Route path="/403" element={<AccessDenied />} />
         <Route path="*" element={<NotFound />} />



    </Routes>
  );
}
