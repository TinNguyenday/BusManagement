import { useEffect, useState } from 'react';
import api from '../../api/axios';

const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
const STATUS_CLASS = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' };

export default function CompanyPage() {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    api.get('/owner/my-company').then((r) => setCompany(r.data));
  }, []);

  if (!company) return <div className="loading">Đang tải...</div>;

  return (
    <div className="page">
      <h1>Thông tin công ty</h1>
      <div className="card">
        <div className="card-header">
          <h2>{company.companyName}</h2>
          <span className={`badge ${STATUS_CLASS[company.status]}`}>{STATUS_LABEL[company.status]}</span>
        </div>
        {company.status === 'PENDING' && (
          <div className="alert alert-warning">Tài khoản của bạn đang chờ admin phê duyệt.</div>
        )}
        <div className="info-grid">
          <div><label>Địa chỉ</label><span>{company.address}</span></div>
          <div><label>SĐT</label><span>{company.phone}</span></div>
          <div><label>CCCD</label><span>{company.idCardNumber}</span></div>
          <div><label>Ngân hàng</label><span>{company.bankName}</span></div>
          <div><label>Số tài khoản</label><span>{company.bankAccountNumber}</span></div>
          <div><label>Ngày đăng ký</label><span>{new Date(company.registeredAt).toLocaleDateString('vi-VN')}</span></div>
        </div>
      </div>
    </div>
  );
}
