import { useMemo } from 'react';
import { rankLadder } from '../../lib/rank.js';
import { RankBadge } from './RankName.jsx';
import { BANK_TOTAL } from '../../data/examBank.js';

/**
 * BẢNG THANG XẾP HẠNG đầy đủ (ロン yêu cầu 15/8/2026): xem trước cả đường leo —
 * mỗi bậc cần bao nhiêu câu đúng, mấy bậc con, cổng điều kiện gì, mình đang ở
 * đâu. Mọi con số lấy từ rankLadder() nên khớp tuyệt đối với thẻ hạng.
 */
export default function RankLadder({ examState }) {
  const rows = useMemo(() => rankLadder(examState, BANK_TOTAL), [examState]);
  const totalStars = rows.reduce((n, r) => n + r.starsTotal, 0);
  const lastCounted = [...rows].reverse().find((r) => r.to != null);

  return (
    <div className="qb-ladder">
      <p className="qb-ladder-intro">
        Sao kiếm bằng <b>số câu KHÁC NHAU từng trả lời đúng</b> (làm lại câu cũ không cộng thêm).
        Mỗi bậc con 3 sao, càng lên cao một sao càng đắt. Không bao giờ bị tụt sao.
        Trọn thang {totalStars} sao ≈ {lastCounted?.to} câu đúng
        ({Math.round(((lastCounted?.to ?? 0) / BANK_TOTAL) * 100)}% kho {BANK_TOTAL} câu).
      </p>

      <ol className="qb-ladder-list">
        {rows.map((r) => (
          <li key={r.id} className={`qb-tier is-${r.id} is-${r.state}`}>
            {/* Huy hiệu tròn + cung sao BẬC CON phía trên (sáng = đã xong bậc con đó) */}
            <span className="qb-tier-badge-slot">
              <RankBadge tierId={r.id} divisions={r.divisions} done={r.doneDivs} size={44} />
            </span>
            <div className="qb-tier-body">
              <div className="qb-tier-head">
                <b>{r.name}</b>
                {r.divisions > 0 && <span className="qb-tier-div">{r.divisions} bậc con · {r.starsTotal} sao</span>}
                {r.state === 'current' && <span className="qb-tier-now">đang ở đây</span>}
                {r.state === 'done' && <span className="qb-tier-done">đã qua</span>}
              </div>

              {r.to != null ? (
                <div className="qb-tier-cost">
                  <b>{r.cost}</b> câu đúng / sao · cần tổng <b>{r.from}</b> → <b>{r.to}</b> câu đúng
                </div>
              ) : (
                <div className="qb-tier-cost">
                  {r.id === 'caothu'
                    ? 'Không tính sao theo câu đúng — mỗi bài thi thử ĐỖ là 1 sao'
                    : 'Đỉnh thang — không còn bậc nào ở trên'}
                </div>
              )}

              {r.starsTotal > 0 && (
                <div className="qb-tier-stars" aria-label={`${r.starsGot}/${r.starsTotal} sao`}>
                  {/* ☆ cho sao chưa đạt (khớp cách thẻ hạng ghi ★★☆) — không
                      chỉ đổi màu, để phân biệt được cả khi mù màu hoặc in ra */}
                  {Array.from({ length: r.starsTotal }, (_, i) => (
                    <i key={i} className={i < r.starsGot ? 'is-on' : undefined}>{i < r.starsGot ? '★' : '☆'}</i>
                  ))}
                </div>
              )}

              {r.gates.length > 0 && (
                <ul className="qb-tier-gates">
                  {r.gates.map((g) => (
                    <li key={g.label} className={g.ok ? 'is-ok' : 'is-no'}>
                      <span aria-hidden="true">{g.ok ? '✓' : '○'}</span>
                      {g.label} <em>(đang: {g.now})</em>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="qb-ladder-note">
        Cổng điều kiện phải đạt thì mới sang bậc mới, dù đã đủ sao — để hạng phản ánh cả
        độ phủ kho đề và độ chính xác gần đây, không chỉ số câu cày được.
      </p>
    </div>
  );
}
