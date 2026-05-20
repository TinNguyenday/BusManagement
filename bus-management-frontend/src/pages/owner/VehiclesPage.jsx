import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { exportToExcel } from '../../utils/exportExcel';

const VEHICLE_TYPE_CONFIG = {
  'Ghế ngồi':   { icon: '🚌', color: '#6366f1', bg: '#eef2ff', layout: '2+2 mỗi hàng' },
  'Giường nằm': { icon: '🛏', color: '#0ea5e9', bg: '#e0f2fe', layout: '2 tầng' },
  'Limousine':  { icon: '💺', color: '#8b5cf6', bg: '#f5f3ff', layout: '1+1 VIP' },
};

function getConfig(type) {
  return VEHICLE_TYPE_CONFIG[type] || { icon: '🚍', color: '#6b7280', bg: 'var(--bg3)', layout: '' };
}

function detectLayout(vehicleType) {
  const t = (vehicleType || '').toLowerCase();
  if (t.includes('giường') || t.includes('nằm') || t.includes('sleeper')) return 'sleeper';
  if (t.includes('limousine') || t.includes('vip')) return 'limousine';
  return 'regular';
}

// ── Mini seat dot ────────────────────────────────────────────────
function Dot({ color, size = 8, radius = 2 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: color, opacity: 0.85, flexShrink: 0,
    }} />
  );
}

// ── Mini seat map layouts ────────────────────────────────────────
function RegularMini({ total, color }) {
  const rows = Math.ceil(total / 4);
  const SEAT_SIZE = 8, GAP = 3, AISLE = 7;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, alignItems: 'center' }}>
      {/* Bus front */}
      <div style={{ fontSize: 12, marginBottom: 2 }}>🚌</div>
      {Array.from({ length: rows }, (_, ri) => {
        const base = ri * 4;
        const seats = [base, base + 1, base + 2, base + 3].filter(i => i < total);
        return (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: GAP }}>
            <div style={{ display: 'flex', gap: GAP }}>
              {seats.slice(0, 2).map(i => <Dot key={i} color={color} size={SEAT_SIZE} />)}
              {seats.length < 2 && seats.length > 0 && <div style={{ width: SEAT_SIZE }} />}
            </div>
            <div style={{ width: AISLE }} />
            <div style={{ display: 'flex', gap: GAP }}>
              {seats.slice(2, 4).map(i => <Dot key={i} color={color} size={SEAT_SIZE} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SleeperMini({ total, color }) {
  const half = Math.ceil(total / 2);
  const floor1 = Array.from({ length: half }, (_, i) => i);
  const floor2 = Array.from({ length: total - half }, (_, i) => i);
  const SEAT_W = 10, SEAT_H = 8, GAP = 3;

  const renderCol = (seats) => {
    const rows = [];
    for (let i = 0; i < seats.length; i += 2) rows.push([seats[i], seats[i + 1]].filter(x => x !== undefined));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: GAP }}>
            {row.map((_, j) => (
              <div key={j} style={{ width: SEAT_W, height: SEAT_H, borderRadius: 2, background: color, opacity: 0.85 }} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 12 }}>🚌</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Dưới</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 4 }}>
            {renderCol(floor1)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Trên</div>
          <div style={{ border: '1px dashed var(--border)', borderRadius: 4, padding: 4 }}>
            {renderCol(floor2)}
          </div>
        </div>
      </div>
    </div>
  );
}

function LimousineMini({ total, color }) {
  const rows = Math.ceil(total / 2);
  const SEAT_W = 14, SEAT_H = 10, GAP = 4, AISLE = 14;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, alignItems: 'center' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color, letterSpacing: 1,
        background: `${color}22`, padding: '2px 10px', borderRadius: 4, marginBottom: 2,
      }}>VIP</div>
      {Array.from({ length: rows }, (_, ri) => {
        const a = ri * 2, b = ri * 2 + 1;
        return (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: AISLE }}>
            <div style={{ width: SEAT_W, height: SEAT_H, borderRadius: 3, background: a < total ? color : 'transparent', opacity: 0.85 }} />
            <div style={{ width: SEAT_W, height: SEAT_H, borderRadius: 3, background: b < total ? color : 'transparent', opacity: 0.85 }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Seat map wrapper ─────────────────────────────────────────────
function MiniSeatMap({ seatCount, vehicleType, color }) {
  const layout = detectLayout(vehicleType);
  const MAX = 60;
  const displayCount = Math.min(seatCount, MAX);

  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      maxHeight: 260, overflowY: 'auto',
    }}>
      {layout === 'sleeper'   && <SleeperMini   total={displayCount} color={color} />}
      {layout === 'limousine' && <LimousineMini total={displayCount} color={color} />}
      {layout === 'regular'   && <RegularMini   total={displayCount} color={color} />}
      {seatCount > MAX && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          + {seatCount - MAX} ghế nữa
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ licensePlate: '', model: '', seatCount: '', vehicleType: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchVehicles = () => api.get('/owner/vehicles').then((r) => setVehicles(r.data));
  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/owner/vehicles', { ...form, seatCount: parseInt(form.seatCount) });
      setForm({ licensePlate: '', model: '', seatCount: '', vehicleType: '' });
      setShowForm(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa xe này?')) return;
    await api.delete(`/owner/vehicles/${id}`);
    fetchVehicles();
  };

  const openEdit = (v) => {
    setEditingVehicle(v);
    setEditForm({ licensePlate: v.licensePlate, model: v.model, seatCount: String(v.seatCount), vehicleType: v.vehicleType });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      await api.put(`/owner/vehicles/${editingVehicle.id}`, { ...editForm, seatCount: parseInt(editForm.seatCount) });
      setEditingVehicle(null);
      fetchVehicles();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="page">

      {/* Edit Modal */}
      {editingVehicle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Sửa thông tin xe</h3>
            {editError && <div className="alert alert-error">{editError}</div>}
            <form onSubmit={handleSaveEdit} className="form-grid">
              <div className="form-group">
                <label>Biển số xe</label>
                <input value={editForm.licensePlate} onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Model xe</label>
                <input value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Số ghế</label>
                <input type="number" min="1" max="100" value={editForm.seatCount} onChange={(e) => setEditForm({ ...editForm, seatCount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Loại xe</label>
                <select value={editForm.vehicleType} onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })} required>
                  <option value="">-- Chọn loại xe --</option>
                  <option value="Ghế ngồi">🚌 Ghế ngồi (2+2)</option>
                  <option value="Giường nằm">🛏 Giường nằm (2 tầng)</option>
                  <option value="Limousine">💺 Limousine (1+1)</option>
                </select>
              </div>
              <div className="form-group form-actions" style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingVehicle(null)}>Hủy</button>
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
          <h1 style={{ margin: 0 }}>Quản lý xe</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{vehicles.length} xe trong đội</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => exportToExcel(vehicles, [
            { header: 'Biển số', key: 'licensePlate' },
            { header: 'Model', key: 'model' },
            { header: 'Loại xe', key: 'vehicleType' },
            { header: 'Số ghế', key: 'seatCount' },
          ], 'danh-sach-xe')}>📥 Excel</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
            {showForm ? 'Hủy' : '+ Thêm xe'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '24px', marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Thêm xe mới</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Biển số xe</label>
              <input value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} placeholder="VD: 51A-12345" required />
            </div>
            <div className="form-group">
              <label>Model xe</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="VD: Thaco Trường Hải" required />
            </div>
            <div className="form-group">
              <label>Số ghế</label>
              <input type="number" min="1" max="100" value={form.seatCount} onChange={(e) => setForm({ ...form, seatCount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Loại xe</label>
              <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} required>
                <option value="">-- Chọn loại xe --</option>
                <option value="Ghế ngồi">🚌 Ghế ngồi (2+2)</option>
                <option value="Giường nằm">🛏 Giường nằm (2 tầng)</option>
                <option value="Limousine">💺 Limousine (1+1)</option>
              </select>
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Thêm xe'}
              </button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="empty">Chưa có xe nào trong đội</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {vehicles.map((v) => {
            const cfg = getConfig(v.vehicleType);
            return (
              <div key={v.id} style={{
                background: 'var(--bg2)', borderRadius: 16, overflow: 'hidden',
                border: '1px solid var(--border)',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                {/* Header */}
                <div style={{ background: cfg.bg, padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 30 }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: cfg.color }}>{v.licensePlate}</div>
                    <div style={{ fontSize: 12, color: cfg.color, opacity: 0.75, marginTop: 2 }}>{v.vehicleType} · {cfg.layout}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => openEdit(v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, opacity: 0.6, fontSize: 15, lineHeight: 1, padding: 4 }}
                      title="Sửa xe"
                    >✏</button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, opacity: 0.5, fontSize: 18, lineHeight: 1, padding: 4 }}
                      title="Xóa xe"
                    >×</button>
                  </div>
                </div>

                {/* Model & seat count */}
                <div style={{ padding: '12px 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>{v.model}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontWeight: 900, fontSize: 24, color: cfg.color }}>{v.seatCount}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ghế</span>
                  </div>
                </div>

                {/* Mini seat map */}
                <div style={{ padding: '0 18px 16px' }}>
                  <MiniSeatMap
                    seatCount={v.seatCount}
                    vehicleType={v.vehicleType}
                    color={cfg.color}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
