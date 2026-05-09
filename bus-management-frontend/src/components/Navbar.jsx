import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">🚌 Bus Management</div>

      <div className="navbar-links">
        {!user && (
          <NavLink to="/customer/search">Tìm chuyến xe</NavLink>
        )}
        {user?.role === 'ADMIN' && (
          <>
            <NavLink to="/admin/dashboard">Tổng quan</NavLink>
            <NavLink to="/admin/companies">Nhà xe</NavLink>
            <NavLink to="/admin/staff">Nhân viên</NavLink>
            <NavLink to="/admin/routes">Tuyến đường</NavLink>
          </>
        )}
        {user?.role === 'STAFF' && (
          <NavLink to="/staff/routes">Tuyến đường</NavLink>
        )}
        {user?.role === 'OWNER' && (
          <>
            <NavLink to="/owner/dashboard">Tổng quan</NavLink>
            <NavLink to="/owner/company">Công ty</NavLink>
            <NavLink to="/owner/vehicles">Xe</NavLink>
            <NavLink to="/owner/drivers">Tài xế</NavLink>
            <NavLink to="/owner/assignments">Phân công</NavLink>
          </>
        )}
        {user?.role === 'CUSTOMER' && (
          <>
            <NavLink to="/customer/search">Tìm chuyến xe</NavLink>
            <NavLink to="/customer/tickets">Vé của tôi</NavLink>
          </>
        )}
      </div>

      <div className="navbar-user">
        {user ? (
          <>
            <NavLink to="/profile">{user.fullName || user.username}</NavLink>
            <NavLink to="/change-password">Đổi mật khẩu</NavLink>
            <button className="theme-toggle" onClick={toggle} title={dark ? 'Sáng' : 'Tối'}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
          </>
        ) : (
          <>
            <button className="theme-toggle" onClick={toggle} title={dark ? 'Sáng' : 'Tối'}>
              {dark ? '☀️' : '🌙'}
            </button>
            <NavLink to="/register" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>Đăng ký</NavLink>
            <NavLink to="/login" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>Đăng nhập</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
