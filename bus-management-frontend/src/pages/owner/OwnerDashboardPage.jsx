import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUS_LABEL = { SCHEDULED: 'Đã lên lịch', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
const STATUS_COLOR = { SCHEDULED: '#f59e0b', COMPLETED: '#10b981', CANCELLED: '#ef4444' };
const STATUS_BG    = { SCHEDULED: '#fef3c7', COMPLETED: '#d1fae5', CANCELLED: '#fee2e2' };

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' · ' +
         d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/stats').then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading">Đang tải...</div></div>;
  if (!stats) return null;

  const total = stats.totalAssignments || 1;
  const pctComplete = Math.round((stats.completed / total) * 100);

  const kpis = [
    { label: 'Xe đang hoạt động', value: stats.totalVehicles, icon: '🚌', color: '#6366f1', bg: '#eef2ff', to: '/owner/vehicles' },
    { label: 'Tài xế', value: stats.totalDrivers, icon: '👤', color: '#0ea5e9', bg: '#e0f2fe', to: '/owner/drivers' },
    { label: 'Tổng chuyến', value: stats.totalAssignments, icon: '📋', color: '#8b5cf6', bg: '#f5f3ff', to: '/owner/assignments' },
    { label: 'Hoàn thành', value: stats.completed, icon: '✅', color: '#10b981', bg: '#d1fae5' },
    { label: 'Sắp chạy', value: stats.scheduled, icon: '⏳', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Đã hủy', value: stats.cancelled, icon: '❌', color: '#ef4444', bg: '#fee2e2' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Tổng quan nhà xe</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        {kpis.map((k) => {
          const card = (
            <div style={{
              background: 'var(--bg2)', borderRadius: 14, padding: '18px 16px',
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 8,
              transition: 'box-shadow 0.15s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {k.icon}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.3 }}>{k.label}</div>
            </div>
          );
          return k.to
            ? <Link key={k.label} to={k.to} style={{ textDecoration: 'none' }}>{card}</Link>
            : <div key={k.label}>{card}</div>;
        })}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 18, alignItems: 'start' }}>

        {/* Completion ring */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '24px 20px', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Tỷ lệ hoàn thành</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <Ring pct={pctComplete} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{pctComplete}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stats.completed}/{stats.totalAssignments} chuyến</div>
            </div>
          </div>
          {[
            { label: 'Hoàn thành', count: stats.completed, color: '#10b981' },
            { label: 'Sắp chạy',   count: stats.scheduled, color: '#f59e0b' },
            { label: 'Đã hủy',     count: stats.cancelled, color: '#ef4444' },
          ].map((s) => (
            <div key={s.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontWeight: 600, color: s.color }}>{s.count}</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((s.count / total) * 100)}%`, background: s.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent assignments */}
        <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '24px 20px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Chuyến gần đây</div>
            <Link to="/owner/assignments" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Xem tất cả →</Link>
          </div>
          {!stats.recentAssignments?.length ? (
            <div className="empty" style={{ padding: '20px 0' }}>Chưa có phân công nào</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentAssignments.map((a) => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: STATUS_BG[a.status], color: STATUS_COLOR[a.status],
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    {a.status === 'COMPLETED' ? '✅' : a.status === 'CANCELLED' ? '❌' : '🚌'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.route?.origin} → {a.route?.destination}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {a.vehicle?.licensePlate} · {a.driver?.fullName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(a.departureTime)}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, marginTop: 3, padding: '2px 8px',
                      borderRadius: 20, background: STATUS_BG[a.status], color: STATUS_COLOR[a.status],
                    }}>
                      {STATUS_LABEL[a.status]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/owner/assignments" className="btn btn-primary" style={{ fontWeight: 600 }}>+ Thêm phân công</Link>
        <Link to="/owner/vehicles" className="btn btn-outline">Quản lý xe</Link>
        <Link to="/owner/drivers" className="btn btn-outline">Quản lý tài xế</Link>
        <Link to="/owner/company" className="btn btn-outline">Thông tin công ty</Link>
      </div>
    </div>
  );
}

function Ring({ pct }) {
  const r = 28, stroke = 6, circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={70} height={70} viewBox="0 0 70 70">
      <circle cx={35} cy={35} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={35} cy={35} r={r} fill="none" stroke="#10b981" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 35 35)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}
