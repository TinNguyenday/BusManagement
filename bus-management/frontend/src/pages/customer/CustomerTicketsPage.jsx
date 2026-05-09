import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const STATUS_LABEL = { BOOKED: 'Đã đặt', CANCELLED: 'Đã hủy' };
const STATUS_CLASS = { BOOKED: 'badge-success', CANCELLED: 'badge-danger' };

export default function CustomerTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/customer/tickets');
      setTickets(res.data);
    } catch {
      toast.error('Không thể tải vé');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Hủy vé này?')) return;
    try {
      await api.put(`/customer/tickets/${id}/cancel`);
      toast.success('Hủy vé thành công');
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hủy vé thất bại');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Vé của tôi</h1>
      </div>

      {tickets.length === 0 ? (
        <div className="empty">Bạn chưa có vé nào</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Mã vé</th>
              <th>Tuyến</th>
              <th>Điểm đi</th>
              <th>Điểm đến</th>
              <th>Giờ khởi hành</th>
              <th>Ngày đặt</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.bookingCode}</strong></td>
                <td>{t.vehicleRoute?.route?.name}</td>
                <td>{t.vehicleRoute?.route?.origin}</td>
                <td>{t.vehicleRoute?.route?.destination}</td>
                <td>{new Date(t.vehicleRoute?.departureTime).toLocaleString('vi-VN')}</td>
                <td>{new Date(t.bookedAt).toLocaleString('vi-VN')}</td>
                <td>
                  <span className={`badge ${STATUS_CLASS[t.status] || 'badge-warning'}`}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                </td>
                <td>
                  {t.status === 'BOOKED' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}>
                      Hủy vé
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
