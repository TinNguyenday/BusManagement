import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/vehicles')
      .then(({ data }) => setVehicles(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    vehicles.filter((v) =>
      v.licensePlate?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      v.busCompany?.companyName?.toLowerCase().includes(search.toLowerCase())
    ), [vehicles, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Danh sách xe</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{filtered.length} xe</span>
      </div>

      <div className="toolbar">
        <div />
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm biển số, hãng xe, nhà xe..." />
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : paginated.length === 0 ? (
        <div className="empty">Không tìm thấy xe nào</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Biển số</th>
                <th>Model</th>
                <th>Loại xe</th>
                <th>Số chỗ</th>
                <th>Nhà xe</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((v) => (
                <tr key={v.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{v.id}</td>
                  <td style={{ fontWeight: 600 }}>{v.licensePlate}</td>
                  <td>{v.model}</td>
                  <td>{v.vehicleType || '—'}</td>
                  <td>
                    <span style={{
                      background: 'var(--info-light)', color: 'var(--info)',
                      padding: '2px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 600
                    }}>
                      {v.seatCount} chỗ
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/companies/${v.busCompany?.id}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                      {v.busCompany?.companyName}
                    </Link>
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
