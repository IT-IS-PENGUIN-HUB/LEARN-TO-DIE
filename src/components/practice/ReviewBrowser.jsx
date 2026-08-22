import { useEffect, useMemo, useState } from 'react';
import { SUBJECT_META, CATEGORIES } from '../../data/examBank.js';
import { loadQuestionsByQids, answerLabel, catOfQid } from '../../lib/examData.js';
import { IconArrowLeft } from '../icons.jsx';

const PAGE = 30;

/**
 * Trình XEM LẠI câu đã làm — học từ màn 復習 của app trung tâm: tab lọc
 * (tất cả / câu sai / đã đánh dấu / gần đây), sắp theo lần làm mới nhất,
 * mỗi dòng hiện đề + "bạn chọn X / đáp án đúng Y", bấm mở lại cả lời giải.
 */
export default function ReviewBrowser({ examState, onOpen, onBack, onPractice, initialTab = 'recent' }) {
  const [tab, setTab] = useState(initialTab);
  // Sidebar có lối vào thẳng "Câu sai"/"Đánh dấu" — đổi tab khi được điều đến
  useEffect(() => setTab(initialTab), [initialTab]);
  const [limit, setLimit] = useState(PAGE);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const qids = useMemo(() => {
    const srs = examState.srs ?? {};
    const done = Object.entries(srs).filter(([, e]) => (e.right ?? 0) + (e.wrong ?? 0) > 0);
    let picked;
    if (tab === 'wrong') picked = done.filter(([, e]) => (e.wrong ?? 0) > 0);
    else if (tab === 'marked') {
      const on = new Set(Object.keys(examState.bookmarks ?? {}).filter((q) => examState.bookmarks[q]?.on));
      picked = done.filter(([qid]) => on.has(qid));
      // câu đánh dấu mà CHƯA làm cũng đáng hiện — thêm vào với entry rỗng
      for (const qid of on) if (!srs[qid] || (srs[qid].right ?? 0) + (srs[qid].wrong ?? 0) === 0) picked.push([qid, srs[qid] ?? {}]);
    } else picked = done; // 'all' và 'recent' cùng nguồn, khác mặc định sắp xếp
    return picked
      .sort(([, a], [, b]) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .map(([qid]) => qid);
  }, [examState, tab]);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    loadQuestionsByQids(qids.slice(0, limit))
      .then((qs) => { if (!dead) setRows(qs); })
      .catch(() => { if (!dead) setRows([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [qids, limit]);

  const tabs = [
    ['recent', 'Gần đây'],
    ['all', 'Tất cả'],
    ['wrong', 'Câu sai'],
    ['marked', 'Đã đánh dấu'],
  ];

  return (
    <section className="qb-wrap container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Quay lại
        </button>
        <h2>Xem lại</h2>
      </div>

      <div className="qb-filters" role="tablist">
        {tabs.map(([v, label]) => (
          <button key={v} type="button" role="tab" aria-selected={tab === v}
            className={`qb-pill${tab === v ? ' is-on' : ''}`}
            onClick={() => { setTab(v); setLimit(PAGE); }}>
            {label}
          </button>
        ))}
        <span className="qb-browse-count">{qids.length} câu</span>
      </div>

      {loading && rows.length === 0 && <p className="qb-loading">Đang tải…</p>}
      {/* Trống thì HƯỚNG DẪN cách để có (học màn 復習 của trung tâm: icon + chỉ
          việc cần làm + nút bắt đầu luyện ngay), không chỉ báo "chưa có". */}
      {!loading && qids.length === 0 && (
        <div className="qb-empty">
          <span className={`qb-empty-icon${tab === 'marked' ? ' is-bm' : ''}`} aria-hidden="true">
            {tab === 'marked' ? '!' : tab === 'wrong' ? '🎯' : '🗂'}
          </span>
          {tab === 'marked' ? (
            <>
              <strong>Chưa đánh dấu câu nào</strong>
              <p>Trong lúc làm bài, bấm nút vàng dấu <b className="qb-bm-inline">!</b> ở
                 góc trên bên phải để ghim câu hỏi hay/khó — chúng sẽ nằm ở đây chờ bạn ôn lại.</p>
            </>
          ) : tab === 'wrong' ? (
            <>
              <strong>Chưa có câu sai nào — tuyệt!</strong>
              <p>Câu trả lời sai sẽ tự gom về đây để ôn theo lịch SRS. Làm thêm đề
                 để thử thách bản thân nhé.</p>
            </>
          ) : (
            <>
              <strong>Chưa làm câu nào</strong>
              <p>Bắt đầu luyện đề — mọi câu đã làm sẽ hiện ở đây kèm lựa chọn của
                 bạn và đáp án đúng.</p>
            </>
          )}
          {onPractice && (
            <button type="button" className="btn btn-primary" onClick={onPractice}>
              Bắt đầu luyện tập
            </button>
          )}
        </div>
      )}

      <div className="qb-browse">
        {rows.map((q) => {
          const e = examState.srs?.[q.qid] ?? {};
          const tried = (e.right ?? 0) + (e.wrong ?? 0) > 0;
          const lastOk = e.last ? (answerLabel(q)?.includes(e.last) ?? false) || q.sp?.voided : null;
          const correct = answerLabel(q);
          const cat = CATEGORIES[catOfQid(q.qid)];
          return (
            <button key={q.qid} type="button" className="qb-row" onClick={() => onOpen(q)}>
              <span className={`qb-row-dot ${!tried ? 'is-new' : lastOk === false ? 'is-no' : 'is-ok'}`}>
                {!tried ? '·' : lastOk === false ? '✕' : '✓'}
              </span>
              <span className="qb-row-body">
                <span className="qb-row-meta">
                  <span className="jp-text">{SUBJECT_META[q.subject]?.short}</span>
                  {cat && <span className="jp-text qb-row-cat">{cat.ja}</span>}
                  <span>{q.year}</span>
                  {e.updatedAt > 0 && <span>{new Date(e.updatedAt).toLocaleDateString('vi-VN')}</span>}
                  {(e.wrong ?? 0) > 0 && <span className="qb-row-wr">sai {e.wrong} lần</span>}
                </span>
                <span className="qb-row-ja jp-text" lang="ja">{q.qJa}</span>
                {q.qVi && <span className="qb-row-vi">{q.qVi}</span>}
                <span className="qb-row-ans">
                  {e.last && (
                    <em className={lastOk === false ? 'is-no' : 'is-ok'}>Bạn chọn: {e.last}</em>
                  )}
                  <em className="is-key">
                    Đáp án đúng: {q.sp?.voided ? 'câu huỷ' : correct?.join(' hoặc ')}
                  </em>
                </span>
              </span>
              <span className="qb-row-go">›</span>
            </button>
          );
        })}
      </div>

      {qids.length > limit && (
        <button type="button" className="btn btn-outline qb-browse-more"
          onClick={() => setLimit((n) => n + PAGE)}>
          Xem thêm ({qids.length - limit} câu nữa)
        </button>
      )}
    </section>
  );
}
