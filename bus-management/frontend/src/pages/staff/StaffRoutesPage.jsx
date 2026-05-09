import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 8;

export default function StaffRoutesPage() {
  const toast = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', origin: '', destination: '', distanceKm: '', estimatedDurationMin: '', basePrice: '' });
  const [error, setError] = useState('');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/routes');
      setRoutes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const filtered = useMemo(() =>
    routes.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase())
    ), [routes, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', origin: '', destination: '', distanceKm: '', estimatedDurationMin: '', basePrice: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditing(r.id);
    setForm({ name: r.name, origin: r.origin, destination: r.destination, distanceKm: r.distanceKm, estimatedDurationMin: r.estimatedDurationMin, basePrice: r.basePrice });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, distanceKm: parseInt(form.distanceKm), estimatedDurationMin: parseInt(form.estimatedDurationMin), basePrice: parseFloat(form.basePrice) };
    try {
      if (editing) {
        await api.put(`/routes/${editing}`, payload);
        toast.success('Đã cập nhật tuyến đường');
      } else {
        await api.post('/routes', payload);
        toast.success('Đã thêm tuyến đường mới');
      }
      setShowForm(false);
      fetchRoutes();
    } catch (err) {
      setError(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tuyến đường này?')) return;
    try {
      await api.delete(`/routes/${id}`);
      toast.warning('Đã xóa tuyến đường');
      fetchRoutes();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý tuyến đường</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm tuyến</button>
      </div>

      {showForm && (
        <div className="card mb">
          <h3>{editing ? 'Chỉnh sửa tuyến' : 'Thêm tuyến mới'}</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group"><label>Tên tuyến</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Điểm xuất phát</label><input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} required /></div>
            <div className="form-group"><label>Điểm đến</label><input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></div>
            <div className="form-group"><label>Khoảng cách (km)</label><input type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} required /></div>
            <div className="form-group"><label>Thời gian ước tính (phút)</label><input type="number" value={form.estimatedDurationMin} onChange={(e) => setForm({ ...form, estimatedDurationMin: e.target.value })} required /></div>
            <div className="form-group"><label>Giá vé cơ bản (VNĐ)</label><input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} required /></div>
            <div className="form-group form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <span style={{ color: '#636e72', fontSize: 14 }}>{filtered.length} tuyến đường</span>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, điểm đi, điểm đến..." />
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : paginated.length === 0 ? (
        <div className="empty">Không tìm thấy tuyến đường nào</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr><th>#</th><th>Tên tuyến</th><th>Xuất phát</th><th>Điểm đến</th><th>Khoảng cách</th><th>Thời gian</th><th>Giá vé</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.origin}</td>
                  <td>{r.destination}</td>
                  <td>{r.distanceKm} km</td>
                  <td>{r.estimatedDurationMin} phút</td>
                  <td>{Number(r.basePrice).toLocaleString('vi-VN')} đ</td>
                  <td className="actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>Sửa</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
