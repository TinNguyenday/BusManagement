import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function CustomerRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', fullName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.username.length < 3) return setError('Username tối thiểu 3 ký tự');
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError('Email không hợp lệ');
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    if (!form.fullName) return setError('Vui lòng nhập họ tên');

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const { data } = await api.post('/auth/register/customer', payload);
      login(data);
      navigate('/customer/schedules');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🚌 Bus Management</h1>
        <h2>Đăng ký mua vé</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Họ và tên</label>
            <input value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" required />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Tên đăng nhập</label>
            <input value={form.username} onChange={set('username')} placeholder="Tối thiểu 3 ký tự" required />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="example@email.com" required />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Số điện thoại</label>
            <input value={form.phone} onChange={set('phone')} placeholder="0912345678" />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Mật khẩu</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Tối thiểu 6 ký tự" required />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Xác nhận mật khẩu</label>
            <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Nhập lại mật khẩu" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#636e72' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#0984e3' }}>Đăng nhập</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: '#636e72' }}>
          Bạn là chủ nhà xe? <Link to="/register" style={{ color: '#0984e3' }}>Đăng ký nhà xe</Link>
        </p>
      </div>
    </div>
  );
}
