import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_LABEL = { SCHEDULED: 'Đã lên lịch', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
const STATUS_CLASS = { SCHEDULED: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-danger' };

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading">Đang tải...</div></div>;
  if (!stats) return null;

  const total = stats.totalAssignments || 1;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tổng quan nhà xe</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="🚌" label="Xe" value={stats.totalVehicles} color="#0984e3" to="/owner/vehicles" />
        <StatCard icon="👤" label="Tài xế" value={stats.totalDrivers} color="#00b894" to="/owner/drivers" />
        <StatCard icon="📋" label="Phân công" value={stats.totalAssignments} color="#6c5ce7" to="/owner/assignments" />
        <StatCard icon="✅" label="Hoàn thành" value={stats.completed} color="#00b894" />
        <StatCard icon="⏳" label="Đã lên lịch" value={stats.scheduled} color="#fdcb6e" />
        <StatCard icon="❌" label="Đã hủy" value={stats.cancelled} color="#d63031" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Trạng thái phân công</h3>
          <StatusBar label="Hoàn thành" count={stats.completed} pct={Math.round((stats.completed / total) * 100)} color="#00b894" />
          <StatusBar label="Đã lên lịch" count={stats.scheduled} pct={Math.round((stats.scheduled / total) * 100)} color="#fdcb6e" />
          <StatusBar label="Đã hủy" count={stats.cancelled} pct={Math.round((stats.cancelled / total) * 100)} color="#d63031" />
          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <Link to="/owner/assignments" className="btn btn-outline btn-sm">Xem tất cả →</Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Phân công gần đây</h3>
          {stats.recentAssignments?.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>Chưa có phân công nào</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Xe</th><th>Tài xế</th><th>Giờ khởi hành</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {stats.recentAssignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.vehicle?.licensePlate}</td>
                    <td>{a.driver?.fullName}</td>
                    <td style={{ fontSize: 12 }}>{new Date(a.departureTime).toLocaleString('vi-VN')}</td>
                    <td><span className={`badge ${STATUS_CLASS[a.status]}`}>{STATUS_LABEL[a.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, to }) {
  const content = (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px', cursor: to ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function StatusBar({ label, count, pct, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}
