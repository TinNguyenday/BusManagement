import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import CustomerLayout from '../../components/CustomerLayout';

function formatDT(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function formatPrice(p) {
  if (p == null) return '—';
  return Number(p).toLocaleString('vi-VN') + '₫';
}

function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 26, color: star <= value ? '#f59e0b' : 'var(--border)',
            padding: '0 2px', transition: 'color 0.1s',
          }}
        >★</button>
      ))}
    </div>
  );
}

export default function CustomerTicketsPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [expandedQr, setExpandedQr] = useState(null);      // ticket id
  const [reviewModal, setReviewModal] = useState(null);    // { ticketId, existingReview }
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState({});              // ticketId → Review

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/customer/tickets');
      setTickets(data);
    } catch {
      showToast('Không thể tải danh sách vé', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy vé này?')) return;
    setCancelling(id);
    try {
      await api.put(`/customer/tickets/${id}/cancel`);
      showToast('Hủy vé thành công', 'success');
      fetchTickets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Hủy vé thất bại', 'error');
    } finally {
      setCancelling(null);
    }
  };

  const openReviewModal = (ticket) => {
    setRating(5);
    setComment('');
    setReviewModal({ ticketId: ticket.id });
  };

  const handleSubmitReview = async () => {
    if (!rating) return;
    setSubmittingReview(true);
    try {
      await api.post('/customer/reviews', {
        ticketId: reviewModal.ticketId,
        rating,
        comment: comment.trim() || null,
      });
      showToast('Đánh giá thành công! Cảm ơn bạn.', 'success');
      setReviews(prev => ({ ...prev, [reviewModal.ticketId]: { rating, comment } }));
      setReviewModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gửi đánh giá thất bại', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <CustomerLayout>
      {/* REVIEW MODAL */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
            padding: 32, maxWidth: 420, width: '100%', boxShadow: 'var(--shadow-lg)',
            animation: 'scaleIn 0.2s cubic-bezier(0.34,1.4,0.64,1)',
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>
              Đánh giá chuyến đi
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Chia sẻ trải nghiệm của bạn để giúp hành khách khác
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Chất lượng chuyến đi</div>
              <StarPicker value={rating} onChange={setRating} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][rating]}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Nhận xét (tùy chọn)</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text)',
                  fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setReviewModal(null)}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmitReview}
                disabled={submittingReview || !rating}
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cl-page">
        <h2 className="cl-page-title">Vé của tôi</h2>

        {loading ? (
          <div className="loading" />
        ) : tickets.length === 0 ? (
          <div className="empty">
            Bạn chưa đặt vé nào.<br />
            <Link to="/customer/search" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
              Tìm chuyến xe ngay →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map((t, i) => {
              const booked = t.status === 'BOOKED';
              const completed = t.vehicleRoute?.status === 'COMPLETED';
              const alreadyReviewed = reviews[t.id] !== undefined;
              const showQr = expandedQr === t.id;

              return (
                <div key={t.id} className="cl-my-ticket" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`cl-ticket-stripe ${booked ? 'cl-ticket-stripe-booked' : 'cl-ticket-stripe-cancelled'}`} />
                  <div className="cl-my-ticket-body">
                    {/* Mã vé + ghế */}
                    <div style={{ minWidth: 110 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Mã vé</div>
                      <div className="cl-booking-code">{t.bookingCode}</div>
                      {t.seatNumber && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          Ghế số <strong style={{ color: 'var(--primary)' }}>{t.seatNumber}</strong>
                        </div>
                      )}
                    </div>

                    {/* Hành trình */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                        {t.vehicleRoute?.route?.origin} → {t.vehicleRoute?.route?.destination}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                        {t.vehicleRoute?.route?.name}
                      </div>
                    </div>

                    {/* Chi tiết */}
                    <div className="cl-trip-meta">
                      <div className="cl-meta-item">
                        <span className="cl-meta-label">Khởi hành</span>
                        <span className="cl-meta-value">{formatDT(t.vehicleRoute?.departureTime)}</span>
                      </div>
                      <div className="cl-meta-item">
                        <span className="cl-meta-label">Xe</span>
                        <span className="cl-meta-value">{t.vehicleRoute?.vehicle?.licensePlate}</span>
                      </div>
                      <div className="cl-meta-item">
                        <span className="cl-meta-label">Giá vé</span>
                        <span className="cl-meta-value" style={{ color: '#f97316', fontWeight: 700 }}>
                          {formatPrice(t.vehicleRoute?.route?.basePrice)}
                        </span>
                      </div>
                      <div className="cl-meta-item">
                        <span className="cl-meta-label">Đặt lúc</span>
                        <span className="cl-meta-value" style={{ fontWeight: 400, fontSize: 13 }}>{formatDT(t.bookedAt)}</span>
                      </div>
                    </div>

                    {/* Trạng thái + hành động */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 120 }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                        background: booked ? 'var(--success-light)' : completed ? 'var(--bg3)' : 'var(--bg3)',
                        color: booked ? 'var(--success)' : 'var(--text-faint)',
                        border: `1px solid ${booked ? 'var(--success)' : 'var(--border)'}`,
                      }}>
                        {booked ? '✓ Đã đặt' : completed ? '✓ Hoàn thành' : '✕ Đã hủy'}
                      </span>

                      {/* QR toggle */}
                      {booked && (
                        <button
                          onClick={() => setExpandedQr(showQr ? null : t.id)}
                          style={{
                            background: 'transparent', border: '1px solid var(--primary)',
                            color: 'var(--primary)', padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {showQr ? 'Ẩn QR' : '📱 Xem QR'}
                        </button>
                      )}

                      {/* Rating button */}
                      {completed && !alreadyReviewed && (
                        <button
                          onClick={() => openReviewModal(t)}
                          style={{
                            background: '#fef3c7', border: '1px solid #f59e0b',
                            color: '#92400e', padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          ⭐ Đánh giá
                        </button>
                      )}
                      {completed && alreadyReviewed && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {'★'.repeat(reviews[t.id].rating)} Đã đánh giá
                        </span>
                      )}

                      {/* Cancel */}
                      {booked && (
                        <button
                          onClick={() => handleCancel(t.id)}
                          disabled={cancelling === t.id}
                          style={{
                            background: 'transparent', border: '1px solid var(--danger)',
                            color: 'var(--danger)', padding: '5px 14px', borderRadius: 'var(--radius-sm)',
                            fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {cancelling === t.id ? 'Đang hủy...' : 'Hủy vé'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Code expanded panel */}
                  {showQr && (
                    <div style={{
                      marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)',
                      display: 'flex', gap: 20, alignItems: 'center',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <QRCodeSVG
                          value={t.bookingCode}
                          size={140}
                          bgColor="white"
                          fgColor="#1e1b4b"
                          level="M"
                          style={{ borderRadius: 8, padding: 8, background: 'white', display: 'block' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
                          Xuất trình khi lên xe
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                          Nhân viên sẽ quét mã QR này<br />
                          để xác nhận vé của bạn.<br />
                          Mã vé: <strong style={{ color: 'var(--primary)' }}>{t.bookingCode}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
