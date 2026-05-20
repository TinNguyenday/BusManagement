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

// Detect layout type from vehicleType string
function detectLayout(vehicleType) {
  const t = (vehicleType || '').toLowerCase();
  if (t.includes('giường') || t.includes('sleeper') || t.includes('nằm')) return 'sleeper';
  if (t.includes('limousine') || t.includes('vip') || t.includes('luxury')) return 'limousine';
  return 'regular'; // ghế ngồi 2+2
}

// ─── Seat Cell ────────────────────────────────────────────────────
function SeatCell({ number, taken, selected, onSelect, shape = 'regular' }) {
  const state = taken ? 'taken' : selected ? 'selected' : 'available';

  const palette = {
    taken:     { bg: '#fecaca', border: '#f87171', color: '#991b1b' },
    selected:  { bg: '#fbbf24', border: '#d97706', color: '#78350f' },
    available: { bg: 'var(--bg3)', border: 'var(--border)', color: 'var(--text)' },
  };

  const sizeMap = {
    regular:   { width: 38, height: 38, radius: 8, fontSize: 12 },
    limousine: { width: 52, height: 44, radius: 10, fontSize: 13 },
    sleeper:   { width: 44, height: 52, radius: 8, fontSize: 12 },
  };

  const sz = sizeMap[shape] || sizeMap.regular;
  const p = palette[state];

  return (
    <div
      onClick={() => !taken && onSelect(number)}
      title={taken ? `Ghế ${number} — Đã đặt` : `Ghế ${number}`}
      style={{
        width: sz.width, height: sz.height,
        borderRadius: sz.radius,
        background: p.bg, border: `2px solid ${p.border}`, color: p.color,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: sz.fontSize,
        cursor: taken ? 'not-allowed' : 'pointer',
        transition: 'all 0.12s', userSelect: 'none',
        opacity: taken ? 0.85 : 1,
      }}
    >
      {shape === 'sleeper' && (
        <span style={{ fontSize: 14, lineHeight: 1, marginBottom: 1 }}>🛏</span>
      )}
      {shape === 'limousine' && (
        <span style={{ fontSize: 16, lineHeight: 1, marginBottom: 2 }}>💺</span>
      )}
      {number}
    </div>
  );
}

// ─── Layouts ─────────────────────────────────────────────────────

function RegularLayout({ totalSeats, takenSeats, selectedSeat, onSelect }) {
  const rows = [];
  for (let i = 1; i <= totalSeats; i += 4) {
    rows.push([i, i + 1, i + 2, i + 3].filter(n => n <= totalSeats));
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{ textAlign: 'center', fontSize: 24, background: 'var(--bg3)', borderRadius: 8, padding: '8px 0', width: '100%', marginBottom: 4 }}>🚌</div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {row.slice(0, 2).map(n => (
              <SeatCell key={n} number={n} taken={takenSeats.includes(n)} selected={selectedSeat === n} onSelect={onSelect} shape="regular" />
            ))}
          </div>
          <div style={{ width: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 10 }}>│</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {row.slice(2).map(n => (
              <SeatCell key={n} number={n} taken={takenSeats.includes(n)} selected={selectedSeat === n} onSelect={onSelect} shape="regular" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SleeperLayout({ totalSeats, takenSeats, selectedSeat, onSelect }) {
  const half = Math.ceil(totalSeats / 2);
  const floor1 = Array.from({ length: half }, (_, i) => i + 1);
  const floor2 = Array.from({ length: totalSeats - half }, (_, i) => half + i + 1);

  const renderFloor = (seats, label) => {
    const rows = [];
    for (let i = 0; i < seats.length; i += 2) {
      rows.push([seats[i], seats[i + 1]].filter(Boolean));
    }
    return (
      <div style={{ flex: 1 }}>
        <div style={{
          textAlign: 'center', fontSize: 12, fontWeight: 700,
          color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 6 }}>
              {row.map(n => (
                <SeatCell key={n} number={n} taken={takenSeats.includes(n)} selected={selectedSeat === n} onSelect={onSelect} shape="sleeper" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ textAlign: 'center', fontSize: 24, background: 'var(--bg3)', borderRadius: 8, padding: '8px 0', marginBottom: 12 }}>🚌 Xe Giường Nằm</div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{
          flex: 1, border: '1.5px solid var(--border)', borderRadius: 10, padding: '14px 10px',
          background: 'var(--bg)',
        }}>
          {renderFloor(floor1, '🔽 Tầng dưới')}
        </div>
        <div style={{
          flex: 1, border: '1.5px dashed var(--border)', borderRadius: 10, padding: '14px 10px',
          background: 'var(--bg)',
        }}>
          {renderFloor(floor2, '🔼 Tầng trên')}
        </div>
      </div>
    </div>
  );
}

function LimousineLayout({ totalSeats, takenSeats, selectedSeat, onSelect }) {
  const rows = [];
  for (let i = 1; i <= totalSeats; i += 2) {
    rows.push([i, i + 1].filter(n => n <= totalSeats));
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div style={{
        textAlign: 'center', background: 'linear-gradient(135deg,#1e1b4b,#4338ca)',
        color: '#fff', borderRadius: 10, padding: '10px 0', width: '100%',
        fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 4,
      }}>
        ✨ LIMOUSINE VIP
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {row[0] && (
            <SeatCell number={row[0]} taken={takenSeats.includes(row[0])} selected={selectedSeat === row[0]} onSelect={onSelect} shape="limousine" />
          )}
          <div style={{ width: 32, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>─</div>
          {row[1] ? (
            <SeatCell number={row[1]} taken={takenSeats.includes(row[1])} selected={selectedSeat === row[1]} onSelect={onSelect} shape="limousine" />
          ) : (
            <div style={{ width: 52 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────
export default function SeatMapModal({ schedule, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [takenSeats, setTakenSeats] = useState([]);
  const [totalSeats, setTotalSeats] = useState(schedule.totalSeats || 40);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const layout = detectLayout(schedule.vehicleType);

  useEffect(() => {
    api.get(`/customer/schedules/${schedule.vehicleRouteId}/seats`)
      .then(({ data }) => {
        setTakenSeats(data.takenSeats || []);
        setTotalSeats(data.totalSeats || schedule.totalSeats || 40);
      })
      .catch(() => showToast('Không thể tải sơ đồ ghế', 'error'))
      .finally(() => setLoading(false));
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

  const availableCount = totalSeats - takenSeats.length;

  const layoutLabel = {
    regular:   '🚌 Ghế ngồi (2+2)',
    sleeper:   '🛏 Giường nằm (2 tầng)',
    limousine: '💺 Limousine (1+1)',
  }[layout];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: layout === 'sleeper' ? 580 : 480,
        boxShadow: 'var(--shadow-lg)', animation: 'scaleIn 0.2s cubic-bezier(0.34,1.4,0.64,1)',
        display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>
              Chọn ghế ngồi
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {schedule.origin} → {schedule.destination} · {formatTime(schedule.departureTime)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 3 }}>
              {layoutLabel}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', padding: '10px 0 4px', fontSize: 12 }}>
          {[
            { color: 'var(--bg3)', border: 'var(--border)', label: 'Trống' },
            { color: '#fbbf24', border: '#d97706', label: 'Đang chọn' },
            { color: '#fecaca', border: '#f87171', label: 'Đã đặt' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color, border: `2px solid ${item.border}` }} />
              <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Seat map */}
        <div style={{ padding: '12px 20px 16px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div className="loading">Đang tải sơ đồ ghế...</div>
          ) : layout === 'sleeper' ? (
            <SleeperLayout totalSeats={totalSeats} takenSeats={takenSeats} selectedSeat={selectedSeat} onSelect={setSelectedSeat} />
          ) : layout === 'limousine' ? (
            <LimousineLayout totalSeats={totalSeats} takenSeats={takenSeats} selectedSeat={selectedSeat} onSelect={setSelectedSeat} />
          ) : (
            <RegularLayout totalSeats={totalSeats} takenSeats={takenSeats} selectedSeat={selectedSeat} onSelect={setSelectedSeat} />
          )}

          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
            Còn <strong>{availableCount}</strong> / {totalSeats} chỗ trống
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {selectedSeat ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đã chọn</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>
                  {layout === 'sleeper' ? '🛏' : layout === 'limousine' ? '💺' : '🪑'} Ghế số {selectedSeat}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa chọn ghế</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Giá vé</div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#f97316' }}>{formatPrice(schedule.basePrice)}</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontWeight: 700, fontSize: 14 }}
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
