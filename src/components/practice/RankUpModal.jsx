import { useMemo } from 'react';
import { RankBadge } from './RankName.jsx';
import { TIERS } from '../../lib/rank.js';

// Từ Bạch Kim trở lên là bắn pháo giấy (ロン chỉnh 15/8/2026: "Tinh Anh thì
// lâu quá") — Đồng/Bạc/Vàng thăng khá dày, bắn mãi thành nhàm.
const CONFETTI_TIERS = new Set(['bachkim', 'kimcuong', 'tinhanh', 'caothu', 'thachdau']);
const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#3a86ff', '#10b981', '#a78bfa', '#f472b6'];

/**
 * Màn CHÚC MỪNG THĂNG BẬC (ロン yêu cầu 15/8/2026): thăng bậc lớn là hiện ngay,
 * huy hiệu bậc mới + nút OK; Tinh Anh trở lên kèm pháo giấy nho nhỏ. Mảnh pháo
 * sinh một lần bằng useMemo — re-render không làm pháo bắn lại từ đầu.
 */
export default function RankUpModal({ tierId, tierName, label, onClose }) {
  const confetti = useMemo(() => {
    if (!CONFETTI_TIERS.has(tierId)) return null;
    return Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 1.8 + Math.random() * 1.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      tilt: Math.random() * 360,
      size: 6 + Math.random() * 6,
    }));
  }, [tierId]);

  return (
    <div className="modal rankup-overlay" role="dialog" aria-modal="true" aria-label="Thăng bậc">
      {confetti && (
        <div className="rankup-confetti" aria-hidden="true">
          {confetti.map((c, i) => (
            <span
              key={i}
              style={{
                left: `${c.left}%`,
                width: c.size,
                height: c.size * 1.5,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                transform: `rotate(${c.tilt}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <div className={`rankup-card is-${tierId}`}>
        <span className="rankup-badge-slot">
          {/* Vừa thăng bậc = đứng ở bậc con cao nhất, chưa xong bậc con nào */}
          <RankBadge tierId={tierId} divisions={TIERS.find((t) => t.id === tierId)?.divisions ?? 0} done={0} size={76} />
        </span>
        <p className="rankup-title">THĂNG BẬC!</p>
        <p className="rankup-tier">{label ?? tierName}</p>
        <p className="rankup-sub">
          {CONFETTI_TIERS.has(tierId)
            ? 'Đẳng cấp thật sự — vùng đất của người sắp đi thi 🎉'
            : 'Tiếp tục đà này, bậc kế tiếp đang chờ.'}
        </p>
        <button type="button" className="btn btn-primary" onClick={onClose} autoFocus>
          OK, học tiếp!
        </button>
      </div>
    </div>
  );
}
