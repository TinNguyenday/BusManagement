import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

export default function AdminStaffPage() {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', phone: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/staff');
      setStaff(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => setPage(1), [search]);

  const filtered = useMemo(() => staff.filter(s => {
    const q = search.toLowerCase();
    return !search || s.fullName?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  }), [staff, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/staff', form);
      setForm({ username: '', email: '', password: '', fullName: '', phone: '' });
      setShowForm(false);
      toast.success('Tạo tài khoản nhân viên thành công');
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo thất bại');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa tài khoản "${name}"?`)) return;
    try {
      await api.delete(`/admin/staff/${id}`);
      toast.warning('Đã xóa tài khoản nhân viên');
      fetchStaff();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý nhân viên</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, username, email..." />
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Hủy' : '+ Thêm nhân viên'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb">
          <h3>Tạo tài khoản nhân viên mới</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Họ tên</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="VD: Nguyễn Văn A" required />
            </div>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="VD: staff_nguyenvana" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="VD: nguyenvana@busgo.vn" required />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" required />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="VD: 0901234567" />
            </div>
            <div className="form-group form-actions">
              <button type="submit" className="btn btn-primary">Tạo tài khoản</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : staff.length === 0 ? (
        <div className="empty">Chưa có nhân viên nào</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Không tìm thấy nhân viên phù hợp</div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>#</th><th>Họ tên</th><th>Tên đăng nhập</th><th>Email</th><th>SĐT</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {paginated.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.fullName}</td>
                <td>{s.username}</td>
                <td>{s.email}</td>
                <td>{s.phone || '-'}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.fullName)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  );
}
