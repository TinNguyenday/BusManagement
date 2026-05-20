import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { exportToExcel } from '../../utils/exportExcel';

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function ExpiryBadge({ dateStr }) {
  const days = daysUntilExpiry(dateStr);
  if (days === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  if (days < 0) return <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Hết hạn</span>;
  if (days <= 30) return <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>⚠ {days} ngày</span>;
  if (days <= 90) return <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{days} ngày</span>;
  return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(dateStr).toLocaleDateString('vi-VN')}</span>;
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
  const hue = [...(name || '')].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},60%,55%)`, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 15, letterSpacing: 0.5,
    }}>{initials}</div>
  );
}

const LICENSE_CLASS_COLOR = { B2: '#0ea5e9', C: '#8b5cf6', D: '#f59e0b', E: '#10b981' };

export default function DriversPage() {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', idCardNumber: '', licenseNumber: '', licenseClass: '', licenseExpiry: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/owner/drivers');
      setDrivers(data);
    } catch {
      showToast('Không thể tải danh sách tài xế', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/owner/drivers', form);
      setForm({ fullName: '', phone: '', idCardNumber: '', licenseNumber: '', licenseClass: '', licenseExpiry: '' });
      setShowForm(false);
      showToast('Thêm tài xế thành công', 'success');
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (d) => {
    setEditingDriver(d);
    setEditForm({
      fullName: d.fullName, phone: d.phone, idCardNumber: d.idCardNumber,
      licenseNumber: d.licenseNumber, licenseClass: d.licenseClass,
      licenseExpiry: d.licenseExpiry || '',
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      await api.put(`/owner/drivers/${editingDriver.id}`, editForm);
      setEditingDriver(null);
      showToast('Cập nhật tài xế thành công', 'success');
      fetchDrivers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa tài xế "${name}"?`)) return;
    try {
      await api.delete(`/owner/drivers/${id}`);
      showToast('Đã xóa tài xế', 'success');
      fetchDrivers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xóa thất bại', 'error');
    }
  };

  const expiring = drivers.filter(d => { const days = daysUntilExpiry(d.licenseExpiry); return days !== null && days <= 30; });

  return (
    <div className="page">

      {/* Edit Modal */}
      {editingDriver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Sửa thông tin tài xế</h3>
            {editError && <div className="alert alert-error">{editError}</div>}
            <form onSubmit={handleSaveEdit} className="form-grid">
              <div className="form-group">
                <label>Họ tên</label>
                <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>SĐT</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>CCCD</label>
                <input value={editForm.idCardNumber} onChange={(e) => setEditForm({ ...editForm, idCardNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Số bằng lái</label>
                <input value={editForm.licenseNumber} onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Hạng bằng</label>
                <select value={editForm.licenseClass} onChange={(e) => setEditForm({ ...editForm, licenseClass: e.target.value })} required>
                  <option value="">-- Chọn hạng --</option>
                  <option>B2</option><option>C</option><option>D</option><option>E</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hạn bằng lái</label>
                <input type="date" value={editForm.licenseExpiry} onChange={(e) => setEditForm({ ...editForm, licenseExpiry: e.target.value })} />
              </div>
              <div className="form-group form-actions" style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingDriver(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 style={{ margin: 0 }}>Quản lý tài xế</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{drivers.length} tài xế · {expiring.length > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠ {expiring.length} bằng sắp hết hạn</span>}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => exportToExcel(drivers, [
            { header: 'Họ tên', key: 'fullName' },
            { header: 'SĐT', key: 'phone' },
            { header: 'Số bằng lái', key: 'licenseNumber' },
            { header: 'Hạng bằng', key: 'licenseClass' },
            { header: 'Hạn bằng', key: 'licenseExpiry' },
          ], 'danh-sach-tai-xe')}>📥 Excel</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
            {showForm ? 'Hủy' : '+ Thêm tài xế'}
          </button>
        </div>
      </div>

      {expiring.length > 0 && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12,
          padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#c2410c', fontSize: 14 }}>Cảnh báo bằng lái sắp hết hạn</div>
            <div style={{ fontSize: 13, color: '#9a3412' }}>
              {expiring.map(d => d.fullName).join(', ')} — cần gia hạn sớm
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '24px', marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Thêm tài xế mới</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Họ tên</label>
              <input placeholder="VD: Nguyễn Văn A" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>SĐT</label>
              <input placeholder="VD: 0901234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>CCCD</label>
              <input placeholder="12 chữ số" value={form.idCardNumber} onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Số bằng lái</label>
              <input placeholder="VD: 012345678901" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Hạng bằng</label>
              <select value={form.licenseClass} onChange={(e) => setForm({ ...form, licenseClass: e.target.value })} required>
                <option value="">-- Chọn hạng --</option>
                <option>B2</option><option>C</option><option>D</option><option>E</option>
              </select>
            </div>
            <div className="form-group">
              <label>Hạn bằng lái</label>
              <input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu tài xế'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : drivers.length === 0 ? (
        <div className="empty">Chưa có tài xế nào</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {drivers.map((d) => {
            const days = daysUntilExpiry(d.licenseExpiry);
            const isWarning = days !== null && days <= 30;
            return (
              <div key={d.id} style={{
                background: 'var(--bg2)', borderRadius: 14, padding: '18px 18px',
                border: `1px solid ${isWarning ? '#fed7aa' : 'var(--border)'}`,
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <Avatar name={d.fullName} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>{d.fullName}</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        onClick={() => openEdit(d)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, padding: '0 4px' }}
                        title="Sửa tài xế"
                      >✏</button>
                      <button
                        onClick={() => handleDelete(d.id, d.fullName)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '0 0 0 4px' }}
                        title="Xóa tài xế"
                      >×</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>📞 {d.phone}</div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {d.licenseClass && (
                      <span style={{
                        background: LICENSE_CLASS_COLOR[d.licenseClass] ?? '#6366f1',
                        color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      }}>Hạng {d.licenseClass}</span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{d.licenseNumber}</span>
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Hạn bằng:</span>
                    <ExpiryBadge dateStr={d.licenseExpiry} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
