import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CustomerLayout from '../../components/CustomerLayout';
import SeatMapModal from '../../components/SeatMapModal';

function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function formatDuration(min) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}g${m > 0 ? m + 'p' : ''}` : `${m}p`;
}

function formatPrice(p) {
  if (p == null) return '—';
  return Number(p).toLocaleString('vi-VN') + '₫';
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function calcArrival(departureTime, durationMin) {
  if (!departureTime || !durationMin) return '';
  const arr = new Date(new Date(departureTime).getTime() + durationMin * 60000);
  return arr.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function StarRating({ value }) {
  if (!value) return <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Chưa có đánh giá</span>;
  return (
    <span style={{ fontSize: 12.5, color: '#f59e0b', fontWeight: 600 }}>
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
      <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>{value.toFixed(1)}</span>
    </span>
  );
}

const VEHICLE_TYPES = ['Ghế ngồi', 'Giường nằm', 'Limousine'];

export default function CustomerSearchPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [sortBy, setSortBy] = useState('time_asc');
  const [maxPrice, setMaxPrice] = useState('');

  // Seat map modal
  const [seatModal, setSeatModal] = useState(null); // { schedule }
  const [confirmedTicket, setConfirmedTicket] = useState(null);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = {
        origin: origin.trim() || undefined,
        destination: destination.trim() || undefined,
        date: date || undefined,
        sortBy,
      };
      if (maxPrice) params.maxPrice = maxPrice;
      const { data } = await api.get('/customer/schedules', { params });
      // Client-side filter by vehicle type if selected
      const filtered = selectedTypes.length === 0
        ? data
        : data.filter(s => selectedTypes.includes(s.vehicleType));
      setSchedules(filtered);
    } catch {
      showToast('Không thể tải danh sách chuyến xe', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(); }, []);

  const handleOpenSeatMap = (schedule) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để đặt vé', 'error');
      navigate('/login');
      return;
    }
    setSeatModal({ schedule });
  };

  const handleBookingSuccess = (ticket, schedule) => {
    setSeatModal(null);
    setConfirmedTicket({ ticket, schedule });
    search();
  };

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <CustomerLayout>
      {/* SEAT MAP MODAL */}
      {seatModal && (
        <SeatMapModal
          schedule={seatModal.schedule}
          onClose={() => setSeatModal(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* BOOKING CONFIRMATION MODAL */}
      {confirmedTicket && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
            padding: 36, maxWidth: 440, width: '100%',
            boxShadow: 'var(--shadow-lg)', animation: 'scaleIn 0.25s cubic-bezier(0.34,1.4,0.64,1)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                Đặt vé thành công!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
                Lưu mã vé bên dưới để sử dụng khi lên xe
              </p>
            </div>

            <div style={{
              background: 'var(--primary-light)', border: '2px dashed var(--primary)',
              borderRadius: 'var(--radius)', padding: '16px 24px', textAlign: 'center', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Mã vé
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: 'var(--primary)' }}>
                {confirmedTicket.ticket.bookingCode}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                Ghế số <strong>{confirmedTicket.ticket.seatNumber}</strong>
              </div>
            </div>

            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                {confirmedTicket.schedule.origin} → {confirmedTicket.schedule.destination}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Khởi hành</div>
                  <div style={{ fontWeight: 600 }}>{formatTime(confirmedTicket.schedule.departureTime)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Nhà xe</div>
                  <div style={{ fontWeight: 600 }}>{confirmedTicket.schedule.companyName}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Loại xe</div>
                  <div style={{ fontWeight: 600 }}>{confirmedTicket.schedule.vehicleType}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Giá vé</div>
                  <div style={{ fontWeight: 700, color: '#f97316' }}>
                    {formatPrice(confirmedTicket.schedule.basePrice)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmedTicket(null)}>
                Đặt vé khác
              </button>
              <Link
                to="/customer/tickets"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setConfirmedTicket(null)}
              >
                Xem vé của tôi →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO + SEARCH */}
      <section className="cl-hero">
        <div className="cl-hero-inner">
          <h1 className="cl-hero-title">Đặt vé xe khách dễ dàng</h1>
          <p className="cl-hero-sub">Hơn 100 tuyến đường — Đặt vé chỉ trong vài giây</p>

          <div className="cl-search-box">
            <div className="form-group" style={{ flex: 1, minWidth: 130 }}>
              <label>Điểm đi</label>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Hà Nội"
                onKeyDown={(e) => e.key === 'Enter' && search()}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 9 }}>
              <button
                type="button"
                onClick={() => { const t = origin; setOrigin(destination); setDestination(t); }}
                title="Đổi chiều"
                style={{
                  background: 'var(--bg3)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', width: 36, height: 36, cursor: 'pointer',
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >⇄</button>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: 130 }}>
              <label>Điểm đến</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="TP.HCM"
                onKeyDown={(e) => e.key === 'Enter' && search()}
              />
            </div>

            <div className="form-group" style={{ minWidth: 140 }}>
              <label>Ngày đi</label>
              <input
                type="date"
                value={date}
                min={getTodayStr()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button className="cl-search-btn" onClick={search} disabled={loading} style={{ height: 42 }}>
              {loading ? '...' : '🔍 Tìm chuyến'}
            </button>
          </div>
        </div>
      </section>

      {/* RESULTS + FILTERS */}
      <div className="cl-results" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* FILTER SIDEBAR */}
        <aside style={{
          width: 220, flexShrink: 0, background: 'var(--bg2)',
          borderRadius: 'var(--radius)', border: '1px solid var(--border)',
          padding: '18px 16px',
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--text)' }}>Bộ lọc</div>

          {/* Sort */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sắp xếp
            </div>
            {[
              { val: 'time_asc', label: 'Giờ sớm nhất' },
              { val: 'price_asc', label: 'Giá thấp nhất' },
              { val: 'price_desc', label: 'Giá cao nhất' },
            ].map(opt => (
              <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer', marginBottom: 6, color: 'var(--text)' }}>
                <input
                  type="radio"
                  name="sortBy"
                  value={opt.val}
                  checked={sortBy === opt.val}
                  onChange={() => setSortBy(opt.val)}
                />
                {opt.label}
              </label>
            ))}
          </div>

          {/* Loại xe */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Loại xe
            </div>
            {VEHICLE_TYPES.map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer', marginBottom: 6, color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
              </label>
            ))}
          </div>

          {/* Giá tối đa */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Giá tối đa
            </div>
            <input
              type="number"
              placeholder="VD: 300000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', fontSize: 13 }} onClick={search}>
            Áp dụng
          </button>
        </aside>

        {/* RESULTS LIST */}
        <div style={{ flex: 1 }}>
          {searched && (
            <div className="cl-results-header">
              <span className="cl-results-title">
                {loading ? 'Đang tìm chuyến xe...' : schedules.length > 0 ? 'Chuyến xe có sẵn' : 'Không tìm thấy chuyến xe'}
              </span>
              {!loading && schedules.length > 0 && (
                <span className="cl-results-count">{schedules.length} chuyến</span>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading">Đang tải chuyến xe...</div>
          ) : schedules.length === 0 && searched ? (
            <div className="empty" style={{ marginTop: 16 }}>
              Không có chuyến xe nào phù hợp.<br />
              <span style={{ fontSize: 13 }}>Thử thay đổi ngày đi hoặc điểm đến</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {schedules.map((s, i) => {
                const isFull = s.availableSeats === 0;
                const isLow = s.availableSeats > 0 && s.availableSeats <= 5;
                return (
                  <div key={s.vehicleRouteId} className="cl-ticket-card" style={{ animationDelay: `${i * 0.05}s`, padding: '18px 20px' }}>
                    {/* Company + Rating */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 14, color: 'var(--primary)',
                        }}>
                          {s.companyName?.[0] || 'X'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{s.companyName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {s.vehicleType} · {s.vehicleModel}
                          </div>
                        </div>
                      </div>
                      <StarRating value={s.averageRating} />
                    </div>

                    {/* Route timeline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                          {formatTime(s.departureTime)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.origin}</div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500 }}>
                          {formatDuration(s.estimatedDurationMin)}
                        </div>
                        <div style={{ width: '100%', height: 2, background: 'var(--border)', borderRadius: 1, position: 'relative' }}>
                          <div style={{ position: 'absolute', left: '50%', top: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', transform: 'translateX(-50%)' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {s.distanceKm ? `${s.distanceKm} km` : ''}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                          {calcArrival(s.departureTime, s.estimatedDurationMin)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.destination}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, gap: 12 }}>
                      <span>📅 {formatDate(s.departureTime)}</span>
                      <span>👤 Tài xế: {s.driverName}</span>
                      {s.reviewCount > 0 && <span>💬 {s.reviewCount} đánh giá</span>}
                    </div>

                    {/* Price + Seats + Book */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#f97316' }}>
                          {formatPrice(s.basePrice)}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 2 }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                            background: isFull ? 'var(--danger-light, #fee2e2)' : isLow ? '#fef9c3' : 'var(--success-light)',
                            color: isFull ? 'var(--danger)' : isLow ? '#b45309' : 'var(--success)',
                          }}>
                            {isFull ? 'Hết chỗ' : isLow ? `Còn ${s.availableSeats} chỗ` : `Còn ${s.availableSeats}/${s.totalSeats} chỗ`}
                          </span>
                        </div>
                      </div>

                      <button
                        className={isFull ? 'btn btn-outline' : 'btn btn-primary'}
                        style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700 }}
                        onClick={() => handleOpenSeatMap(s)}
                        disabled={isFull}
                      >
                        {isFull ? 'Hết chỗ' : 'Chọn chỗ →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
