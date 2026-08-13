import { useMemo } from 'react';
import { EXAM_YEARS, SUBJECT_META, BANK_TOTAL } from '../../data/examBank.js';
import { IconArrowLeft } from '../icons.jsx';

const SUBJECT_ORDER = ['KENSETSU', 'KISO', 'TEKISEI'];

/**
 * Màn chọn đề: lọc theo môn + lưới thẻ năm.
 * Số câu, cấu trúc từng năm đều ĐỌC TỪ DỮ LIỆU (examBank.js sinh bằng script),
 * không viết cứng — 2011–2012 vốn chỉ có 25 câu 基礎, và năm sau thêm đề mới
 * thì chỉ cần chạy lại script là thẻ năm tự xuất hiện.
 */
export default function PracticeHome({
  subjectFilter, onChangeFilter, onOpenYear, onBack, statsOf,
  resume, onResume, onDropResume,
  wrongCount, bookmarkCount, onStartWrong, onStartBookmarks, onOpenCustom,
}) {
  const subjects = subjectFilter === 'all' ? SUBJECT_ORDER : [subjectFilter];

  const totals = useMemo(() => {
    const t = {};
    for (const s of SUBJECT_ORDER) {
      t[s] = EXAM_YEARS.reduce((n, y) => n + (y.subjects[s] ?? 0), 0);
    }
    return t;
  }, []);

  return (
    <section className="qb-wrap container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Quay lại
        </button>
        <h2>Đề thi</h2>
      </div>

      <div className="qb-hero">
        <div className="qb-hero-body">
          <strong>{BANK_TOTAL} câu · {EXAM_YEARS.length} năm</strong>
          <span>Song ngữ Nhật–Việt, có lời giải chi tiết</span>
        </div>
      </div>

      {resume && (
        <div className="qb-resume">
          <div>
            <strong>Đang làm dở</strong>
            <span>
              {resume.qids?.length
                ? resume.label ?? 'Bộ câu tuỳ chỉnh'
                : `${resume.year} · ${resume.subjectFilter === 'all' ? 'cả 3 môn' : SUBJECT_META[resume.subjectFilter]?.ja ?? ''}`}
              {' '}· câu {resume.index + 1}/{resume.total}
            </span>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onResume}>
            Làm tiếp
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onDropResume}>
            Bỏ
          </button>
        </div>
      )}

      {/* Chế độ luyện — học từ app trung tâm: câu hay sai, câu đánh dấu, tuỳ chỉnh */}
      <div className="qb-modes">
        <button
          type="button"
          className="qb-mode"
          onClick={onStartWrong}
          disabled={!wrongCount}
          title={wrongCount ? undefined : 'Chưa có câu nào từng sai'}
        >
          <span className="qb-mode-icon is-wrong">↺</span>
          <span className="qb-mode-body">
            <strong>Ôn câu sai</strong>
            <span>{wrongCount ? `${wrongCount} câu từng sai, ôn theo lịch SRS` : 'chưa có câu sai nào'}</span>
          </span>
        </button>
        <button
          type="button"
          className="qb-mode"
          onClick={onStartBookmarks}
          disabled={!bookmarkCount}
          title={bookmarkCount ? undefined : 'Chưa đánh dấu câu nào'}
        >
          <span className="qb-mode-icon is-mark">⚑</span>
          <span className="qb-mode-body">
            <strong>Câu đánh dấu</strong>
            <span>{bookmarkCount ? `${bookmarkCount} câu đã ghim` : 'chưa ghim câu nào'}</span>
          </span>
        </button>
        <button type="button" className="qb-mode" onClick={onOpenCustom}>
          <span className="qb-mode-icon is-custom">⚙</span>
          <span className="qb-mode-body">
            <strong>Tuỳ chỉnh</strong>
            <span>chọn môn · chuyên mục · năm · số câu</span>
          </span>
        </button>
      </div>

      <div className="qb-filters" role="tablist" aria-label="Lọc theo môn">
        <button
          type="button"
          role="tab"
          aria-selected={subjectFilter === 'all'}
          className={`qb-pill${subjectFilter === 'all' ? ' is-on' : ''}`}
          onClick={() => onChangeFilter('all')}
        >
          Tất cả <em>{BANK_TOTAL}</em>
        </button>
        {SUBJECT_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={subjectFilter === s}
            className={`qb-pill${subjectFilter === s ? ' is-on' : ''}`}
            onClick={() => onChangeFilter(s)}
          >
            <span className="jp-text">{SUBJECT_META[s].short}</span> {SUBJECT_META[s].vi} <em>{totals[s]}</em>
          </button>
        ))}
      </div>

      <div className="qb-years">
        {EXAM_YEARS.map((y) => {
          const count = subjects.reduce((n, s) => n + (y.subjects[s] ?? 0), 0);
          if (!count) return null;
          const st = statsOf(y.year, subjects);
          const structure = SUBJECT_ORDER.filter((s) => y.subjects[s]).map(
            (s) => `${SUBJECT_META[s].short}${y.subjects[s]}`
          );
          // Đề 2011 thiếu đúng 1 câu 適性 bên nguồn (đã đối chiếu công bố chính thức
          // của 日本技術士会). Báo cho người học biết thay vì im lặng.
          const missing = y.year === 2011 ? 1 : 0;
          return (
            <button
              key={y.year}
              type="button"
              className="qb-year"
              onClick={() => onOpenYear(y.year)}
              aria-label={`Làm đề năm ${y.year}, ${count} câu`}
            >
              {missing > 0 && <span className="qb-flag">thiếu {missing} câu</span>}
              <span className="qb-year-num">{y.year}</span>
              <span className="qb-year-wa jp-text">{y.wa}</span>
              <span className="qb-year-row">
                <span>{count} câu · <span className="jp-text">{structure.join(' ')}</span></span>
                <b>{st.done ? `${Math.round((st.right / st.done) * 100)}%` : '—'}</b>
              </span>
              <span className="qb-bar">
                <i style={{ width: `${st.pct}%` }} className={st.pct === 100 ? 'is-full' : undefined} />
              </span>
              <span className="qb-year-sub">
                {st.done ? `đã làm ${st.done}/${st.total}` : 'chưa làm'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
