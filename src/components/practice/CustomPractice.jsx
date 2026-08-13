import { useMemo, useState } from 'react';
import { EXAM_YEARS, SUBJECT_META, CATEGORIES } from '../../data/examBank.js';
import { IconX } from '../icons.jsx';

const SUBJECT_ORDER = ['KENSETSU', 'KISO', 'TEKISEI'];
const COUNTS = [10, 20, 30, 50, null]; // null = tất cả

/**
 * Hộp thoại luyện tuỳ chỉnh — học từ app trung tâm: chọn nhiều môn, chuyên mục
 * dạng chip, khoảng năm, số câu, và nguồn câu hỏi. Mọi danh sách đều sinh từ
 * manifest (examBank.js), không viết cứng — thêm đề năm mới là tự có.
 */
export default function CustomPractice({ onClose, onStart, counts }) {
  const [subjects, setSubjects] = useState(new Set(SUBJECT_ORDER));
  const [cats, setCats] = useState(new Set()); // rỗng = mọi chuyên mục
  const years = useMemo(() => EXAM_YEARS.map((y) => y.year).sort((a, b) => a - b), []);
  const [yearFrom, setYearFrom] = useState(years[0]);
  const [yearTo, setYearTo] = useState(years[years.length - 1]);
  const [count, setCount] = useState(20);
  const [source, setSource] = useState('all');

  const toggle = (set, setter, key) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const catList = useMemo(
    () =>
      Object.entries(CATEGORIES)
        .filter(([, meta]) => subjects.has(meta.subject))
        .sort(([, x], [, y]) => x.subject.localeCompare(y.subject)),
    [subjects]
  );

  const sources = [
    ['all', 'Tất cả'],
    ['wrong', `Chỉ câu từng sai (${counts.wrong})`],
    ['unseen', 'Chỉ câu chưa làm'],
    ['bookmark', `Chỉ câu đánh dấu (${counts.bookmark})`],
  ];

  const start = () => {
    if (!subjects.size) return;
    onStart({
      subjects: [...subjects],
      cats: cats.size ? cats : null,
      yearFrom: Math.min(yearFrom, yearTo),
      yearTo: Math.max(yearFrom, yearTo),
      count,
      source,
    });
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Tuỳ chỉnh luyện tập">
      <div className="modal-content qb-custom">
        <button type="button" className="qb-custom-close" onClick={onClose} aria-label="Đóng">
          <IconX />
        </button>
        <h2>Tuỳ chỉnh luyện tập</h2>

        <p className="qb-custom-label">Môn (chọn được nhiều)</p>
        <div className="qb-custom-chips">
          {SUBJECT_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={`qb-pill${subjects.has(s) ? ' is-on' : ''}`}
              onClick={() => toggle(subjects, setSubjects, s)}
              aria-pressed={subjects.has(s)}
            >
              <span className="jp-text">{SUBJECT_META[s].short}</span> {SUBJECT_META[s].vi}
            </button>
          ))}
        </div>

        <p className="qb-custom-label">
          Chuyên mục <span className="qb-custom-hint">(bỏ trống = tất cả)</span>
          {cats.size > 0 && (
            <button type="button" className="qb-custom-clear" onClick={() => setCats(new Set())}>
              Bỏ chọn hết
            </button>
          )}
        </p>
        <div className="qb-custom-chips qb-custom-cats">
          {catList.map(([code, meta]) => (
            <button
              key={code}
              type="button"
              className={`qb-pill qb-pill-sm jp-text${cats.has(code) ? ' is-on' : ''}`}
              onClick={() => toggle(cats, setCats, code)}
              aria-pressed={cats.has(code)}
            >
              {meta.ja}
            </button>
          ))}
        </div>

        <p className="qb-custom-label">Khoảng năm</p>
        <div className="qb-custom-years">
          <select className="qb-select" value={yearFrom} onChange={(e) => setYearFrom(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span>~</span>
          <select className="qb-select" value={yearTo} onChange={(e) => setYearTo(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <p className="qb-custom-label">Số câu</p>
        <div className="qb-custom-chips">
          {COUNTS.map((c) => (
            <button
              key={String(c)}
              type="button"
              className={`qb-pill${count === c ? ' is-on' : ''}`}
              onClick={() => setCount(c)}
              aria-pressed={count === c}
            >
              {c ?? 'Tất cả'}
            </button>
          ))}
        </div>

        <p className="qb-custom-label">Nguồn câu hỏi</p>
        <div className="qb-custom-src" role="radiogroup">
          {sources.map(([v, label]) => (
            <label key={v} className="qb-custom-radio">
              <input
                type="radio"
                name="qb-source"
                checked={source === v}
                onChange={() => setSource(v)}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="qb-custom-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Huỷ</button>
          <button type="button" className="btn btn-primary" onClick={start} disabled={!subjects.size}>
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
