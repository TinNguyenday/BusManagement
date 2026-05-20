import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { exportToExcel } from '../../utils/exportExcel';

const STATUS_CLASS  = { SCHEDULED: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-danger' };
const STATUS_LABEL  = { SCHEDULED: 'Đã lên lịch', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
const STATUS_COLOR  = { SCHEDULED: '#f59e0b', COMPLETED: '#10b981', CANCELLED: '#ef4444' };
const STATUS_BG     = { SCHEDULED: '#fef3c7', COMPLETED: '#d1fae5', CANCELLED: '#fee2e2' };
const STATUS_ICON   = { SCHEDULED: '⏳', COMPLETED: '✅', CANCELLED: '❌' };

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function formatDuration(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}g ${m}p` : `${h}g`) : `${m}p`;
}
function calcArrival(departureTime, durationMin) {
  if (!departureTime || !durationMin) return null;
  return new Date(new Date(departureTime).getTime() + durationMin * 60000);
}

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
  const [filterStatus, setFilterStatus] = useState('');

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
      showToast('Không thể tải dữ liệu', 'error');
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

  const filtered = filterStatus ? assignments.filter(a => a.status === filterStatus) : assignments;
  const counts = { SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 };
  assignments.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0 }}>Phân công xe - tài xế</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{assignments.length} phân công</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => exportToExcel(assignments, [
            { header: 'Xe', format: (r) => r.vehicle?.licensePlate ?? '' },
            { header: 'Tài xế', format: (r) => r.driver?.fullName ?? '' },
            { header: 'Tuyến', format: (r) => r.route?.name ?? '' },
            { header: 'Giờ khởi hành', format: (r) => new Date(r.departureTime).toLocaleString('vi-VN') },
            { header: 'Thời gian dự kiến', format: (r) => r.route?.estimatedDurationMin ? formatDuration(r.route.estimatedDurationMin) : '—' },
            { header: 'Giờ đến dự kiến', format: (r) => { const arr = calcArrival(r.departureTime, r.route?.estimatedDurationMin); return arr ? arr.toLocaleString('vi-VN') : '—'; } },
            { header: 'Trạng thái', format: (r) => STATUS_LABEL[r.status] ?? r.status },
          ], 'phan-cong')}>📥 Excel</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
            {showForm ? 'Hủy' : '+ Phân công mới'}
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['', 'Tất cả', assignments.length], ['SCHEDULED', 'Đã lên lịch', counts.SCHEDULED], ['COMPLETED', 'Hoàn thành', counts.COMPLETED], ['CANCELLED', 'Đã hủy', counts.CANCELLED]].map(([val, label, count]) => (
          <button key={val}
            onClick={() => setFilterStatus(val)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
              borderColor: filterStatus === val ? 'var(--primary)' : 'var(--border)',
              background: filterStatus === val ? 'var(--primary)' : 'var(--bg2)',
              color: filterStatus === val ? '#fff' : 'var(--text)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label} <span style={{ opacity: 0.7 }}>({count})</span>
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '24px', marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Phân công mới</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Xe</label>
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">-- Chọn xe --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.licensePlate} · {v.vehicleType} · {v.seatCount} ghế</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tài xế</label>
              <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} required>
                <option value="">-- Chọn tài xế --</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName} · Hạng {d.licenseClass}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tuyến đường</label>
              <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} required>
                <option value="">-- Chọn tuyến --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.origin} → {r.destination} · {Number(r.basePrice).toLocaleString('vi-VN')}₫</option>
                ))}
              </select>
              {form.routeId && (() => {
                const r = routes.find(r => r.id === parseInt(form.routeId));
                if (!r) return null;
                return (
                  <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {r.distanceKm && <span>📍 {r.distanceKm} km</span>}
                    {r.estimatedDurationMin && <span>⏱ {formatDuration(r.estimatedDurationMin)}</span>}
                  </div>
                );
              })()}
            </div>
            <div className="form-group">
              <label>Giờ khởi hành</label>
              <input type="datetime-local" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} required />
              {form.departureTime && form.routeId && (() => {
                const r = routes.find(r => r.id === parseInt(form.routeId));
                const arrival = calcArrival(form.departureTime, r?.estimatedDurationMin);
                if (!arrival) return null;
                return (
                  <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    → Dự kiến đến: <strong style={{ color: 'var(--text)' }}>{formatTime(arrival)} · {formatDate(arrival)}</strong>
                  </div>
                );
              })()}
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Tạo phân công'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Không có phân công nào</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((a) => (
            <div key={a.id} style={{
              background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)',
              display: 'flex', gap: 0, overflow: 'hidden',
            }}>
              {/* Status stripe */}
              <div style={{ width: 4, flexShrink: 0, background: STATUS_COLOR[a.status] }} />

              {/* Content */}
              <div style={{ flex: 1, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: STATUS_BG[a.status], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {STATUS_ICON[a.status]}
                </div>

                {/* Route */}
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>
                    {a.route?.origin} → {a.route?.destination}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                    🚌 {a.vehicle?.licensePlate} · {a.vehicle?.vehicleType}
                  </div>
                </div>

                {/* Driver */}
                <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>👤 {a.driver?.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Hạng {a.driver?.licenseClass}</div>
                </div>

                {/* Time + Duration */}
                <div style={{ flex: '1 1 150px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{formatTime(a.departureTime)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(a.departureTime)}</div>
                  {a.route?.estimatedDurationMin && (() => {
                    const arrival = calcArrival(a.departureTime, a.route.estimatedDurationMin);
                    return (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: 'var(--bg3)', color: 'var(--text-muted)',
                        }}>
                          ⏱ {formatDuration(a.route.estimatedDurationMin)}
                        </span>
                        {arrival && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            → đến {formatTime(arrival)}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Status + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: STATUS_BG[a.status], color: STATUS_COLOR[a.status],
                  }}>{STATUS_LABEL[a.status]}</span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {a.status === 'SCHEDULED' && (
                      <>
                        <button className="btn btn-success btn-sm" style={{ fontSize: 11 }} onClick={() => handleStatus(a.id, 'COMPLETED')}>Hoàn thành</button>
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => handleStatus(a.id, 'CANCELLED')}>Hủy</button>
                      </>
                    )}
                    <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => handleDelete(a.id)}>Xóa</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
