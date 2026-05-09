import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminVehiclesPage from './pages/admin/AdminVehiclesPage';
import AdminDriversPage from './pages/admin/AdminDriversPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import CompaniesPage from './pages/admin/CompaniesPage';
import CompanyDetailPage from './pages/admin/CompanyDetailPage';
import RoutesPage from './pages/admin/RoutesPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import StaffRoutesPage from './pages/staff/StaffRoutesPage';
import CompanyPage from './pages/owner/CompanyPage';
import VehiclesPage from './pages/owner/VehiclesPage';
import DriversPage from './pages/owner/DriversPage';
import AssignmentsPage from './pages/owner/AssignmentsPage';
import OAuth2CallbackPage from './pages/OAuth2CallbackPage';
import ProfilePage from './pages/ProfilePage';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import CustomerSearchPage from './pages/customer/CustomerSearchPage';
import CustomerTicketsPage from './pages/customer/CustomerTicketsPage';
import './App.css';

const HIDE_NAVBAR = ['/login', '/register', '/oauth2/callback'];
const isCustomerRoute = (path) => path.startsWith('/customer');

function AppRoutes() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const showNavbar = !HIDE_NAVBAR.includes(pathname) && !isCustomerRoute(pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
        <Route path="/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />

        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute role="ADMIN"><AdminDashboardPage /></PrivateRoute>} />
        <Route path="/admin/companies" element={<PrivateRoute role="ADMIN"><CompaniesPage /></PrivateRoute>} />
        <Route path="/admin/staff" element={<PrivateRoute role="ADMIN"><AdminStaffPage /></PrivateRoute>} />
        <Route path="/admin/companies/:id" element={<PrivateRoute role="ADMIN"><CompanyDetailPage /></PrivateRoute>} />
        <Route path="/admin/routes"    element={<PrivateRoute role="ADMIN"><RoutesPage /></PrivateRoute>} />
        <Route path="/admin/vehicles"  element={<PrivateRoute role="ADMIN"><AdminVehiclesPage /></PrivateRoute>} />
        <Route path="/admin/drivers"   element={<PrivateRoute role="ADMIN"><AdminDriversPage /></PrivateRoute>} />
        <Route path="/admin/users"     element={<PrivateRoute role="ADMIN"><AdminUsersPage /></PrivateRoute>} />

        <Route path="/staff/routes" element={<PrivateRoute role="STAFF"><StaffRoutesPage /></PrivateRoute>} />

        <Route path="/owner/dashboard" element={<PrivateRoute role="OWNER"><OwnerDashboardPage /></PrivateRoute>} />
        <Route path="/owner/company" element={<PrivateRoute role="OWNER"><CompanyPage /></PrivateRoute>} />
        <Route path="/owner/vehicles" element={<PrivateRoute role="OWNER"><VehiclesPage /></PrivateRoute>} />
        <Route path="/owner/drivers" element={<PrivateRoute role="OWNER"><DriversPage /></PrivateRoute>} />
        <Route path="/owner/assignments" element={<PrivateRoute role="OWNER"><AssignmentsPage /></PrivateRoute>} />

        <Route path="/customer/search" element={<CustomerSearchPage />} />
        <Route path="/customer/tickets" element={<PrivateRoute role="CUSTOMER"><CustomerTicketsPage /></PrivateRoute>} />

        <Route path="/" element={
          user
            ? user.role === 'ADMIN'
              ? <Navigate to="/admin/dashboard" />
              : user.role === 'STAFF'
                ? <Navigate to="/staff/routes" />
                : user.role === 'CUSTOMER'
                  ? <Navigate to="/customer/search" />
                  : <Navigate to="/owner/dashboard" />
            : <Navigate to="/customer/search" />
        } />
        <Route path="*" element={<Navigate to="/customer/search" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
