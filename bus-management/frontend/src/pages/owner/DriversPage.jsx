import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', idCardNumber: '', licenseNumber: '', licenseClass: '', licenseExpiry: '' });
  const [error, setError] = useState('');
  const toast = useToast();

  const fetchDrivers = async () => {
    try {
      const r = await api.get('/owner/drivers');
      setDrivers(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách tài xế');
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/owner/drivers', form);
      setForm({ fullName: '', phone: '', idCardNumber: '', licenseNumber: '', licenseClass: '', licenseExpiry: '' });
      setShowForm(false);
      await fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa tài xế này?')) return;
    try {
      await api.delete(`/owner/drivers/${id}`);
      await fetchDrivers();
      toast.success('Xóa tài xế thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa tài xế thất bại');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý tài xế</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hủy' : '+ Thêm tài xế'}
        </button>
      </div>

      {showForm && (
        <div className="card mb">
          <h3>Thêm tài xế mới</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Họ tên</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>SĐT</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>CCCD</label>
              <input value={form.idCardNumber} onChange={(e) => setForm({ ...form, idCardNumber: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Số bằng lái</label>
              <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required />
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
              <button type="submit" className="btn btn-primary">Lưu</button>
            </div>
          </form>
        </div>
      )}

      {drivers.length === 0 ? (
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
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
