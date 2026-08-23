import { useEffect, useMemo, useRef, useState } from 'react';
import { diagramUrl, CATEGORIES, SUBJECT_META } from '../../data/examBank.js';
import { isCorrect, answerLabel, LETTERS } from '../../lib/examData.js';
import AddWordForm from '../vocab/AddWordForm.jsx';
import { IconArrowLeft, IconArrowRight, IconPlus } from '../icons.jsx';

// Môn trong kho đề  ->  môn trong kho từ vựng (khác tên, đừng nhầm)
const VOCAB_SUBJECT = { KISO: 'kiso', TEKISEI: 'tekisei', KENSETSU: 'senmon' };

/**
 * Furigana của trung tâm là HTML ruby, có hai định dạng tuỳ đợt import
 * (<rt> trần và <rp>(</rp><rt>…</rt><rp>)</rp>). Chèn HTML lạ vào trang là
 * rủi ro, nên escape sạch rồi CHỈ mở lại đúng ba thẻ ruby/rt/rp không thuộc tính.
 */
function safeRuby(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)(ruby|rt|rp)&gt;/g, '<$1$2>');
}

function JaText({ text, furigana, showFurigana, className }) {
  if (showFurigana && furigana) {
    return (
      <p
        className={className}
        lang="ja"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeRuby(furigana) }}
      />
    );
  }
  return (
    <p className={className} lang="ja">
      {text}
    </p>
  );
}

function Figures({ names, label }) {
  if (!names?.length) return null;
  return (
    <div className="qb-figs">
      {names.map((n) => (
        <figure key={n} className="qb-fig">
          <figcaption>{label}</figcaption>
          {/* Nền trắng: ảnh hay là PNG trong suốt nét đen, để nền tối là mất hình */}
          <span className="qb-fig-img">
            <img src={diagramUrl(n)} alt={label} loading="lazy" />
          </span>
        </figure>
      ))}
    </div>
  );
}

export default function QuestionRunner({
  questions, index, answers, prefs, examState,
  onSelect, onGo, onToggleBookmark, onExit, onFinish,
  review = false, // xem lại sau thi thử: mọi câu lộ đáp án + lời giải, không chọn được nữa
}) {
  const q = questions[index];
  const picked = answers[q?.qid] ?? null;
  const answered = review || picked !== null;
  const [addOpen, setAddOpen] = useState(false);
  const explRef = useRef(null);
  const listRef = useRef(null);
  const curRef = useRef(null);
  const { lang, furi, size } = prefs;
  const listOpen = Boolean(prefs.qlist);

  // Mở danh sách thì kéo câu đang làm vào giữa hộp. Tự tính scrollTop chứ KHÔNG
  // dùng scrollIntoView: hàm đó kéo luôn cả trang, đang đọc đề bị nhảy mất chỗ.
  useEffect(() => {
    const box = listRef.current;
    const el = curRef.current;
    if (!listOpen || !box || !el) return;
    box.scrollTop = Math.max(0, el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2);
  }, [listOpen, index]);

  // Trả lời xong thì đưa phần lời giải vào tầm mắt — nội dung dài, không cuộn
  // thì người học không biết là đã có giải thích ở dưới.
  useEffect(() => {
    // Chế độ xem lại thì đừng tự cuộn tới lời giải — người xem đang đọc từ đề xuống
    if (answered && !review && explRef.current) {
      explRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [answered, q?.qid, review]);

  useEffect(() => setAddOpen(false), [q?.qid]);

  // Phím tắt cho PC: A–E chọn, ←→ chuyển câu, Enter câu tiếp
  useEffect(() => {
    const onKey = (e) => {
      // e.target có thể là document/window (không có .matches) tuỳ chỗ phát sự kiện
      if (e.target?.matches?.('input, textarea, select')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (LETTERS.includes(k) && q && !answered && !review) {
        const i = LETTERS.indexOf(k);
        if (i < q.oJa.length) { e.preventDefault(); onSelect(q, k); }
      } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && answered)) {
        e.preventDefault(); onGo(index + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault(); onGo(index - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, answered, index, onSelect, onGo]);

  const correctLetters = useMemo(() => (q ? answerLabel(q) : null), [q]);
  if (!q) return null;

  const cat = CATEGORIES[q.cat];
  const bookmarked = Boolean(examState.bookmarks[q.qid]?.on);
  const showJa = lang !== 'vi';
  const showVi = lang !== 'ja';
  const last = index === questions.length - 1;

  return (
    <div className={`qb-run qb-size-${size}`}>
      <div className="qb-topbar">
        <button type="button" className="back-btn" onClick={onExit} aria-label="Thoát">
          <IconArrowLeft />
        </button>
        <div className="qb-crumb">
          <strong className="jp-text">
            {SUBJECT_META[q.subject]?.ja}
            {cat ? ` · ${cat.ja}` : ''}
          </strong>
          <span className="qb-chips">
            <span className="qb-chip is-year">{q.year}</span>
            <span className="qb-chip jp-text">第{q.qn}問</span>
            <span className="qb-chip qb-qid">{q.qid}</span>
          </span>
        </div>
        <div className="qb-tools">
          <span className="qb-seg" role="group" aria-label="Ngôn ngữ">
            {[['ja', 'JA'], ['vi', 'VI'], ['both', 'JA+VI']].map(([v, t]) => (
              <button key={v} type="button" className={lang === v ? 'is-on' : undefined}
                onClick={() => prefs.set({ lang: v })} aria-pressed={lang === v}>{t}</button>
            ))}
          </span>
          <button type="button" className={`qb-icon jp-text${furi ? ' is-on' : ''}`}
            onClick={() => prefs.set({ furi: !furi })} aria-pressed={furi} title="Furigana">漢</button>
          <span className="qb-seg" role="group" aria-label="Cỡ chữ">
            {['s', 'm', 'l'].map((v) => (
              <button key={v} type="button" className={size === v ? 'is-on' : undefined}
                onClick={() => prefs.set({ size: v })} aria-pressed={size === v}>{v.toUpperCase()}</button>
            ))}
          </span>
          {/* Nút đánh dấu: ô vuông dấu "!" nền vàng (ロン yêu cầu 15/8 —
              ngôi sao dễ nhầm với "đã thuộc" của phần từ vựng) */}
          <button type="button" className={`qb-icon qb-bm${bookmarked ? ' is-on' : ''}`}
            onClick={() => onToggleBookmark(q.qid)} aria-pressed={bookmarked}
            title={bookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu để ôn lại'}>
            !
          </button>
        </div>
      </div>

      <div className="qb-body">
        {/* 問題一覧 — hộp kiểm, mặc định TẮT. Bên app trung tâm danh sách này là
            một cột cố định không thu nhỏ được, ăn hết bề ngang màn hình (ロン chê
            đúng chỗ đó 24/8); ở đây tích mới hiện, và lựa chọn nhớ theo máy. */}
        <div className="qb-qlist-bar">
          <label className="qb-check">
            <input
              type="checkbox"
              checked={listOpen}
              onChange={(e) => prefs.set({ qlist: e.target.checked })}
            />
            <span><span className="jp-text">問題一覧</span> · Danh sách câu</span>
          </label>
          <span className="qb-qlist-count">{index + 1}/{questions.length}</span>
        </div>

        {listOpen && (
          <div className="qb-qlist" ref={listRef}>
            {questions.map((item, i) => {
              const a = answers[item.qid];
              const ok = a ? isCorrect(item, a) : null;
              const cls = i === index ? 'is-cur' : ok === null ? '' : ok ? 'is-ok' : 'is-no';
              return (
                <button
                  key={item.qid}
                  type="button"
                  ref={i === index ? curRef : null}
                  className={`qb-qlrow ${cls}`}
                  onClick={() => onGo(i)}
                  aria-current={i === index ? 'true' : undefined}
                >
                  <b>{i + 1}</b>
                  <span className="qb-qlrow-y">{item.year}</span>
                  <span className="jp-text">第{item.qn}問</span>
                  <em>{ok === null ? '−' : ok ? '✓' : '✕'}</em>
                </button>
              );
            })}
          </div>
        )}

        <div className="qb-dots" aria-label={`Câu ${index + 1} trên ${questions.length}`}>
          {questions.map((item, i) => {
            const a = answers[item.qid];
            const cls = i === index ? 'is-cur' : a ? (isCorrect(item, a) ? 'is-ok' : 'is-no') : '';
            return <i key={item.qid} className={cls} />;
          })}
          {/* Điểm phiên trực tiếp (học ô 0/0 của trung tâm) — dải chấm cho biết
              từng câu, con số cho biết tổng khi phiên dài chấm nhỏ khó đếm */}
          {!review && (() => {
            const ok = questions.filter((item) => answers[item.qid] && isCorrect(item, answers[item.qid])).length;
            const no = questions.filter((item) => answers[item.qid] && !isCorrect(item, answers[item.qid])).length;
            return (ok + no) > 0 && (
              <span className="qb-run-score" aria-label={`Đúng ${ok}, sai ${no}`}>
                <b className="is-ok">✓{ok}</b>
                <b className="is-no">✕{no}</b>
              </span>
            );
          })()}
        </div>

        {q.sp?.voided && (
          <p className="qb-note">
            <strong>Câu này đã bị huỷ.</strong> Ban tổ chức xác nhận không có đáp án đúng —
            thi thật thì mọi thí sinh đều được điểm câu này.
          </p>
        )}
        {q.sp?.multi && (
          <p className="qb-note">
            <strong>Câu này có hai đáp án đúng</strong> ({q.sp.multi.join(' hoặc ')}) theo công bố chính thức.
          </p>
        )}

        <div className="qb-card">
          {showJa && <JaText className="qb-ja" text={q.qJa} furigana={q.qFuri} showFurigana={furi} />}
          {showVi && q.qVi && <p className="qb-vi">{q.qVi}</p>}
          <Figures names={q.dQ} label="図 / Hình đề gốc" />
        </div>

        <div className="qb-opts">
          {q.oJa.map((text, i) => {
            const letter = LETTERS[i];
            const isPick = picked === letter;
            const isRight = answered && correctLetters?.includes(letter);
            const cls = ['qb-opt'];
            // Câu bị huỷ thì KHÔNG tô đỏ phương án đã chọn: nó được tính đúng,
            // tô đỏ là tự mâu thuẫn với chính điểm số vừa ghi.
            if (isRight) cls.push('is-right');
            else if (isPick) cls.push(q.sp?.voided ? 'is-void' : 'is-wrong');
            return (
              <button
                key={letter}
                type="button"
                className={cls.join(' ')}
                disabled={answered}
                onClick={() => onSelect(q, letter)}
              >
                <span className="qb-key">{letter}</span>
                <span className="qb-opt-text">
                  {showJa && <span className="qb-ja" lang="ja">{text}</span>}
                  {showVi && q.oVi[i] && q.oVi[i] !== text && <span className="qb-vi">{q.oVi[i]}</span>}
                </span>
                {answered && (isRight || isPick) && (
                  <span className="qb-tag">
                    {isRight ? '✓ Đáp án đúng' : q.sp?.voided ? 'Bạn chọn — câu huỷ, vẫn tính đúng' : 'Bạn chọn'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="qb-expl" ref={explRef}>
            <h4>解説 · Lời giải</h4>
            {showJa && q.eJa && <p className="qb-ja" lang="ja">{q.eJa}</p>}
            {showVi && q.eVi && <p className="qb-vi">{q.eVi}</p>}
            <Figures names={q.dE} label="解説図 / Hình lời giải" />
          </div>
        )}

        {/* Hiện MỌI LÚC chứ không đợi trả lời xong — ロン muốn đang đọc đề gặp
            từ mới là lưu được ngay, không phải chọn bừa đáp án để mở form. */}
        <div className="qb-add">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddOpen((v) => !v)}>
            <IconPlus /> {addOpen ? 'Đóng' : 'Thêm từ vào kho từ vựng'}
          </button>
          {addOpen && (
            <div className="qb-add-form">
              <AddWordForm subject={VOCAB_SUBJECT[q.subject] ?? 'kiso'} />
            </div>
          )}
        </div>
      </div>

      <div className="qb-actions">
        <button type="button" className="btn btn-outline" disabled={index === 0} onClick={() => onGo(index - 1)}>
          <IconArrowLeft /> Trước
        </button>
        <span className="qb-count">{index + 1} / {questions.length}</span>
        {last ? (
          <button type="button" className="btn btn-primary" onClick={onFinish}>Xem kết quả</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => onGo(index + 1)}>
            {answered ? 'Câu tiếp' : 'Bỏ qua'} <IconArrowRight />
          </button>
        )}
      </div>
    </div>
  );
}
