import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
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
import CustomerSchedulesPage from './pages/customer/CustomerSchedulesPage';
import CustomerTicketsPage from './pages/customer/CustomerTicketsPage';
import CustomerRegisterPage from './pages/CustomerRegisterPage';
import './App.css';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/customer" element={<CustomerRegisterPage />} />
        <Route path="/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />

        <Route path="/admin/companies" element={<PrivateRoute role="ADMIN"><CompaniesPage /></PrivateRoute>} />
        <Route path="/admin/companies/:id" element={<PrivateRoute role="ADMIN"><CompanyDetailPage /></PrivateRoute>} />
        <Route path="/admin/routes" element={<PrivateRoute role="ADMIN"><RoutesPage /></PrivateRoute>} />

        <Route path="/staff/routes" element={<PrivateRoute role="STAFF"><StaffRoutesPage /></PrivateRoute>} />

        <Route path="/owner/company" element={<PrivateRoute role="OWNER"><CompanyPage /></PrivateRoute>} />
        <Route path="/owner/vehicles" element={<PrivateRoute role="OWNER"><VehiclesPage /></PrivateRoute>} />
        <Route path="/owner/drivers" element={<PrivateRoute role="OWNER"><DriversPage /></PrivateRoute>} />
        <Route path="/owner/assignments" element={<PrivateRoute role="OWNER"><AssignmentsPage /></PrivateRoute>} />

        <Route path="/customer/schedules" element={<PrivateRoute role="CUSTOMER"><CustomerSchedulesPage /></PrivateRoute>} />
        <Route path="/customer/tickets" element={<PrivateRoute role="CUSTOMER"><CustomerTicketsPage /></PrivateRoute>} />

        <Route path="/" element={
          user
            ? user.role === 'ADMIN'
              ? <Navigate to="/admin/companies" />
              : user.role === 'STAFF'
                ? <Navigate to="/staff/routes" />
                : user.role === 'CUSTOMER'
                  ? <Navigate to="/customer/schedules" />
                  : <Navigate to="/owner/company" />
            : <Navigate to="/login" />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
