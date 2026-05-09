import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function expiryStatus(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (days < 0)  return { label: 'Đã hết hạn', cls: 'badge-danger' };
  if (days < 60) return { label: `Còn ${days} ngày`, cls: 'badge-warning' };
  return null;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/drivers')
      .then(({ data }) => setDrivers(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    drivers.filter((d) =>
      d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search) ||
      d.licenseNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.busCompany?.companyName?.toLowerCase().includes(search.toLowerCase())
    ), [drivers, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Danh sách tài xế</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{filtered.length} tài xế</span>
      </div>

      <div className="toolbar">
        <div />
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, SĐT, bằng lái, nhà xe..." />
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : paginated.length === 0 ? (
        <div className="empty">Không tìm thấy tài xế nào</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Họ tên</th>
                <th>SĐT</th>
                <th>Số bằng lái</th>
                <th>Hạng</th>
                <th>Hết hạn</th>
                <th>Nhà xe</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((d) => {
                const exp = expiryStatus(d.licenseExpiry);
                return (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{d.id}</td>
                    <td style={{ fontWeight: 600 }}>{d.fullName}</td>
                    <td>{d.phone}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{d.licenseNumber}</td>
                    <td>
                      <span style={{
                        background: 'var(--primary-light)', color: 'var(--primary)',
                        padding: '2px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 700
                      }}>
                        {d.licenseClass}
                      </span>
                    </td>
                    <td>
                      <span>{formatDate(d.licenseExpiry)}</span>
                      {exp && <span className={`badge ${exp.cls}`} style={{ marginLeft: 6 }}>{exp.label}</span>}
                    </td>
                    <td>
                      <Link to={`/admin/companies/${d.busCompany?.id}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        {d.busCompany?.companyName}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
