import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading">Đang tải...</div></div>;
  if (!stats) return null;

  const total = stats.totalCompanies || 1;
  const approvedPct = Math.round((stats.approvedCompanies / total) * 100);
  const pendingPct  = Math.round((stats.pendingCompanies  / total) * 100);
  const rejectedPct = Math.round((stats.rejectedCompanies / total) * 100);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tổng quan hệ thống</h1>
      </div>

      {/* Stat cards — clickable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="🏢" label="Nhà xe"      value={stats.totalCompanies} color="#0984e3" to="/admin/companies" />
        <StatCard icon="🛣️" label="Tuyến đường" value={stats.totalRoutes}    color="#00b894" to="/admin/routes" />
        <StatCard icon="🚌" label="Xe"           value={stats.totalVehicles}  color="#6c5ce7" to="/admin/vehicles" />
        <StatCard icon="🧑‍✈️" label="Tài xế"    value={stats.totalDrivers}   color="#e17055" to="/admin/drivers" />
        <StatCard icon="👥" label="Người dùng"   value={stats.totalUsers}     color="#fd79a8" to="/admin/users" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Company status breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Trạng thái nhà xe</h3>
          <StatusBar label="Đã duyệt" count={stats.approvedCompanies} pct={approvedPct} color="#00b894" />
          <StatusBar label="Chờ duyệt" count={stats.pendingCompanies}  pct={pendingPct}  color="#fdcb6e" />
          <StatusBar label="Từ chối"   count={stats.rejectedCompanies} pct={rejectedPct} color="#d63031" />
          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <Link to="/admin/companies" className="btn btn-outline btn-sm">Xem tất cả →</Link>
          </div>
        </div>

        {/* Recent pending */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Nhà xe chờ duyệt gần đây</h3>
          {stats.recentPending?.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>Không có nhà xe chờ duyệt</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Tên nhà xe</th><th>Chủ sở hữu</th><th></th></tr>
              </thead>
              <tbody>
                {stats.recentPending.map((c) => (
                  <tr key={c.id}>
                    <td>{c.companyName}</td>
                    <td>{c.owner?.fullName ?? '-'}</td>
                    <td>
                      <Link to={`/admin/companies/${c.id}`} className="btn btn-outline btn-sm">Chi tiết</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Link to="/admin/companies?status=PENDING" className="btn btn-outline btn-sm">Xem tất cả →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, to }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        textAlign: 'center', padding: '24px 16px', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{label}</div>
        <div style={{ color: 'var(--primary)', fontSize: 12, marginTop: 8, fontWeight: 500 }}>Xem chi tiết →</div>
      </div>
    </Link>
  );
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
