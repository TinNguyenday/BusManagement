import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="cl-root">
      {/* ===== HEADER ===== */}
      <header className="cl-header">
        <div className="cl-header-inner">
          <NavLink to="/customer/search" className="cl-logo">
            🚌 <span>BusGo</span>
          </NavLink>

          <nav className="cl-nav">
            <NavLink to="/customer/search">Tìm chuyến xe</NavLink>
            {user && <NavLink to="/customer/tickets">Vé của tôi</NavLink>}
          </nav>

          <div className="cl-header-right">
            <button className="cl-theme-btn" onClick={toggle} title={dark ? 'Chế độ sáng' : 'Chế độ tối'}>
              {dark ? '☀️' : '🌙'}
            </button>
            {user ? (
              <div className="cl-user">
                <NavLink to="/profile" className="cl-user-name">{user.fullName || user.username}</NavLink>
                <button className="cl-btn-ghost" onClick={handleLogout}>Đăng xuất</button>
              </div>
            ) : (
              <div className="cl-auth-btns">
                <NavLink to="/login" className="cl-btn-ghost">Đăng nhập</NavLink>
                <NavLink to="/register" className="cl-btn-filled">Đăng ký</NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <main className="cl-main">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="cl-footer">
        <div className="cl-footer-inner">
          <span>🚌 BusGo — Hệ thống đặt vé xe khách trực tuyến</span>
          <span style={{ color: 'var(--text-faint)' }}>© 2025 Bus Management</span>
        </div>
      </footer>
    </div>
  );
}
