import { useMemo } from 'react';
import { useVocab } from '../context/VocabProvider.jsx';
import { accuracy7d, getStats, lastNDays, streak } from '../lib/stats.js';
import { IconChart, IconFlame } from './icons.jsx';

const CHART_DAYS = 14;

export default function StatsPanel({ refreshToken = 0 }) {
  const { allWords, dueTotal } = useVocab();

  // refreshToken đổi khi đóng modal luyện tập → đọc lại log
  const { days, acc, stk } = useMemo(() => {
    const stats = getStats();
    return { days: lastNDays(CHART_DAYS, stats), acc: accuracy7d(stats), stk: streak(stats) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  const mastered = allWords.filter((w) => w.mastered).length;
  const max = Math.max(1, ...days.map((d) => d.reviewed));

  // Biểu đồ cột SVG tự vẽ, không cần thư viện
  const W = 560;
  const H = 120;
  const gap = 6;
  const barW = (W - gap * (CHART_DAYS - 1)) / CHART_DAYS;

  return (
    <div className="wotd-card" style={{ alignItems: 'stretch', textAlign: 'left' }}>
      <h3 className="wotd-label">
        <IconChart /> Tiến độ học tập
      </h3>
      <div className="stats-grid">
        <div className="stat-tile">
          <div className="stat-value">{allWords.length}</div>
          <div className="stat-label">Tổng số từ</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {mastered}
          </div>
          <div className="stat-label">Đã nhớ</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value" style={{ color: dueTotal > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {dueTotal}
          </div>
          <div className="stat-label">Cần ôn hôm nay</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{acc === null ? '—' : `${acc}%`}</div>
          <div className="stat-label">Đúng 7 ngày qua</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value" style={{ color: stk > 0 ? '#f59e0b' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            {stk > 0 && <IconFlame size="0.8em" />}
            {stk}
          </div>
          <div className="stat-label">Ngày học liên tục</div>
        </div>
      </div>
      <p className="stats-chart-title">Số câu ôn tập {CHART_DAYS} ngày gần nhất</p>
      <svg
        className="stats-chart"
        viewBox={`0 0 ${W} ${H + 22}`}
        role="img"
        aria-label={`Biểu đồ số câu ôn tập ${CHART_DAYS} ngày gần nhất`}
      >
        {days.map((d, i) => {
          const h = d.reviewed ? Math.max(3, (d.reviewed / max) * H) : 2;
          const x = i * (barW + gap);
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={H - h}
                width={barW}
                height={h}
                rx="3"
                fill={d.reviewed ? 'var(--primary)' : 'var(--border-color)'}
              >
                <title>{`${d.label}: ${d.reviewed} câu, đúng ${d.correct}`}</title>
              </rect>
              {i % 2 === (CHART_DAYS - 1) % 2 && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
