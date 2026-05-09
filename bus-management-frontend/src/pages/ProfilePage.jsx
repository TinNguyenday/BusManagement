import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      login({ ...user, fullName: data.fullName, phone: data.phone });
      toast.success('Cập nhật thông tin thành công');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Thông tin cá nhân</h1>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, flexShrink: 0
          }}>
            {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{user?.fullName}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.email}</div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-success' : user?.role === 'STAFF' ? 'badge-warning' : 'badge-info'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ color: 'var(--text-muted)', fontSize: 13 }}>Tên đăng nhập</label>
            <input value={user?.username || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ color: 'var(--text-muted)', fontSize: 13 }}>Email</label>
            <input value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 8 }}>
          <h3 style={{ marginBottom: 16 }}>Chỉnh sửa thông tin</h3>
          <div className="form-group">
            <label>Họ tên</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0xxxxxxxxx" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}
