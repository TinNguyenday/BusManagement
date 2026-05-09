import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Tài khoản', 'Thông tin cá nhân', 'Thông tin công ty', 'Ngân hàng'];

const BANKS = [
  'Vietcombank', 'Vietinbank', 'BIDV', 'Agribank', 'Techcombank',
  'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank', 'HDBank', 'OCB',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState(''); // '' | 'customer' | 'owner'
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState(false);

  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    fullName: '', phone: '',
    companyName: '', address: '', idCardNumber: '',
    bankName: '', bankAccountNumber: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // ===== Customer registration =====
  const [cForm, setCForm] = useState({ username: '', email: '', password: '', confirmPassword: '', fullName: '', phone: '' });
  const setC = (field) => (e) => setCForm({ ...cForm, [field]: e.target.value });

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!cForm.username || cForm.username.length < 3) return setError('Username tối thiểu 3 ký tự');
    if (!cForm.email || !/\S+@\S+\.\S+/.test(cForm.email)) return setError('Email không hợp lệ');
    if (!cForm.password || cForm.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (cForm.password !== cForm.confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    if (!cForm.fullName) return setError('Vui lòng nhập họ tên');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = cForm;
      const { data } = await api.post('/auth/register/customer', payload);
      login(data);
      navigate('/customer/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ===== Owner registration =====
  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!form.username || form.username.length < 3) return setError('Username tối thiểu 3 ký tự') || false;
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return setError('Email không hợp lệ') || false;
      if (!form.password || form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự') || false;
      if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp') || false;
    }
    if (step === 1) {
      if (!form.fullName) return setError('Vui lòng nhập họ tên') || false;
      if (!/^[0-9]{10,11}$/.test(form.phone)) return setError('SĐT phải 10-11 số') || false;
    }
    if (step === 2) {
      if (!form.companyName) return setError('Vui lòng nhập tên công ty') || false;
      if (!form.address) return setError('Vui lòng nhập địa chỉ') || false;
      if (!/^[0-9]{9,12}$/.test(form.idCardNumber)) return setError('CCCD/CMND phải 9-12 số') || false;
    }
    if (step === 3) {
      if (!form.bankName) return setError('Vui lòng chọn ngân hàng') || false;
      if (!form.bankAccountNumber) return setError('Vui lòng nhập số tài khoản') || false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => { setError(''); setStep((s) => s - 1); };

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.post('/auth/register', payload);
      setOwnerSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ===== Mode selector =====
  if (!mode) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <h1 style={{ marginBottom: 4 }}>🚌 Bus Management</h1>
          <h2 style={{ marginBottom: 8 }}>Đăng ký tài khoản</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 28 }}>
            Bạn muốn đăng ký với tư cách nào?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => setMode('customer')}
              style={{ padding: '14px 20px' }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Khách hàng</div>
              <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>Tìm kiếm và đặt vé xe khách</div>
            </button>
            <button
              className="btn btn-outline btn-full"
              onClick={() => setMode('owner')}
              style={{ padding: '14px 20px' }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Nhà xe</div>
              <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 400 }}>Quản lý xe, tài xế và chuyến đi</div>
            </button>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    );
  }

  // ===== Customer form =====
  if (mode === 'customer') {
    return (
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: 440 }}>
          <button
            onClick={() => { setMode(''); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 12, padding: 0 }}
          >
            ← Quay lại
          </button>
          <h1 style={{ marginBottom: 4 }}>🚌 Bus Management</h1>
          <h2 style={{ marginBottom: 24 }}>Đăng ký khách hàng</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input value={cForm.username} onChange={setC('username')} placeholder="Tối thiểu 3 ký tự" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={cForm.email} onChange={setC('email')} placeholder="example@email.com" />
            </div>
            <div className="form-group">
              <label>Họ và tên</label>
              <input value={cForm.fullName} onChange={setC('fullName')} placeholder="Nguyễn Văn A" />
            </div>
            <div className="form-group">
              <label>Số điện thoại <span style={{ color: 'var(--text-muted)' }}>(tùy chọn)</span></label>
              <input value={cForm.phone} onChange={setC('phone')} placeholder="0912345678" />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input type="password" value={cForm.password} onChange={setC('password')} placeholder="Tối thiểu 6 ký tự" />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input type="password" value={cForm.confirmPassword} onChange={setC('confirmPassword')} placeholder="Nhập lại mật khẩu" />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    );
  }

  // ===== Owner success =====
  if (ownerSuccess) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Đăng ký thành công!</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14, marginBottom: 24 }}>
            Hồ sơ nhà xe của bạn đã được gửi đi.
          </p>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 28, textAlign: 'left' }}>
            {[
              { icon: '1️⃣', text: 'Admin xem xét và phê duyệt hồ sơ nhà xe' },
              { icon: '2️⃣', text: 'Bạn nhận thông báo qua email khi được duyệt' },
              { icon: '3️⃣', text: 'Đăng nhập và bắt đầu quản lý nhà xe' },
            ].map(({ icon, text }) => (
              <div key={icon} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, fontSize: 13.5, color: 'var(--text-muted)' }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
          <Link to="/login" className="btn btn-primary btn-full">Về trang đăng nhập</Link>
        </div>
      </div>
    );
  }

  // ===== Owner multi-step form =====
  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <button
          onClick={() => { setMode(''); setError(''); setStep(0); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 12, padding: 0 }}
        >
          ← Quay lại
        </button>
        <h1 style={{ marginBottom: 4 }}>🚌 Bus Management</h1>
        <h2 style={{ marginBottom: 24 }}>Đăng ký nhà xe</h2>

        <div className="stepper">
          {STEPS.map((label, i) => (
            <div key={i} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-dot">{i < step ? '✓' : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={step === 3 ? handleOwnerSubmit : (e) => { e.preventDefault(); next(); }}>
          {step === 0 && (
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input value={form.username} onChange={set('username')} placeholder="Tối thiểu 3 ký tự" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="example@email.com" />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Nhập lại mật khẩu" />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label>Họ và tên</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input value={form.phone} onChange={set('phone')} placeholder="0912345678" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label>Tên công ty</label>
                <input value={form.companyName} onChange={set('companyName')} placeholder="Công ty TNHH Vận tải ABC" />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input value={form.address} onChange={set('address')} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
              </div>
              <div className="form-group">
                <label>Số CCCD / CMND</label>
                <input value={form.idCardNumber} onChange={set('idCardNumber')} placeholder="012345678901" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label>Ngân hàng</label>
                <select value={form.bankName} onChange={set('bankName')}>
                  <option value="">-- Chọn ngân hàng --</option>
                  {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Số tài khoản</label>
                <input value={form.bankAccountNumber} onChange={set('bankAccountNumber')} placeholder="Số tài khoản ngân hàng" />
              </div>
            </div>
          )}

          <div className="step-actions">
            {step > 0 && (
              <button type="button" className="btn btn-outline" onClick={back}>← Quay lại</button>
            )}
            {step < 3 ? (
              <button type="submit" className="btn btn-primary">Tiếp theo →</button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Đang gửi...' : 'Hoàn tất đăng ký'}
              </button>
            )}
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
