import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
const STATUS_CLASS = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' };

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/admin/bus-companies/${id}/overview`).then((r) => setData(r.data));
  }, [id]);

  const handleApprove = async () => {
    if (!confirm('Duyệt nhà xe này?')) return;
    await api.put(`/admin/bus-companies/${id}/approve`);
    navigate('/admin/companies');
  };

  const handleReject = async () => {
    if (!confirm('Từ chối nhà xe này?')) return;
    await api.put(`/admin/bus-companies/${id}/reject`);
    toast.warning('Đã từ chối nhà xe');
    navigate('/admin/companies');
  };

  const handleDelete = async () => {
    if (!confirm(`Xóa nhà xe "${data?.company?.companyName}"? Toàn bộ xe, tài xế và phân công sẽ bị xóa theo.`)) return;
    try {
      await api.delete(`/admin/bus-companies/${id}`);
      toast.success('Đã xóa nhà xe');
      navigate('/admin/companies');
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  if (!data) return <div className="loading">Đang tải...</div>;

  const { company, vehicles, drivers } = data;

  return (
    <div className="page">
      <button className="btn btn-outline mb" onClick={() => navigate('/admin/companies')}>← Quay lại</button>

      <div className="card">
        <div className="card-header">
          <h2>{company.companyName}</h2>
          <span className={`badge ${STATUS_CLASS[company.status]}`}>{STATUS_LABEL[company.status]}</span>
        </div>
        <div className="info-grid">
          <div><label>Chủ sở hữu</label><span>{company.owner?.fullName}</span></div>
          <div><label>Email</label><span>{company.owner?.email}</span></div>
          <div><label>SĐT</label><span>{company.phone}</span></div>
          <div><label>Địa chỉ</label><span>{company.address}</span></div>
          <div><label>CCCD</label><span>{company.idCardNumber}</span></div>
          <div><label>Ngân hàng</label><span>{company.bankName} - {company.bankAccountNumber}</span></div>
        </div>
        <div className="card-actions">
          {company.status === 'PENDING' && (
            <>
              <button className="btn btn-success" onClick={handleApprove}>Duyệt nhà xe</button>
              <button className="btn btn-danger" onClick={handleReject}>Từ chối</button>
            </>
          )}
          <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={handleDelete}>Xóa nhà xe</button>
        </div>
      </div>

      <div className="card mt">
        <h3>Xe ({vehicles.length})</h3>
        {vehicles.length === 0 ? <p className="empty">Chưa có xe</p> : (
          <table className="table">
            <thead><tr><th>Biển số</th><th>Model</th><th>Loại xe</th><th>Số ghế</th></tr></thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.licensePlate}</td>
                  <td>{v.model}</td>
                  <td>{v.vehicleType || '-'}</td>
                  <td>{v.seatCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card mt">
        <h3>Tài xế ({drivers.length})</h3>
        {drivers.length === 0 ? <p className="empty">Chưa có tài xế</p> : (
          <table className="table">
            <thead><tr><th>Họ tên</th><th>SĐT</th><th>Bằng lái</th><th>Hạng</th></tr></thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.fullName}</td>
                  <td>{d.phone}</td>
                  <td>{d.licenseNumber}</td>
                  <td>{d.licenseClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
