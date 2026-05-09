import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/routes')
      .then((r) => setRoutes(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Danh sách tuyến đường</h1>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : routes.length === 0 ? (
        <div className="empty">Chưa có tuyến đường nào (Staff tạo tuyến)</div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>#</th><th>Tên tuyến</th><th>Xuất phát</th><th>Điểm đến</th><th>Khoảng cách</th><th>Thời gian</th><th>Giá vé</th></tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.origin}</td>
                <td>{r.destination}</td>
                <td>{r.distanceKm} km</td>
                <td>{r.estimatedDurationMin} phút</td>
                <td>{Number(r.basePrice).toLocaleString('vi-VN')} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
