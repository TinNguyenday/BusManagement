import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { exportToExcel } from '../../utils/exportExcel';

export default function DriversPage() {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', idCardNumber: '', licenseNumber: '', licenseClass: '', licenseExpiry: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý tài xế</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => exportToExcel(drivers, [
            { header: 'ID', key: 'id' },
            { header: 'Họ tên', key: 'fullName' },
            { header: 'SĐT', key: 'phone' },
            { header: 'CCCD', key: 'idCardNumber' },
            { header: 'Số bằng lái', key: 'licenseNumber' },
            { header: 'Hạng bằng', key: 'licenseClass' },
            { header: 'Hạn bằng', key: 'licenseExpiry' },
          ], 'danh-sach-tai-xe')}>📥 Xuất Excel</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
            {showForm ? 'Hủy' : '+ Thêm tài xế'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb">
          <h3>Thêm tài xế mới</h3>
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
              <input placeholder="VD: 012345678901" value={form.idCardNumber} onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })} required />
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
                {submitting ? 'Đang lưu...' : 'Lưu'}
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
        <table className="table">
          <thead>
            <tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Số bằng</th><th>Hạng</th><th>Hạn bằng</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.fullName}</td>
                <td>{d.phone}</td>
                <td>{d.licenseNumber}</td>
                <td>{d.licenseClass}</td>
                <td>{d.licenseExpiry || '-'}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id, d.fullName)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
