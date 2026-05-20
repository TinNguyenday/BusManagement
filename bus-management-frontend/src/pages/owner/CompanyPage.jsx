import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
const STATUS_COLOR = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };
const STATUS_BG    = { PENDING: '#fef3c7', APPROVED: '#d1fae5', REJECTED: '#fee2e2' };

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function CompanyPage() {
  const { showToast } = useToast();
  const [company, setCompany] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/owner/my-company').then((r) => setCompany(r.data));
  }, []);

  const openEdit = () => {
    setForm({ phone: company.phone, address: company.address, bankName: company.bankName, bankAccountNumber: company.bankAccountNumber });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.put('/owner/my-company', form);
      setCompany(data);
      setEditing(false);
      showToast('Cập nhật thông tin thành công', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) return <div className="page"><div className="loading">Đang tải...</div></div>;

  const initials = company.companyName.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
  const hue = [...company.companyName].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Thông tin công ty</h1>
        {company.status === 'APPROVED' && !editing && (
          <button className="btn btn-outline btn-sm" onClick={openEdit}>✏ Chỉnh sửa</button>
        )}
      </div>

      {/* Header card */}
      <div style={{
        background: `linear-gradient(135deg, hsl(${hue},60%,45%), hsl(${hue + 40},70%,50%))`,
        borderRadius: 20, padding: '32px 28px', marginBottom: 20, color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
          <div style={{ width: 68, height: 68, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, letterSpacing: 1, flexShrink: 0, backdropFilter: 'blur(4px)' }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{company.companyName}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: STATUS_BG[company.status], color: STATUS_COLOR[company.status], padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {company.status === 'APPROVED' ? '✓ ' : ''}{STATUS_LABEL[company.status]}
              </span>
              {company.registeredAt && (
                <span style={{ fontSize: 13, opacity: 0.85 }}>Đăng ký {new Date(company.registeredAt).toLocaleDateString('vi-VN')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {company.status === 'PENDING' && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#c2410c', fontSize: 14 }}>Đang chờ phê duyệt</div>
            <div style={{ fontSize: 13, color: '#9a3412', marginTop: 2 }}>Admin đang xem xét hồ sơ của bạn. Quá trình thường mất 1–2 ngày làm việc.</div>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700 }}>Chỉnh sửa thông tin</h3>
          <form onSubmit={handleSave} className="form-grid">
            <div className="form-group">
              <label>Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Địa chỉ</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Ngân hàng</label>
              <input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Số tài khoản</label>
              <input value={form.bankAccountNumber} onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })} required />
            </div>
            <div className="form-group form-actions" style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info grid */}
      <div style={{ background: 'var(--bg2)', borderRadius: 16, padding: '4px 20px', border: '1px solid var(--border)' }}>
        <InfoRow icon="📍" label="Địa chỉ" value={company.address} />
        <InfoRow icon="📞" label="Số điện thoại" value={company.phone} />
        <InfoRow icon="🪪" label="CCCD / CMND" value={company.idCardNumber} />
        <InfoRow icon="🏦" label="Ngân hàng" value={company.bankName} />
        <InfoRow icon="💳" label="Số tài khoản" value={company.bankAccountNumber} />
        <div style={{ padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>📅</div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>Ngày đăng ký</div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                {company.registeredAt ? new Date(company.registeredAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
