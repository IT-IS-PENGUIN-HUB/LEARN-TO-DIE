import { useMemo } from 'react';
import { CATEGORIES, SUBJECT_META, EXAM_YEARS } from '../../data/examBank.js';
import { answerLabel } from '../../lib/examData.js';
import { IconArrowLeft } from '../icons.jsx';

const WA = Object.fromEntries(EXAM_YEARS.map((y) => [y.year, y.wa]));

/**
 * Trạng thái một câu để chấm dấu ✓/✕/· cho dòng.
 * CẨN THẬN: 91 lượt lịch sử nhập từ app trung tâm KHÔNG có `last` (chỉ có số lần
 * đúng/sai), nên phải có nhánh dự phòng — chỉ dựa vào `last` thì mọi câu nhập về
 * đều hiện dấu ✕ oan.
 */
function statusOf(q, e) {
  if (!e || (e.right ?? 0) + (e.wrong ?? 0) === 0) return 'new';
  if (e.last) return (answerLabel(q)?.includes(e.last) || q.sp?.voided) ? 'ok' : 'no';
  return (e.right ?? 0) > 0 ? 'ok' : 'no';
}

/**
 * DANH SÁCH CÂU CỦA MỘT CHUYÊN MỤC, gom theo năm — học panel 問題一覧 của app
 * trung tâm (ロン yêu cầu 24/8/2026): bấm một mục nhỏ (vd 情報・論理に関するもの)
 * là thấy hết câu của mục theo từng năm, muốn làm năm nào / câu nào thì bấm
 * thẳng vào đó. Trước đây bấm mục là bị lùa ngay vào làm cả 88 câu.
 *
 * Khác bản trung tâm ở chỗ đây là MÀN RIÊNG chứ không phải thanh cố định cạnh
 * đề — ロン chê thanh đó không thu nhỏ được, ăn hết bề ngang màn hình.
 */
export default function CategoryList({
  code, subject, questions, examState, onOpen, onStart, onBack,
}) {
  const cat = CATEGORIES[code];

  const { groups, done, ever, unseen } = useMemo(() => {
    const byYear = new Map();
    let d = 0;
    let ok = 0;
    const fresh = [];
    questions.forEach((q, i) => {
      const e = examState.srs?.[q.qid];
      const st = statusOf(q, e);
      if (st === 'new') fresh.push(q);
      else {
        d += 1;
        if ((e.right ?? 0) > 0) ok += 1; // "từng đúng" — cùng thước đo với xếp hạng
      }
      if (!byYear.has(q.year)) byYear.set(q.year, []);
      byYear.get(q.year).push({
        q, i, st,
        wrong: e?.wrong ?? 0,
        marked: Boolean(examState.bookmarks?.[q.qid]?.on),
      });
    });
    return {
      groups: [...byYear.entries()].map(([year, items]) => ({ year, items })),
      done: d, ever: ok, unseen: fresh,
    };
  }, [questions, examState]);

  const pct = questions.length ? Math.round((done / questions.length) * 100) : 0;

  return (
    <section className="qb-wrap container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Quay lại
        </button>
        <h2>Chuyên mục</h2>
      </div>

      <div className="qb-clist-head">
        <div className="qb-clist-title">
          <strong className="jp-text">{cat?.ja ?? code}</strong>
          <span>
            {cat?.vi}
            {SUBJECT_META[subject] && <> · <span className="jp-text">{SUBJECT_META[subject].ja}</span></>}
          </span>
        </div>
        <div className="qb-clist-stat">
          <b>{questions.length} câu · {groups.length} năm</b>
          <span>đã làm {done} · từng đúng {ever}</span>
          <span className="qb-bar">
            <i style={{ width: `${pct}%` }} className={pct === 100 ? 'is-full' : undefined} />
          </span>
        </div>
        <div className="qb-clist-btns">
          <button type="button" className="btn btn-primary"
            onClick={() => onStart(questions, 0, cat?.ja ?? code)}>
            Làm cả mục
          </button>
          <button type="button" className="btn btn-outline" disabled={!unseen.length}
            title={unseen.length ? undefined : 'Mục này bạn đã đụng hết rồi'}
            onClick={() => onStart(unseen, 0, `${cat?.ja ?? code} · chưa làm`)}>
            Chưa làm ({unseen.length})
          </button>
        </div>
      </div>

      <p className="qb-clist-hint">
        Bấm thẳng vào một câu để làm đúng câu đó — hoặc bấm <b>Làm cả năm</b> ở đầu mỗi năm.
      </p>

      {groups.map(({ year, items }) => {
        const dn = items.filter((x) => x.st !== 'new').length;
        return (
          <div key={year} className="qb-clist-year">
            <div className="qb-clist-yhead">
              <strong>{year}</strong>
              <span className="jp-text">{WA[year]}</span>
              <em>{dn}/{items.length} đã làm</em>
              {/* Mục thưa (vd 鉄道 mỗi năm 1 câu) thì "Làm cả năm" chỉ là bản sao
                  của chính dòng câu bên dưới — giấu đi cho đỡ rác. */}
              {items.length > 1 && (
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => onStart(items.map((x) => x.q), 0, `${cat?.ja ?? code} · ${year}`)}>
                  Làm cả năm
                </button>
              )}
            </div>
            <div className="qb-clist-rows">
              {items.map(({ q, i, st, wrong, marked }) => (
                <button key={q.qid} type="button" className={`qb-qrow is-${st}`} onClick={() => onOpen(i)}>
                  <span className={`qb-row-dot is-${st}`}>
                    {st === 'new' ? '·' : st === 'ok' ? '✓' : '✕'}
                  </span>
                  <span className="qb-qrow-no jp-text">第{q.qn}問</span>
                  <span className="qb-qrow-body">
                    <span className="qb-qrow-ja jp-text" lang="ja">{q.qJa}</span>
                    {q.qVi && <span className="qb-qrow-vi">{q.qVi}</span>}
                  </span>
                  {wrong > 0 && <span className="qb-qrow-wr">sai {wrong}</span>}
                  {marked && <span className="qb-qrow-bm" title="Đã đánh dấu">!</span>}
                  <span className="qb-row-go">›</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
