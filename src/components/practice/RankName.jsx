/**
 * Tên hạng + huy hiệu hạng, dùng chung cho Sidebar / màn Đề thi / Thống kê /
 * bảng thang / modal thăng bậc.
 *
 * RankName: chữ. Sao đầy vàng đậm, sao rỗng xám mờ — trước in nguyên chuỗi một
 * màu vàng, sao RỖNG nhìn xa y hệt sao đầy nên ロン tưởng đủ sao mà app vẫn đòi
 * thêm câu đúng (22/8).
 *
 * RankBadge: hình tròn màu riêng từng bậc + icon "chiến đấu" + CUNG SAO BẬC CON
 * phía trên (ロン yêu cầu 22/8): Đồng 5 sao, các bậc sau 3 — hoàn thành bậc con
 * nào thì sao đó SÁNG, chưa tới thì tối.
 */

export const TIER_ICONS = {
  dong: '🗡️',      // lính mới tập kiếm
  bac: '⚔️',       // kiếm chéo — biết đánh trận
  vang: '🛡️',      // khiên vàng — trụ được
  bachkim: '⚜️',   // huy hiệu hiệp sĩ
  kimcuong: '💎',  // kim cương
  tinhanh: '🦅',   // đại bàng
  caothu: '🐲',    // rồng
  thachdau: '👑',  // vua của thang
};

export function RankBadge({ tierId, divisions = 0, done = 0, size = 48 }) {
  // Cung sao xoè phía trên đỉnh: 5 sao mở ~140°, 3 sao ~72° — đều cách nhau 36°
  const arc = divisions > 1 ? 36 * (divisions - 1) : 0;
  const starPx = Math.max(10, Math.round(size * 0.2));
  return (
    <span
      className={`rk-badge is-${tierId}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.48) }}
      aria-hidden="true"
    >
      <i className="rk-badge-ic">{TIER_ICONS[tierId] ?? '🎖'}</i>
      {Array.from({ length: divisions }, (_, i) => {
        const a = divisions === 1 ? 0 : -arc / 2 + (arc / (divisions - 1)) * i;
        return (
          <b
            key={i}
            className={`rk-bstar${i < done ? ' is-on' : ''}`}
            style={{
              fontSize: starPx,
              transform: `rotate(${a}deg) translateY(-${Math.round(size / 2 + starPx * 0.72)}px) rotate(${-a}deg)`,
            }}
          >
            ★
          </b>
        );
      })}
    </span>
  );
}

export default function RankName({ rank }) {
  if (!rank) return null;
  // Cao Thủ (★N không trần) và Thách Đấu không có bậc con — in nguyên label
  if (rank.division == null) return <b className="rk-name">{rank.label}</b>;
  return (
    <b className="rk-name">
      {rank.tier} {rank.division}{' '}
      <span className="rk-stars" aria-label={`${rank.stars}/3 sao`}>
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < rank.stars ? 'is-on' : undefined}>
            {i < rank.stars ? '★' : '☆'}
          </i>
        ))}
      </span>
    </b>
  );
}
