import { useMemo } from 'react';
import { EXAM_YEARS, SUBJECT_META, CATEGORIES, BANK_TOTAL } from '../../data/examBank.js';
import { catOfQid } from '../../lib/examData.js';
import { accuracyOverDays } from '../../lib/examState.js';
import { computeRank } from '../../lib/rank.js';
import { IconArrowLeft } from '../icons.jsx';

// Thứ tự nhóm 基礎 theo đề thật (Ⅰ-1…Ⅰ-5) — cùng thứ tự với build_examdata.py
const KISO_ORDER = ['KISO_DESIGN', 'KISO_INFO', 'KISO_ANALYSIS', 'KISO_MATERIAL', 'KISO_ENV'];
const SUBJECT_ORDER = ['KISO', 'TEKISEI', 'KENSETSU'];

function cellClass(right, wrong) {
  const n = right + wrong;
  if (n === 0) return '';
  const acc = right / n;
  if (n >= 3 && acc < 0.4) return 'is-f'; // yếu thật sự — làm nhiều mà vẫn dưới 40%
  if (acc < 0.5) return 'is-b';
  if (acc < 0.7) return 'is-c';
  if (acc < 0.85) return 'is-d';
  return 'is-e';
}

/**
 * Màn THỐNG KÊ (GĐ6b): ô số tổng quan + thẻ hạng chi tiết + bản đồ nhiệt
 * năm × chuyên mục — nhìn một phát biết mảng nào đang yếu để lọc luyện đúng đó.
 * Mọi thứ derive từ examState (đã sync) + manifest; không viết cứng năm/mục nào.
 */
export default function StatsView({ examState, onBack, onStartCategory }) {
  const years = useMemo(() => [...EXAM_YEARS].sort((a, b) => a.year - b.year), []);

  const { tiles, grid } = useMemo(() => {
    let done = 0;
    let ever = 0;
    const g = {}; // `${year}|${cat}` -> {r, w}
    for (const [qid, e] of Object.entries(examState.srs ?? {})) {
      const n = (e.right ?? 0) + (e.wrong ?? 0);
      if (n === 0) continue;
      done += 1;
      if ((e.right ?? 0) > 0) ever += 1;
      const key = `${qid.split('-')[0]}|${catOfQid(qid)}`;
      g[key] = g[key] ?? { r: 0, w: 0 };
      g[key].r += e.right ?? 0;
      g[key].w += e.wrong ?? 0;
    }
    const mocks = Object.values(examState.attempts ?? {}).filter((a) => a?.mode === 'exam');
    const acc = accuracyOverDays(examState, 30);
    return {
      tiles: {
        done,
        ever,
        acc: acc === null ? '—' : `${Math.round(acc * 100)}%`,
        mock: `${mocks.filter((a) => a.passed).length}/${mocks.length}`,
      },
      grid: g,
    };
  }, [examState]);

  const rank = useMemo(() => computeRank(examState, BANK_TOTAL), [examState]);

  const rows = useMemo(() => {
    const out = [];
    for (const s of SUBJECT_ORDER) {
      const codes = Object.keys(CATEGORIES).filter((c) => CATEGORIES[c].subject === s);
      codes.sort((a, b) => {
        const ia = KISO_ORDER.indexOf(a);
        const ib = KISO_ORDER.indexOf(b);
        if (ia !== -1 || ib !== -1) return ia - ib;
        return (CATEGORIES[b].count ?? 0) - (CATEGORIES[a].count ?? 0);
      });
      out.push({ subject: s, codes });
    }
    return out;
  }, []);

  return (
    <section className="qb-wrap container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Quay lại
        </button>
        <h2>Thống kê</h2>
      </div>

      {rank && (
        <div className="qb-rankcard">
          <span className="qb-rank-medal">🏅</span>
          <div>
            <b>{rank.label}</b>
            <span>
              {rank.missing
                ? <>Để lên {rank.nextTier ?? 'bậc kế'}: {rank.missing.join(' · ')}</>
                : 'Hạng cao nhất — sẵn sàng đi thi 🏆'}
            </span>
          </div>
        </div>
      )}

      <div className="qb-tiles">
        <div className="qb-tile"><span>Đã làm</span><b>{tiles.done}</b><em>/ {BANK_TOTAL} câu · {Math.round((tiles.done / BANK_TOTAL) * 100)}%</em></div>
        <div className="qb-tile"><span>Từng đúng</span><b>{tiles.ever}</b><em>câu khác nhau</em></div>
        <div className="qb-tile"><span>Chính xác 30 ngày</span><b>{tiles.acc}</b><em>mọi lượt trả lời</em></div>
        <div className="qb-tile"><span>Thi thử đỗ</span><b>{tiles.mock}</b><em>bài</em></div>
      </div>

      <div className="qb-hm-card">
        <h3>Bản đồ nhiệt — năm × chuyên mục</h3>
        <p>Xanh đậm = tỷ lệ đúng cao · đỏ = đang yếu (làm ≥3 lượt mà dưới 40%) · xám = chưa làm.
           Bấm tên chuyên mục để luyện trọn mục đó.</p>
        <div className="qb-hm-scroll">
          <table className="qb-hm">
            <thead>
              <tr>
                <th aria-hidden="true" />
                {years.map((y) => <th key={y.year}>{String(y.year).slice(2)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ subject, codes }) => (
                [
                  <tr key={subject}>
                    <td className="qb-hm-subject jp-text" colSpan={years.length + 1}>
                      {SUBJECT_META[subject].ja}
                    </td>
                  </tr>,
                  ...codes.map((code) => (
                    <tr key={code}>
                      <td className="qb-hm-row">
                        <button
                          type="button"
                          className="qb-hm-cat jp-text"
                          title={`Luyện trọn mục ${CATEGORIES[code].ja} (${CATEGORIES[code].count} câu)`}
                          onClick={() => onStartCategory(subject, code, CATEGORIES[code].ja)}
                        >
                          {CATEGORIES[code].ja}
                        </button>
                      </td>
                      {years.map((y) => {
                        const c = grid[`${y.year}|${code}`];
                        const cls = c ? cellClass(c.r, c.w) : '';
                        const tip = c
                          ? `${CATEGORIES[code].ja} ${y.year}: đúng ${c.r}/${c.r + c.w} lượt`
                          : `${CATEGORIES[code].ja} ${y.year}: chưa làm`;
                        return <td key={y.year}><i className={cls} title={tip} /></td>;
                      })}
                    </tr>
                  )),
                ]
              ))}
            </tbody>
          </table>
        </div>
        <div className="qb-hm-legend">
          <span><i /> chưa làm</span>
          <span><i className="is-b" /> &lt;50%</span>
          <span><i className="is-c" /> 50–70%</span>
          <span><i className="is-d" /> 70–85%</span>
          <span><i className="is-e" /> ≥85%</span>
          <span><i className="is-f" /> yếu</span>
        </div>
      </div>
    </section>
  );
}
