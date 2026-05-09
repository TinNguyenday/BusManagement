import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ licensePlate: '', model: '', seatCount: '', vehicleType: '' });
  const [error, setError] = useState('');
  const toast = useToast();

  const fetchVehicles = async () => {
    try {
      const r = await api.get('/owner/vehicles');
      setVehicles(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách xe');
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/owner/vehicles', { ...form, seatCount: parseInt(form.seatCount) });
      setForm({ licensePlate: '', model: '', seatCount: '', vehicleType: '' });
      setShowForm(false);
      await fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa xe này?')) return;
    try {
      await api.delete(`/owner/vehicles/${id}`);
      await fetchVehicles();
      toast.success('Xóa xe thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa xe thất bại');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý xe</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hủy' : '+ Thêm xe'}
        </button>
      </div>

      {showForm && (
        <div className="card mb">
          <h3>Thêm xe mới</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Biển số xe</label>
              <input value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} placeholder="VD: 51A-12345" required />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="VD: Thaco Trường Hải" required />
            </div>
            <div className="form-group">
              <label>Số ghế</label>
              <input type="number" value={form.seatCount} onChange={(e) => setForm({ ...form, seatCount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Loại xe</label>
              <input value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} placeholder="VD: Giường nằm, Limousine..." />
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary">Lưu</button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="empty">Chưa có xe nào</div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>#</th><th>Biển số</th><th>Model</th><th>Loại xe</th><th>Số ghế</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.licensePlate}</td>
                <td>{v.model}</td>
                <td>{v.vehicleType || '-'}</td>
                <td>{v.seatCount}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
