import { useMemo, useState } from 'react';
import { EXAM_YEARS, SUBJECT_META, BANK_TOTAL, CATEGORIES } from '../../data/examBank.js';
import { EXAM_RULES } from '../../data/examRules.js';
import { IconArrowLeft } from '../icons.jsx';

const SUBJECT_ORDER = ['KENSETSU', 'KISO', 'TEKISEI'];

/** Thẻ một môn thi thử: quy chế đọc từ EXAM_RULES, năm đọc từ manifest. */
function MockCard({ subject, total, onStart }) {
  const [year, setYear] = useState('random');
  const rule = EXAM_RULES[subject];
  const years = EXAM_YEARS.filter((y) => (y.subjects[subject] ?? 0) > 0);
  return (
    <div className="qb-ecard">
      <div className="qb-ehead">
        <h3 className="jp-text">{SUBJECT_META[subject].ja}</h3>
        <span>{SUBJECT_META[subject].vi}</span>
      </div>
      <div className="qb-ebody">
        <div className="qb-kv"><span>Thời gian</span><b>{rule.minutes} phút</b></div>
        <div className="qb-kv">
          <span>Số câu trả lời</span>
          <b>{rule.pick ?? 'tất cả'}{rule.perGroupPick ? ` (${rule.perGroupPick}/nhóm)` : ''}</b>
        </div>
        <div className="qb-kv"><span>Điểm đạt</span><b>{rule.passPoints} điểm</b></div>
        <div className="qb-kv"><span>Ngân hàng</span><b>{total} câu</b></div>
        <select className="qb-select qb-mock-year" value={year} onChange={(e) => setYear(e.target.value)}
          aria-label="Chọn năm đề thi">
          <option value="random">Năm: ngẫu nhiên</option>
          {years.map((y) => {
            // Đánh dấu năm hụt câu so với đề chuẩn (học nhãn 問題不足 của trung
            // tâm). "Chuẩn" suy từ chính dữ liệu (max các năm), không viết cứng.
            // Bỏ qua 基礎: 2011–2012 vốn 25 câu là ĐÚNG đề gốc thời đó.
            const norm = subject === 'KISO' ? 0 : Math.max(...years.map((v) => v.subjects[subject] ?? 0));
            const n = y.subjects[subject] ?? 0;
            return (
              <option key={y.year} value={y.year}>
                {y.year} · {y.wa}{n < norm ? ` (thiếu ${norm - n} câu)` : ''}
              </option>
            );
          })}
        </select>
        <button type="button" className="btn btn-primary qb-mock-start" onClick={() => onStart(subject, year)}>
          Bắt đầu thi thử
        </button>
      </div>
    </div>
  );
}

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
  rank, attempts, onStartMock,
  goal, todayCount, onSetGoal, dueCount, remind, onToggleRemind,
  onStartSuggest, onStartRandom, onStartNew, onStartCategory, onOpenBrowse,
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
        {rank && (
          <div className="qb-hero-rank" title={rank.missing ? `Để lên tiếp: ${rank.missing.join(' · ')}` : undefined}>
            <b>{rank.label}</b>
            <span>{rank.missing ? `còn: ${rank.missing[0]}` : 'hạng cao nhất 🏆'}</span>
          </div>
        )}
      </div>

      {resume && (
        <div className="qb-resume">
          <div>
            <strong>{resume.mode === 'mock' ? 'Đang THI dở — đồng hồ vẫn chạy!' : 'Đang làm dở'}</strong>
            <span>
              {resume.mode === 'mock'
                ? <>Thi thử <span className="jp-text">{SUBJECT_META[resume.subject]?.ja}</span> đề {resume.year} · đã trả lời {Object.keys(resume.answers ?? {}).length} câu</>
                : <>
                    {resume.qids?.length
                      ? resume.label ?? 'Bộ câu tuỳ chỉnh'
                      : `${resume.year} · ${resume.subjectFilter === 'all' ? 'cả 3 môn' : SUBJECT_META[resume.subjectFilter]?.ja ?? ''}`}
                    {' '}· câu {(resume.index ?? 0) + 1}/{resume.total}
                  </>}
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

      {/* 今日の目標 — mục tiêu ngày, ロン thích tính năng này của app trung tâm */}
      <div className="qb-goal">
        <div className="qb-goal-head">
          <strong><span className="jp-text">今日の目標</span> · Mục tiêu hôm nay</strong>
          <span className="qb-goal-num">
            <b>{Math.min(todayCount, goal)}</b>/{goal} câu
            {todayCount >= goal && ' 🎉'}
          </span>
        </div>
        <div className="qb-goal-bar">
          <i style={{ width: `${Math.min(100, Math.round((todayCount / goal) * 100))}%` }}
             className={todayCount >= goal ? 'is-done' : undefined} />
        </div>
        <div className="qb-goal-foot">
          <span>{todayCount >= goal ? `Đạt rồi — hôm nay đã làm ${todayCount} câu` : `Còn ${goal - todayCount} câu nữa`}</span>
          <button
            type="button"
            className={`qb-remind${remind ? ' is-on' : ''}`}
            onClick={onToggleRemind}
            title={remind ? 'Đang nhắc mỗi khi mở app mà chưa đạt đích — bấm để tắt'
              : 'Bật nhắc học: mở app mà chưa đạt đích hôm nay là app nhắc'}
          >
            {remind ? '🔔 Đang nhắc' : '🔕 Bật nhắc học'}
          </button>
          <label>
            Đích/ngày:
            <select className="qb-select qb-goal-sel" value={goal}
              onChange={(e) => onSetGoal(Number(e.target.value))}>
              {[10, 20, 30, 50, 80].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Chế độ luyện — học từ app trung tâm: gợi ý, ngẫu nhiên, câu sai, đánh dấu, tuỳ chỉnh */}
      <div className="qb-modes">
        <button type="button" className="qb-mode" onClick={onStartSuggest} disabled={!dueCount && !wrongCount}>
          <span className="qb-mode-icon is-suggest">💡</span>
          <span className="qb-mode-body">
            <strong>Gợi ý hôm nay</strong>
            <span>{dueCount ? `${dueCount} câu đến hạn ôn theo SRS` : 'ôn lại các câu đã làm'}</span>
          </span>
        </button>
        <button type="button" className="qb-mode" onClick={onStartRandom}>
          <span className="qb-mode-icon is-random">🎲</span>
          <span className="qb-mode-body">
            <strong>Ngẫu nhiên</strong>
            <span>20 câu bất kỳ từ cả kho</span>
          </span>
        </button>
        <button type="button" className="qb-mode" onClick={onStartNew}>
          <span className="qb-mode-icon is-new">✨</span>
          <span className="qb-mode-body">
            <strong>Câu mới</strong>
            <span>20 câu chưa từng làm, ưu tiên đề năm gần nhất</span>
          </span>
        </button>
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
        <button type="button" className="qb-mode" onClick={onOpenBrowse}>
          <span className="qb-mode-icon is-browse">🗂</span>
          <span className="qb-mode-body">
            <strong>Xem lại</strong>
            <span>duyệt câu đã làm · bạn chọn gì, đúng sai ra sao</span>
          </span>
        </button>
      </div>

      {/* Duyệt theo CHUYÊN MỤC — bấm pill một môn là hiện (như sidebar app trung tâm) */}
      {subjectFilter !== 'all' && (
        <div className="qb-cats">
          {Object.entries(CATEGORIES)
            .filter(([, m]) => m.subject === subjectFilter)
            .sort(([, x], [, y]) => (y.count ?? 0) - (x.count ?? 0))
            .map(([code, m]) => (
              <button key={code} type="button" className="qb-cat"
                onClick={() => onStartCategory(subjectFilter, code, m.ja)}>
                <span className="jp-text">{m.ja}</span>
                <em>{m.count} câu</em>
              </button>
            ))}
        </div>
      )}

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

      {/* ---- Thi thử đúng quy chế ---- */}
      <h3 className="qb-sec-title"><span className="jp-text">模擬試験</span> · Thi thử — bấm giờ, không tạm dừng, chấm theo điểm đạt thật</h3>
      <div className="qb-ecards">
        {SUBJECT_ORDER.map((s) => (
          <MockCard key={s} subject={s} total={totals[s]} onStart={onStartMock} />
        ))}
      </div>

      {attempts?.length > 0 && (
        <div className="qb-history">
          <h3 className="qb-sec-title">Lịch sử thi thử</h3>
          {attempts.slice(0, 6).map((a) => (
            <div key={a.id} className="qb-att">
              <span className={`qb-att-badge ${a.passed ? 'is-pass' : 'is-fail'}`}>
                {a.passed ? 'ĐỖ' : 'TRƯỢT'}
              </span>
              <span className="jp-text">{SUBJECT_META[a.subject]?.short}</span>
              <span>đề {a.year}</span>
              <b>{a.score} điểm</b>
              <span className="qb-att-sub">
                {a.correct}/{a.answered} đúng · {new Date(a.startedAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      )}

      <h3 className="qb-sec-title">Làm đề theo năm</h3>
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
