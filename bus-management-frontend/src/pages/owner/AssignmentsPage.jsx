import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { exportToExcel } from '../../utils/exportExcel';

const STATUS_CLASS = { SCHEDULED: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-danger' };
const STATUS_LABEL = { SCHEDULED: 'Đã lên lịch', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };

export default function AssignmentsPage() {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', driverId: '', routeId: '', departureTime: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [a, v, d, r] = await Promise.all([
        api.get('/owner/assignments'),
        api.get('/owner/vehicles'),
        api.get('/owner/drivers'),
        api.get('/routes'),
      ]);
      setAssignments(a.data);
      setVehicles(v.data);
      setDrivers(d.data);
      setRoutes(r.data);
    } catch {
      showToast('Không thể tải dữ liệu phân công', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/owner/assignments', {
        vehicleId: parseInt(form.vehicleId),
        driverId: parseInt(form.driverId),
        routeId: parseInt(form.routeId),
        departureTime: form.departureTime,
      });
      setForm({ vehicleId: '', driverId: '', routeId: '', departureTime: '' });
      setShowForm(false);
      showToast('Tạo phân công thành công', 'success');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa phân công này?')) return;
    try {
      await api.delete(`/owner/assignments/${id}`);
      showToast('Đã xóa phân công', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xóa thất bại', 'error');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/owner/assignments/${id}/status`, null, { params: { status } });
      showToast(status === 'COMPLETED' ? 'Đã hoàn thành chuyến' : 'Đã hủy phân công', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Phân công xe - tài xế</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => exportToExcel(assignments, [
            { header: 'ID', key: 'id' },
            { header: 'Xe (Biển số)', format: (r) => r.vehicle?.licensePlate ?? '' },
            { header: 'Tài xế', format: (r) => r.driver?.fullName ?? '' },
            { header: 'Tuyến đường', format: (r) => r.route?.name ?? '' },
            { header: 'Giờ khởi hành', format: (r) => new Date(r.departureTime).toLocaleString('vi-VN') },
            { header: 'Trạng thái', format: (r) => STATUS_LABEL[r.status] ?? r.status },
          ], 'phan-cong')}>📥 Xuất Excel</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
            {showForm ? 'Hủy' : '+ Thêm phân công'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb">
          <h3>Phân công mới</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Xe</label>
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">-- Chọn xe --</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.licensePlate} - {v.model}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tài xế</label>
              <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} required>
                <option value="">-- Chọn tài xế --</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tuyến đường</label>
              <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} required>
                <option value="">-- Chọn tuyến --</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.origin} → {r.destination})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Giờ khởi hành</label>
              <input type="datetime-local" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} required />
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
      ) : assignments.length === 0 ? (
        <div className="empty">Chưa có phân công nào</div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>#</th><th>Xe</th><th>Tài xế</th><th>Tuyến</th><th>Giờ khởi hành</th><th>Trạng thái</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.vehicle?.licensePlate}</td>
                <td>{a.driver?.fullName}</td>
                <td>{a.route?.name}</td>
                <td>{new Date(a.departureTime).toLocaleString('vi-VN')}</td>
                <td><span className={`badge ${STATUS_CLASS[a.status] || 'badge-warning'}`}>{STATUS_LABEL[a.status] ?? a.status}</span></td>
                <td className="actions">
                  {a.status === 'SCHEDULED' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleStatus(a.id, 'COMPLETED')}>Hoàn thành</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleStatus(a.id, 'CANCELLED')}>Hủy</button>
                    </>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
