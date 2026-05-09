import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const STEPS = ['Tài khoản', 'Thông tin cá nhân', 'Thông tin công ty', 'Ngân hàng'];

const BANKS = [
  'Vietcombank', 'Vietinbank', 'BIDV', 'Agribank', 'Techcombank',
  'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank', 'HDBank', 'OCB',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    fullName: '', phone: '',
    companyName: '', address: '', idCardNumber: '',
    bankName: '', bankAccountNumber: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.post('/auth/register', payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 12 }}>Đăng ký thành công!</h2>
          <p style={{ color: '#636e72', marginBottom: 24, lineHeight: 1.6 }}>
            Tài khoản của bạn đã được tạo và đang <strong>chờ Admin phê duyệt</strong>.<br />
            Sau khi được duyệt, bạn mới có thể đăng nhập.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">Về trang đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <h1 style={{ marginBottom: 4 }}>🚌 Bus Management</h1>
        <h2 style={{ marginBottom: 24 }}>Đăng ký nhà xe</h2>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((label, i) => (
            <div key={i} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-dot">{i < step ? '✓' : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); next(); }}>
          {/* Bước 0: Tài khoản */}
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

          {/* Bước 1: Thông tin cá nhân */}
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

          {/* Bước 2: Thông tin công ty */}
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

          {/* Bước 3: Ngân hàng */}
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

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#636e72' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#0984e3' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
