import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 8;
const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
const STATUS_CLASS = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' };

export default function CompaniesPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/bus-companies', { params: filter ? { status: filter } : {} });
      setCompanies(data);
      setPage(1);
    } catch {
      toast.error('Không thể tải danh sách nhà xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, [filter]);

  const filtered = useMemo(() =>
    companies.filter((c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.owner?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    ), [companies, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const handleApprove = async (id) => {
    if (!window.confirm('Duyệt nhà xe này?')) return;
    try {
      await api.put(`/admin/bus-companies/${id}/approve`);
      toast.success('Đã duyệt nhà xe thành công');
      fetchCompanies();
    } catch {
      toast.error('Duyệt thất bại');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Từ chối nhà xe này?')) return;
    try {
      await api.put(`/admin/bus-companies/${id}/reject`);
      toast.warning('Đã từ chối nhà xe');
      fetchCompanies();
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa nhà xe "${name}"? Toàn bộ xe, tài xế và phân công sẽ bị xóa theo.`)) return;
    try {
      await api.delete(`/admin/bus-companies/${id}`);
      toast.success('Đã xóa nhà xe');
      fetchCompanies();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý nhà xe</h1>
      </div>

      <div className="toolbar">
        <div className="filter-bar" style={{ margin: 0 }}>
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s)}>
              {s === '' ? 'Tất cả' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên nhà xe, chủ sở hữu..." />
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : paginated.length === 0 ? (
        <div className="empty">Không tìm thấy nhà xe nào</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr><th>#</th><th>Tên nhà xe</th><th>Chủ sở hữu</th><th>SĐT</th><th>Trạng thái</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><Link to={`/admin/companies/${c.id}`}>{c.companyName}</Link></td>
                  <td>{c.owner?.fullName}</td>
                  <td>{c.phone}</td>
                  <td><span className={`badge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                  <td className="actions">
                    {c.status === 'PENDING' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(c.id)}>Duyệt</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(c.id)}>Từ chối</button>
                      </>
                    )}
                    <Link to={`/admin/companies/${c.id}`} className="btn btn-outline btn-sm">Chi tiết</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.companyName)}>Xóa</button>
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
