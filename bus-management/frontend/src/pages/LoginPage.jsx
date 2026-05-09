import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      if (data.role === 'ADMIN') navigate('/admin/companies');
      else if (data.role === 'OWNER') navigate('/owner/company');
      else if (data.role === 'STAFF') navigate('/staff/routes');
      else if (data.role === 'CUSTOMER') navigate('/customer/schedules');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🚌 Bus Management</h1>
        <h2>Đăng nhập</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#636e72' }}>
          Muốn mua vé? <Link to="/register/customer" style={{ color: '#0984e3' }}>Đăng ký tài khoản</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: '#636e72' }}>
          Chủ nhà xe? <Link to="/register" style={{ color: '#0984e3' }}>Đăng ký nhà xe</Link>
        </p>
      </div>
    </div>
  );
}
