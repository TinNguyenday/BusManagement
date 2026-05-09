import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function CustomerSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const toast = useToast();

  const search = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer/schedules', { params: { origin, destination } });
      setSchedules(res.data);
    } catch {
      toast.error('Không thể tải danh sách chuyến xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(); }, []);

  const handleBook = async (schedule) => {
    if (!confirm(`Đặt vé chuyến ${schedule.route?.name} lúc ${new Date(schedule.departureTime).toLocaleString('vi-VN')}?`)) return;
    try {
      await api.post('/customer/tickets', { vehicleRouteId: schedule.id });
      toast.success('Đặt vé thành công!');
      setBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt vé thất bại');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tìm chuyến xe</h1>
      </div>

      <div className="card mb">
        <div className="form-grid">
          <div className="form-group">
            <label>Điểm đi</label>
            <input
              type="text"
              placeholder="Ví dụ: Hà Nội"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
          <div className="form-group">
            <label>Điểm đến</label>
            <input
              type="text"
              placeholder="Ví dụ: Đà Nẵng"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
          <div className="form-group form-actions">
            <button className="btn btn-primary" onClick={search} disabled={loading}>
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : schedules.length === 0 ? (
        <div className="empty">Không có chuyến xe nào</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Tuyến</th>
              <th>Điểm đi</th>
              <th>Điểm đến</th>
              <th>Giờ khởi hành</th>
              <th>Xe</th>
              <th>Nhà xe</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td>{s.route?.name}</td>
                <td>{s.route?.origin}</td>
                <td>{s.route?.destination}</td>
                <td>{new Date(s.departureTime).toLocaleString('vi-VN')}</td>
                <td>{s.vehicle?.licensePlate} ({s.vehicle?.model})</td>
                <td>{s.vehicle?.busCompany?.name}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleBook(s)}>
                    Đặt vé
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
