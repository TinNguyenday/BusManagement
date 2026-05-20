import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuth2CallbackPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const username = params.get('username');
    const email = params.get('email');
    const fullName = params.get('fullName');
    const role = params.get('role');
    const status = params.get('status');

    if (!token) {
      navigate('/login', { state: { message: 'Tài khoản của bạn đang chờ được duyệt.' } });
      return;
    }

    login({ token, userId: Number(userId), username, email, fullName, role, status });

    if (role === 'ADMIN') window.location.href = '/admin/companies';
    else if (role === 'STAFF') window.location.href = '/staff/routes';
    else if (role === 'OWNER') window.location.href = '/owner/dashboard';
    else window.location.href = '/customer/search';
  }, []);

  return (
    <div className="login-container">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
        <div className="loading">Đang xử lý đăng nhập Google...</div>
      </div>
    </div>
  );
}
