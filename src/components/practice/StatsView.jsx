import { useMemo, useState } from 'react';
import RankLadder from './RankLadder.jsx';
import RankName, { RankBadge } from './RankName.jsx';
import { EXAM_YEARS, SUBJECT_META, CATEGORIES, BANK_TOTAL } from '../../data/examBank.js';
import { catOfQid } from '../../lib/examData.js';
import { accuracyOverDays, dayKey } from '../../lib/examState.js';
import { computeRank, TIERS } from '../../lib/rank.js';
import { IconArrowLeft } from '../icons.jsx';

/** Mức màu theo tỷ lệ đúng (%) — cùng tông với app trung tâm mà ロン khen:
 *  ≥80 xanh lá, 50–79 cam, dưới 50 đỏ; chưa có dữ liệu giữ màu chủ đạo. */
function accLevel(acc) {
  if (acc == null) return '';
  if (acc >= 80) return 'is-hi';
  if (acc >= 50) return 'is-mid';
  return 'is-lo';
}

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

/** "3h 51m" — giờ học đọc một nhịp là hiểu, không cần chữ. */
function fmtDuration(totalSec) {
  const m = Math.round(totalSec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/** Sắp chuyên mục của một môn: 基礎 theo đề thật, môn khác theo cỡ giảm dần. */
function orderCodes(subject) {
  const codes = Object.keys(CATEGORIES).filter((c) => CATEGORIES[c].subject === subject);
  codes.sort((a, b) => {
    const ia = KISO_ORDER.indexOf(a);
    const ib = KISO_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) return ia - ib;
    return (CATEGORIES[b].count ?? 0) - (CATEGORIES[a].count ?? 0);
  });
  return codes;
}

/* ---- Biểu đồ SVG thuần (không thư viện — app không mang chart lib) ---------
   Một chuỗi dữ liệu, một màu (--primary); lưới mờ; điểm/cột có <title> để rê
   chuột đọc số chính xác. */

const CW = 560; // viewBox — co giãn theo khung ngoài
const CH = 170;
const PAD = { l: 35, r: 8, t: 10, b: 20 };

/** Đường độ chính xác theo ngày (chỉ nối những ngày có làm bài). */
function AccuracyChart({ days }) {
  const plotW = CW - PAD.l - PAD.r;
  const plotH = CH - PAD.t - PAD.b;
  const x = (i) => PAD.l + (days.length <= 1 ? 0 : (i * plotW) / (days.length - 1));
  const y = (acc) => PAD.t + (1 - acc) * plotH;
  const pts = days
    .map((d, i) => ({ ...d, i }))
    .filter((d) => d.r + d.w > 0)
    .map((d) => ({ ...d, cx: x(d.i), cy: y(d.r / (d.r + d.w)) }));
  const path = pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
  return (
    <svg className="qb-chart" viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Độ chính xác 30 ngày">
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line className="qb-grid" x1={PAD.l} x2={CW - PAD.r} y1={y(v)} y2={y(v)} />
          <text className="qb-tick" x={PAD.l - 5} y={y(v) + 3} textAnchor="end">{v * 100}%</text>
        </g>
      ))}
      {/* Nhãn mốc 7 ngày; bỏ mốc sát mép phải kẻo đè nhãn cuối. Nhãn đầu neo
          trái (khỏi đụng "0%" của trục Y), nhãn cuối neo phải (khỏi tràn khung) */}
      {days.map((d, i) => ((i % 7 === 0 && i < days.length - 2) || i === days.length - 1) && (
        <text key={d.key} className="qb-tick" x={x(i)} y={CH - 6}
          textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}>{d.label}</text>
      ))}
      {pts.length > 0 && <path className="qb-line" d={path} />}
      {pts.map((p) => (
        <circle key={p.key} className="qb-dot" cx={p.cx} cy={p.cy} r="3.5">
          <title>{`${p.label}: đúng ${p.r}/${p.r + p.w} lượt (${Math.round((p.r / (p.r + p.w)) * 100)}%)`}</title>
        </circle>
      ))}
      {pts.length === 0 && (
        <text className="qb-empty" x={CW / 2} y={CH / 2} textAnchor="middle">Chưa có lượt làm bài trong 30 ngày</text>
      )}
    </svg>
  );
}

/** Cột số câu theo ngày — đầu cột bo tròn, chân bám trục (spec dataviz). */
function DailyBarChart({ days }) {
  const plotW = CW - PAD.l - PAD.r;
  const plotH = CH - PAD.t - PAD.b;
  const max = Math.max(4, ...days.map((d) => d.r + d.w));
  const bw = Math.min(11, (plotW / days.length) * 0.62);
  const x = (i) => PAD.l + ((i + 0.5) * plotW) / days.length - bw / 2;
  const y0 = PAD.t + plotH;
  const bar = (i, n) => {
    const h = (n / max) * plotH;
    const yTop = y0 - h;
    const r = Math.min(3, bw / 2, h);
    const xi = x(i);
    return `M${xi},${y0} L${xi},${yTop + r} Q${xi},${yTop} ${xi + r},${yTop} L${xi + bw - r},${yTop} Q${xi + bw},${yTop} ${xi + bw},${yTop + r} L${xi + bw},${y0} Z`;
  };
  const ticks = [0, Math.round(max / 2), max];
  return (
    <svg className="qb-chart" viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Số câu theo ngày">
      {ticks.map((v) => {
        const ty = y0 - (v / max) * plotH;
        return (
          <g key={v}>
            <line className="qb-grid" x1={PAD.l} x2={CW - PAD.r} y1={ty} y2={ty} />
            <text className="qb-tick" x={PAD.l - 5} y={ty + 3} textAnchor="end">{v}</text>
          </g>
        );
      })}
      {days.map((d, i) => ((i % 7 === 0 && i < days.length - 2) || i === days.length - 1) && (
        <text key={d.key} className="qb-tick" x={x(i) + bw / 2} y={CH - 6}
          textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}>{d.label}</text>
      ))}
      {days.map((d, i) => {
        const n = d.r + d.w;
        return n > 0 && (
          <path key={d.key} className="qb-bar" d={bar(i, n)}>
            <title>{`${d.label}: ${n} câu (đúng ${d.r})`}</title>
          </path>
        );
      })}
    </svg>
  );
}

/** Vòng % — thẻ tiến độ môn (học bố cục 科目別進捗 của app trung tâm).
 *  Màu đổi theo mức: xanh lá / cam / đỏ như thanh bên dưới. */
function Ring({ pct }) {
  const R = 25;
  const C = 2 * Math.PI * R;
  return (
    <svg className="qb-ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle className="qb-ring-track" cx="32" cy="32" r={R} />
      {pct != null && (
        <circle
          className={`qb-ring-arc ${accLevel(pct)}`}
          cx="32" cy="32" r={R}
          strokeDasharray={`${(pct / 100) * C} ${C}`}
          transform="rotate(-90 32 32)"
        />
      )}
      <text className="qb-ring-num" x="32" y="36" textAnchor="middle">{pct != null ? `${pct}%` : '—'}</text>
    </svg>
  );
}

/**
 * Màn THỐNG KÊ — dựng lại 15/8/2026 theo trang 統計 của app trung tâm (ロン muốn
 * "học hỏi ngay"): thêm tiến độ từng môn, hai biểu đồ 30 ngày, phân tích thời
 * gian trả lời, top chuyên mục yếu và bảng chi tiết từng chuyên mục. Bản đồ
 * nhiệt nâng cấp hiện % ngay trong ô. Mọi thứ vẫn derive từ examState đã sync.
 */
export default function StatsView({ examState, onBack, onOpenCategory }) {
  const years = useMemo(() => [...EXAM_YEARS].sort((a, b) => a.year - b.year), []);
  const [ladderOpen, setLadderOpen] = useState(false);

  const { tiles, grid, cats } = useMemo(() => {
    let done = 0;
    let ever = 0;
    const g = {}; // `${year}|${cat}` -> {r, w}
    const byCat = {}; // cat -> {rl, wl, done}  (rl/wl = lượt đúng/sai, done = số câu khác nhau)
    for (const [qid, e] of Object.entries(examState.srs ?? {})) {
      const n = (e.right ?? 0) + (e.wrong ?? 0);
      if (n === 0) continue;
      done += 1;
      if ((e.right ?? 0) > 0) ever += 1;
      const code = catOfQid(qid);
      const key = `${qid.split('-')[0]}|${code}`;
      g[key] = g[key] ?? { r: 0, w: 0 };
      g[key].r += e.right ?? 0;
      g[key].w += e.wrong ?? 0;
      const c = (byCat[code] = byCat[code] ?? { rl: 0, wl: 0, done: 0 });
      c.rl += e.right ?? 0;
      c.wl += e.wrong ?? 0;
      c.done += 1;
    }
    const mocks = Object.values(examState.attempts ?? {}).filter((a) => a?.mode === 'exam');
    const acc = accuracyOverDays(examState, 30);
    const studySec = Object.values(examState.daily ?? {}).reduce((t, d) => t + (d.s ?? 0), 0)
      + mocks.reduce((t, a) => t + (a.durationSec ?? 0), 0);
    return {
      tiles: {
        done,
        ever,
        acc: acc === null ? '—' : `${Math.round(acc * 100)}%`,
        mock: `${mocks.filter((a) => a.passed).length}/${mocks.length}`,
        study: studySec > 0 ? fmtDuration(studySec) : '—',
      },
      grid: g,
      cats: byCat,
    };
  }, [examState]);

  const rank = useMemo(() => computeRank(examState, BANK_TOTAL), [examState]);

  // 30 ngày gần nhất cho hai biểu đồ — key theo giờ địa phương như examState
  const days = useMemo(() => {
    const out = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const key = dayKey(now - i * 24 * 60 * 60 * 1000);
      const d = examState.daily?.[key] ?? {};
      const [, m, dd] = key.split('-');
      out.push({ key, label: `${Number(dd)}/${Number(m)}`, r: d.r ?? 0, w: d.w ?? 0 });
    }
    return out;
  }, [examState]);

  // Tiến độ từng môn: vòng % = tỷ lệ đúng theo LƯỢT, thanh = số câu đã chạm
  const subjects = useMemo(() => SUBJECT_ORDER.map((s) => {
    const codes = orderCodes(s);
    let total = 0;
    let done = 0;
    let rl = 0;
    let wl = 0;
    for (const code of codes) {
      total += CATEGORIES[code].count ?? 0;
      const c = cats[code];
      if (c) {
        done += c.done;
        rl += c.rl;
        wl += c.wl;
      }
    }
    return {
      id: s,
      ...SUBJECT_META[s],
      total,
      done,
      acc: rl + wl > 0 ? Math.round((rl / (rl + wl)) * 100) : null,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }), [cats]);

  // Chuyên mục yếu nhất: đủ dữ liệu (≥5 lượt) mới được gọi là "yếu"
  const weak = useMemo(() => {
    const rows = Object.entries(cats)
      .map(([code, c]) => ({ code, ...c, n: c.rl + c.wl, acc: c.rl / (c.rl + c.wl) }))
      .filter((r) => r.n >= 5)
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 3);
    return rows;
  }, [cats]);

  // Thời gian trả lời theo chuyên mục (chỉ lượt luyện tập có đo giờ)
  const timing = useMemo(() => {
    const rows = Object.entries(examState.times ?? {})
      .filter(([, t]) => (t?.n ?? 0) > 0)
      .map(([code, t]) => ({ code, n: t.n, avg: t.s / t.n }))
      .sort((a, b) => b.n - a.n);
    const solid = rows.filter((r) => r.n >= 3);
    const totN = rows.reduce((x, r) => x + r.n, 0);
    const totS = rows.reduce((x, r) => x + r.n * r.avg, 0);
    return {
      rows: rows.slice(0, 8),
      maxAvg: Math.max(1, ...rows.slice(0, 8).map((r) => r.avg)),
      fast: solid.length ? solid.reduce((m, r) => (r.avg < m.avg ? r : m)) : null,
      slow: solid.length ? solid.reduce((m, r) => (r.avg > m.avg ? r : m)) : null,
      avg: totN > 0 ? totS / totN : null,
    };
  }, [examState]);

  const rows = useMemo(() => SUBJECT_ORDER.map((subject) => ({ subject, codes: orderCodes(subject) })), []);

  return (
    <section className="qb-wrap container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Quay lại
        </button>
        <h2>Thống kê</h2>
      </div>

      {rank && (
        <>
          {/* Bấm thẻ hạng để bung TOÀN BỘ thang — trước đây chỉ thấy hạng hiện
              tại, không biết phía trên còn những bậc nào, cần gì để lên */}
          <button
            type="button"
            className={`qb-rankcard is-btn${ladderOpen ? ' is-open' : ''}`}
            onClick={() => setLadderOpen((v) => !v)}
            aria-expanded={ladderOpen}
          >
            {/* Huy hiệu bậc + cung sao bậc con (sáng = đã xong bậc con đó) */}
            {(() => {
              const tier = TIERS.find((t) => t.id === rank.tierId);
              const divs = tier?.divisions ?? 0;
              return (
                <RankBadge
                  tierId={rank.tierId}
                  divisions={divs}
                  done={rank.division != null ? divs - rank.division : 0}
                  size={50}
                />
              );
            })()}
            <div>
              <RankName rank={rank} />
              <span>
                {rank.missing
                  ? rank.missingKind === 'stars'
                    // Thiếu sao thì nói chuyện sao — "Để lên Vàng: 12 câu để lên ★"
                    // kiểu cũ đọc rất tối nghĩa (ロン 22/8)
                    ? <>{rank.missing[0]} · gom đủ sao {rank.tier} là lên {rank.nextTier}</>
                    : <>Để lên {rank.nextTier ?? 'bậc kế'}: {rank.missing.join(' · ')}</>
                  : 'Hạng cao nhất — sẵn sàng đi thi 🏆'}
              </span>
              <span className="qb-rank-total">
                Tổng đúng từ trước tới nay: <b>{rank.everCorrect ?? 0}</b> câu khác nhau
              </span>
            </div>
            <span className="qb-rank-toggle">
              {ladderOpen ? 'Thu gọn ▲' : 'Xem cả thang ▼'}
            </span>
          </button>
          {ladderOpen && <RankLadder examState={examState} />}
        </>
      )}

      <div className="qb-tiles">
        <div className="qb-tile"><span>Đã làm</span><b>{tiles.done}</b><em>/ {BANK_TOTAL} câu · {Math.round((tiles.done / BANK_TOTAL) * 100)}%</em></div>
        <div className="qb-tile"><span>Từng đúng</span><b>{tiles.ever}</b><em>câu khác nhau</em></div>
        <div className="qb-tile"><span>Chính xác 30 ngày</span><b>{tiles.acc}</b><em>mọi lượt trả lời</em></div>
        <div className="qb-tile"><span>Thi thử đỗ</span><b>{tiles.mock}</b><em>bài</em></div>
        <div className="qb-tile"><span>Thời gian học</span><b>{tiles.study}</b><em>luyện tập + thi thử</em></div>
      </div>

      {/* Tiến độ từng môn — vòng = tỷ lệ đúng, thanh = phần kho đã chạm tới */}
      <div className="qb-subgrid">
        {subjects.map((s) => (
          <div key={s.id} className="qb-subcard">
            <Ring pct={s.acc} />
            <div className="qb-subbody">
              <b className="jp-text">{s.ja}</b>
              <span>{s.vi}</span>
              <div className="qb-subnums">
                <span>Đã làm <b>{s.done}</b>/{s.total} câu</span>
                <span>{s.pct}%</span>
              </div>
              {/* Thanh = phần kho đã chạm, MÀU = mức tỷ lệ đúng (như app trung tâm) */}
              <div className="qb-progress"><i className={accLevel(s.acc)} style={{ width: `${s.pct}%` }} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Hai biểu đồ 30 ngày (học 30日間の正答率 + 日別回答数 của trung tâm) */}
      <div className="qb-charts">
        <div className="qb-chart-card">
          <h3>Độ chính xác 30 ngày</h3>
          <AccuracyChart days={days} />
        </div>
        <div className="qb-chart-card">
          <h3>Số câu theo ngày</h3>
          <DailyBarChart days={days} />
        </div>
      </div>

      <div className="qb-hm-card">
        <h3>Bản đồ nhiệt — năm × chuyên mục</h3>
        <p>Số trong ô = tỷ lệ đúng (%) · đỏ = đang yếu (làm ≥3 lượt mà dưới 40%) · trống = chưa làm.
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
                          title={`Xem danh sách ${CATEGORIES[code].count} câu của mục ${CATEGORIES[code].ja}`}
                          onClick={() => onOpenCategory(subject, code)}
                        >
                          {CATEGORIES[code].ja}
                        </button>
                      </td>
                      {years.map((y) => {
                        const c = grid[`${y.year}|${code}`];
                        const cls = c ? cellClass(c.r, c.w) : '';
                        const pct = c ? Math.round((c.r / (c.r + c.w)) * 100) : null;
                        const tip = c
                          ? `${CATEGORIES[code].ja} ${y.year}: đúng ${c.r}/${c.r + c.w} lượt`
                          : `${CATEGORIES[code].ja} ${y.year}: chưa làm`;
                        return <td key={y.year}><i className={cls} title={tip}>{pct != null ? pct : ''}</i></td>;
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

      {/* Thời gian trả lời — đo từ 15/8/2026, chỉ luồng luyện tập */}
      <div className="qb-time-card">
        <h3>Thời gian trả lời</h3>
        {timing.rows.length === 0 ? (
          <p className="qb-note">Chưa có dữ liệu — thời gian bắt đầu được đo từ nay trở đi, cứ luyện tập là có.
             (Thi thử chấm gộp cuối giờ nên không tính vào đây.)</p>
        ) : (
          <>
            <div className="qb-time-tiles">
              <div className="qb-tile is-fast"><span>⚡ Nhanh nhất</span><b>{timing.fast ? `${Math.round(timing.fast.avg)}s` : '—'}</b><em className="jp-text">{timing.fast ? CATEGORIES[timing.fast.code]?.ja : 'cần ≥3 lượt đo'}</em></div>
              <div className="qb-tile"><span>Trung bình</span><b>{timing.avg != null ? `${Math.round(timing.avg)}s` : '—'}</b><em>mỗi câu luyện tập</em></div>
              <div className="qb-tile is-slow"><span>🐢 Chậm nhất</span><b>{timing.slow ? `${Math.round(timing.slow.avg)}s` : '—'}</b><em className="jp-text">{timing.slow ? CATEGORIES[timing.slow.code]?.ja : 'cần ≥3 lượt đo'}</em></div>
            </div>
            <div className="qb-time-list">
              {timing.rows.map((r) => (
                <div key={r.code} className="qb-time-row">
                  <span className="jp-text">{CATEGORIES[r.code]?.ja ?? r.code}</span>
                  <div className="qb-progress"><i style={{ width: `${Math.round((r.avg / timing.maxAvg) * 100)}%` }} /></div>
                  <em>{r.n} lượt · <b>{Math.round(r.avg)}s</b></em>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Chuyên mục yếu nhất + nút luyện ngay đúng chỗ đau */}
      {weak.length > 0 && (
        <div className="qb-weak-card">
          <h3>Chuyên mục yếu nhất</h3>
          <div className="qb-weak-grid">
            {weak.map((r, i) => (
              <div key={r.code} className="qb-weak">
                <span className="qb-weak-rank">#{i + 1}</span>
                <b className="jp-text">{CATEGORIES[r.code]?.ja}</b>
                <span className="qb-weak-vi">{CATEGORIES[r.code]?.vi}</span>
                <strong>{Math.round(r.acc * 100)}%</strong>
                <em>{r.rl}/{r.n} lượt đúng</em>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onOpenCategory(CATEGORIES[r.code].subject, r.code)}
                >
                  Xem mục này
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chi tiết từng chuyên mục — thanh tiến độ + % đúng, bấm là luyện */}
      <div className="qb-cats-card">
        <h3>Chi tiết theo chuyên mục</h3>
        {rows.map(({ subject, codes }) => (
          <div key={subject} className="qb-cats-group">
            <h4 className="jp-text">{SUBJECT_META[subject].ja} <span>{SUBJECT_META[subject].vi}</span></h4>
            {codes.map((code) => {
              const meta = CATEGORIES[code];
              const c = cats[code];
              const tries = c ? c.rl + c.wl : 0;
              const acc = tries > 0 ? Math.round((c.rl / tries) * 100) : null;
              const isWeak = tries >= 5 && acc < 70;
              return (
                <button
                  key={code}
                  type="button"
                  className="qb-catrow"
                  title={`Xem danh sách ${meta.count} câu của mục ${meta.ja}`}
                  onClick={() => onOpenCategory(subject, code)}
                >
                  <span className="qb-catname">
                    {isWeak && <i className="qb-weak-dot" title="Đang yếu — dưới 70%" />}
                    <b className="jp-text">{meta.ja}</b>
                    <span>{meta.vi}</span>
                  </span>
                  <span className="qb-catmeta">
                    {c ? <>{c.done}/{meta.count} câu{acc != null && <b className={isWeak ? 'is-weak' : ''}> · {acc}%</b>}</> : 'Chưa làm'}
                  </span>
                  <span className="qb-progress"><i className={accLevel(acc)} style={{ width: `${c ? Math.round((c.done / meta.count) * 100) : 0}%` }} /></span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
