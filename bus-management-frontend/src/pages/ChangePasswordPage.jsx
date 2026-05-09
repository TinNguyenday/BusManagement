import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      const back = user?.role === 'ADMIN' ? '/admin/companies'
        : user?.role === 'STAFF' ? '/staff/routes'
        : '/owner/company';
      navigate(back);
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="page">
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <button className="btn btn-outline mb" onClick={handleBack}>← Quay lại</button>
        <div className="card">
          <h2 style={{ marginBottom: 20 }}>Đổi mật khẩu</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Tài khoản: <strong style={{ color: 'var(--text)' }}>{user?.username}</strong>
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" value={form.currentPassword} onChange={set('currentPassword')} placeholder="Nhập mật khẩu hiện tại" required />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" value={form.newPassword} onChange={set('newPassword')} placeholder="Tối thiểu 6 ký tự" required />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Nhập lại mật khẩu mới" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
