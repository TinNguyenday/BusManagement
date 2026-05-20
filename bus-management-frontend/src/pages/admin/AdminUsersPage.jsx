import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

const ROLE_LABEL  = { ADMIN: 'Admin', STAFF: 'Nhân viên', OWNER: 'Nhà xe', CUSTOMER: 'Khách hàng' };
const ROLE_CLASS  = { ADMIN: 'badge-danger', STAFF: 'badge-info', OWNER: 'badge-warning', CUSTOMER: 'badge-success' };
const STATUS_LABEL = { ACTIVE: 'Hoạt động', PENDING: 'Chờ duyệt', REJECTED: 'Từ chối' };
const STATUS_CLASS  = { ACTIVE: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = () => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeleteCustomer = async (id, username) => {
    if (!confirm(`Xóa tài khoản "${username}"? Toàn bộ vé và đánh giá của họ cũng bị xóa.`)) return;
    await api.delete(`/admin/customers/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDeleteOwner = async (id, username) => {
    if (!confirm(`Xóa tài khoản nhà xe "${username}"? Toàn bộ công ty, xe, tài xế và chuyến đi của họ cũng bị xóa.`)) return;
    await api.delete(`/admin/owners/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const filtered = useMemo(() =>
    users.filter((u) => {
      const matchRole = !roleFilter || u.role?.name === roleFilter;
      const q = search.toLowerCase();
      const matchSearch = !search ||
        u.username?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(search);
      return matchRole && matchSearch;
    }), [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, roleFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Danh sách người dùng</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{filtered.length} tài khoản</span>
      </div>

      <div className="toolbar">
        <div className="filter-bar">
          {['', 'ADMIN', 'STAFF', 'OWNER', 'CUSTOMER'].map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === '' ? 'Tất cả' : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, username, email..." />
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : paginated.length === 0 ? (
        <div className="empty">Không tìm thấy người dùng nào</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>{u.fullName || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${ROLE_CLASS[u.role?.name] ?? 'badge-info'}`}>
                      {ROLE_LABEL[u.role?.name] ?? u.role?.name}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[u.status] ?? 'badge-info'}`}>
                      {STATUS_LABEL[u.status] ?? u.status}
                    </span>
                  </td>
                  <td>
                    {u.role?.name === 'CUSTOMER' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCustomer(u.id, u.username)}
                      >
                        Xóa
                      </button>
                    )}
                    {u.role?.name === 'OWNER' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteOwner(u.id, u.username)}
                      >
                        Xóa
                      </button>
                    )}
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
