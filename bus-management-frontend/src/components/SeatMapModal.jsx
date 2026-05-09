import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(p) {
  if (p == null) return '—';
  return Number(p).toLocaleString('vi-VN') + '₫';
}

// Renders a single seat cell
function SeatCell({ number, taken, selected, onSelect }) {
  const state = taken ? 'taken' : selected ? 'selected' : 'available';
  const colors = {
    taken:     { bg: '#fecaca', border: '#f87171', color: '#991b1b', cursor: 'not-allowed' },
    selected:  { bg: '#fbbf24', border: '#d97706', color: '#78350f', cursor: 'pointer' },
    available: { bg: 'var(--bg3)', border: 'var(--border)', color: 'var(--text)', cursor: 'pointer' },
  };
  const s = colors[state];
  return (
    <div
      onClick={() => !taken && onSelect(number)}
      title={taken ? `Ghế ${number} — Đã đặt` : `Ghế ${number}`}
      style={{
        width: 38, height: 38, borderRadius: 8,
        background: s.bg, border: `2px solid ${s.border}`, color: s.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 12.5, cursor: s.cursor,
        transition: 'all 0.12s',
        userSelect: 'none',
      }}
    >
      {number}
    </div>
  );
}

export default function SeatMapModal({ schedule, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [takenSeats, setTakenSeats] = useState([]);
  const [totalSeats, setTotalSeats] = useState(schedule.totalSeats || 40);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const { data } = await api.get(`/customer/schedules/${schedule.vehicleRouteId}/seats`);
        setTakenSeats(data.takenSeats || []);
        setTotalSeats(data.totalSeats || schedule.totalSeats || 40);
      } catch {
        showToast('Không thể tải sơ đồ ghế', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [schedule.vehicleRouteId]);

  const handleBook = async () => {
    if (!selectedSeat) return;
    setBooking(true);
    try {
      const { data } = await api.post('/customer/tickets', {
        vehicleRouteId: schedule.vehicleRouteId,
        seatNumber: selectedSeat,
      });
      onSuccess(data, schedule);
    } catch (err) {
      showToast(err.response?.data?.message || 'Đặt vé thất bại', 'error');
    } finally {
      setBooking(false);
    }
  };

  // Build rows: 2 seats | aisle | 2 seats
  const rows = [];
  for (let seat = 1; seat <= totalSeats; seat += 4) {
    rows.push([seat, seat + 1, seat + 2, seat + 3].filter(n => n <= totalSeats));
  }

  const availableCount = totalSeats - takenSeats.length;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 520,
        boxShadow: 'var(--shadow-lg)', animation: 'scaleIn 0.2s cubic-bezier(0.34,1.4,0.64,1)',
        display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>
              Chọn ghế ngồi
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {schedule.origin} → {schedule.destination} · {formatTime(schedule.departureTime)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {schedule.companyName} · {schedule.vehicleType}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, padding: 4 }}
          >×</button>
        </div>

        {/* Seat map */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div className="loading">Đang tải sơ đồ ghế...</div>
          ) : (
            <>
              {/* Bus diagram header */}
              <div style={{
                textAlign: 'center', fontSize: 28, marginBottom: 12,
                background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '10px 0',
              }}>🚌</div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16, fontSize: 12 }}>
                {[
                  { color: 'var(--bg3)', border: 'var(--border)', label: 'Trống' },
                  { color: '#fbbf24', border: '#d97706', label: 'Đang chọn' },
                  { color: '#fecaca', border: '#f87171', label: 'Đã đặt' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      background: item.color, border: `2px solid ${item.border}`,
                    }} />
                    <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Seat rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {row.slice(0, 2).map(n => (
                        <SeatCell
                          key={n}
                          number={n}
                          taken={takenSeats.includes(n)}
                          selected={selectedSeat === n}
                          onSelect={setSelectedSeat}
                        />
                      ))}
                    </div>
                    {/* Aisle */}
                    <div style={{ width: 24, textAlign: 'center', fontSize: 10, color: 'var(--text-faint)' }}>│</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {row.slice(2).map(n => (
                        <SeatCell
                          key={n}
                          number={n}
                          taken={takenSeats.includes(n)}
                          selected={selectedSeat === n}
                          onSelect={setSelectedSeat}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5, color: 'var(--text-muted)' }}>
                Còn <strong>{availableCount}</strong> / {totalSeats} ghế trống
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            {selectedSeat ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ghế đã chọn</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>Ghế số {selectedSeat}</div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa chọn ghế</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Giá vé</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#f97316' }}>
                {formatPrice(schedule.basePrice)}
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontWeight: 700, fontSize: 14 }}
              onClick={handleBook}
              disabled={!selectedSeat || booking}
            >
              {booking ? 'Đang đặt...' : 'Xác nhận đặt vé'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
