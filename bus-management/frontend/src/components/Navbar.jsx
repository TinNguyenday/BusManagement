import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">🚌 Bus Management</div>
      <div className="navbar-links">
        {user?.role === 'ADMIN' && (
          <>
            <Link to="/admin/companies">Nhà xe</Link>
            <Link to="/admin/routes">Tuyến đường</Link>
          </>
        )}
        {user?.role === 'STAFF' && (
          <>
            <Link to="/staff/routes">Tuyến đường</Link>
          </>
        )}
        {user?.role === 'OWNER' && (
          <>
            <Link to="/owner/company">Công ty</Link>
            <Link to="/owner/vehicles">Xe</Link>
            <Link to="/owner/drivers">Tài xế</Link>
            <Link to="/owner/assignments">Phân công</Link>
          </>
        )}
        {user?.role === 'CUSTOMER' && (
          <>
            <Link to="/customer/schedules">Tìm chuyến xe</Link>
            <Link to="/customer/tickets">Vé của tôi</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <span>{user?.fullName}</span>
        {location.pathname !== '/change-password' && (
          <Link to="/change-password" style={{ color: '#b2bec3', fontSize: 13, textDecoration: 'none' }}>Đổi mật khẩu</Link>
        )}
        <button onClick={handleLogout}>Đăng xuất</button>
      </div>
    </nav>
  );
}
