import { useEffect, useRef, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { buildQueue } from '../../lib/srs.js';
import { speakJapanese } from '../../services/tts.js';
import { IconArrowRight, IconCheck, IconStar, IconVolume, IconX } from '../icons.jsx';
import FreqBadge from './FreqBadge.jsx';

const SESSION_SIZE = 10;
const OPTION_KEYS = ['1', '2', '3', '4'];

/**
 * Ba dạng câu hỏi TRỘN NGẪU NHIÊN trong cùng một phiên quiz — mỗi câu bốc một
 * dạng. Cứ nhìn chữ Hán đoán nghĩa mãi thì thành học vẹt theo mặt chữ; đảo dạng
 * liên tục buộc phải nhớ cả ba mặt của từ (chữ, cách đọc, nghĩa).
 *
 * Dù hỏi dạng nào thì `answerWord` cũng cộng điểm SRS cho CHÍNH TỪ ĐÓ — một bộ
 * đếm lượt học duy nhất cho mỗi từ, không tách theo dạng câu hỏi.
 *
 * ask   = field làm câu hỏi
 * pick  = field làm 4 đáp án
 * speak = có được đọc to lúc CHƯA trả lời không. Dạng "chữ Hán → cách đọc" mà
 *         đọc lên là lộ đáp án, nên tắt; trả lời xong mới có nút đọc.
 */
const FORMS = [
  { id: 'meaning', ask: 'jp', pick: 'meaning', speak: true, hint: 'Chọn NGHĨA đúng' },
  { id: 'kanji', ask: 'meaning', pick: 'jp', speak: false, hint: 'Chọn CHỮ HÁN đúng' },
  { id: 'kana', ask: 'jp', pick: 'kana', speak: false, hint: 'Chọn CÁCH ĐỌC đúng' },
];

const val = (w, field) => (w?.[field] ?? '').trim();

/** Ra đề được ít nhất một dạng: luôn cần chữ Hán, cộng thêm nghĩa hoặc cách đọc. */
const quizable = (list) => list.filter((w) => val(w, 'jp') && (val(w, 'meaning') || val(w, 'kana')));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * pool (tuỳ chọn): chỉ ra đề trong danh sách từ này (ôn theo chương giáo trình).
 * Đáp án nhiễu vẫn lấy từ toàn kho để câu hỏi không dễ đoán.
 */
export default function QuizMode({ subject, onRecordAnswer, pool }) {
  const { vocab, allWords, answerWord, setMastered } = useVocab();
  const source = pool ?? vocab[subject];
  const [session, setSession] = useState(0); // tăng để bắt đầu phiên mới
  const [queue, setQueue] = useState(() => buildQueue(quizable(source), { limit: SESSION_SIZE }));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null); // index option đã chọn
  const [result, setResult] = useState({ correct: 0, total: 0 });
  const nextBtnRef = useRef(null);

  // Phiên mới khi đổi subject, đổi bộ lọc chương, hoặc bấm "Phiên mới"
  const poolKey = pool ? pool.map((w) => w.id).join(',') : '';
  useEffect(() => {
    setQueue(buildQueue(quizable(pool ?? vocab[subject]), { limit: SESSION_SIZE }));
    setIdx(0);
    setChosen(null);
    setResult({ correct: 0, total: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, session, poolKey]);

  const word = queue[idx] ?? null;
  const finished = queue.length > 0 && idx >= queue.length;

  // Dữ liệu mới nhất cho việc TẠO câu hỏi, nhưng không được là dependency —
  // auto-sync đổi vocab ngầm không được phép xáo lại đáp án đang hiển thị.
  const poolRef = useRef({ vocab, allWords });
  poolRef.current = { vocab, allWords };

  // Câu hỏi hiện tại = {form, options}. Hai thứ phải sinh CÙNG LÚC, không thì
  // có khoảnh khắc đáp án của dạng cũ nằm dưới câu hỏi của dạng mới.
  const [question, setQuestion] = useState({ form: FORMS[0], options: [] });
  useEffect(() => {
    if (!word) {
      setQuestion({ form: FORMS[0], options: [] });
      return;
    }
    const { vocab: v, allWords: all } = poolRef.current;
    // allWords là bản sao ({...w, subject}) nên không so sánh được bằng tham
    // chiếu — phải loại theo id, không thì từ cùng môn lọt vào 2 lần.
    const sameIds = new Set(v[subject].map((w) => w.id));
    const others = [...shuffle(v[subject].filter((w) => w.id !== word.id)), ...shuffle(all.filter((w) => !sameIds.has(w.id)))];

    const build = (form) => {
      if (!val(word, form.ask) || !val(word, form.pick)) return null;
      // Bỏ đáp án trùng chữ, và bỏ từ có cùng câu hỏi (vd 2 từ chung một nghĩa)
      // vì như thế câu hỏi sẽ có 2 đáp án cùng đúng.
      const asked = val(word, form.ask);
      const seen = new Set([val(word, form.pick)]);
      const distractors = [];
      for (const w of others) {
        const answer = val(w, form.pick);
        if (!answer || seen.has(answer) || val(w, form.ask) === asked) continue;
        seen.add(answer);
        distractors.push(w);
        if (distractors.length === 3) break;
      }
      return distractors.length === 3 ? { form, options: shuffle([word, ...distractors]) } : null;
    };

    // Bốc ngẫu nhiên một dạng ra được đủ 4 đáp án khác nhau cho từ này
    let built = null;
    for (const form of shuffle(FORMS)) {
      built = build(form);
      if (built) break;
    }
    setQuestion(built ?? { form: FORMS[0], options: [word] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, idx, session, subject]);

  const { form, options } = question;
  const answered = chosen !== null;

  // Trả lời xong thì kéo bảng nghĩa vào tầm mắt. Không có bước này thì trên
  // iPhone bảng nằm ngay dưới mép màn hình (bị thanh nút che), phải tự cuộn mới
  // đọc được — mà đọc lại từ vừa sai mới là phần đáng giá nhất của quiz.
  // Nhảy thẳng, không cuộn mượt: mỗi câu trả lời là một lần nhảy, chờ animation
  // 300ms mười lần một phiên là chậm thấy rõ.
  const revealRef = useRef(null);
  useEffect(() => {
    if (answered) revealRef.current?.scrollIntoView({ block: 'end' });
  }, [answered]);

  const choose = (i) => {
    if (!word || answered || !options[i]) return;
    const correct = options[i].id === word.id;
    setChosen(i);
    setResult((r) => ({ correct: r.correct + (correct ? 1 : 0), total: r.total + 1 }));
    answerWord(subject, word.id, correct);
    onRecordAnswer?.(correct);
    if (!correct) {
      // Câu sai quay lại cuối phiên
      setQueue((q) => [...q, word]);
    }
  };

  const next = () => {
    if (!answered) return;
    setChosen(null);
    setIdx((i) => i + 1);
  };

  // Phím tắt: 1-4 chọn đáp án, Enter câu tiếp theo
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = OPTION_KEYS.indexOf(e.key);
      if (k !== -1 && !answered) {
        e.preventDefault();
        choose(k);
      } else if (e.key === 'Enter' && answered) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!queue.length) {
    if (pool) {
      return <p className="quiz-hint">Chương này chưa có từ nào điền đủ nghĩa để ra đề.</p>;
    }
    return (
      <p className="quiz-hint">
        {vocab[subject].length
          ? 'Môn này chưa có từ nào điền nghĩa nên không ra đề được. Vào tab "🗂 Kho từ" điền nghĩa hoặc xoá từ hỏng nhé!'
          : 'Chưa có từ nào để quiz. Thêm từ mới trước nhé!'}
      </p>
    );
  }

  if (allWords.length < 4) {
    return <p className="quiz-hint">Cần ít nhất 4 từ trong kho để tạo câu hỏi trắc nghiệm.</p>;
  }

  if (finished) {
    const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
    return (
      <div className="session-summary">
        <p className="big-number">
          {result.correct}/{result.total}
        </p>
        <p style={{ marginBottom: '1.5rem' }}>Đúng {pct}% — {pct >= 80 ? 'Tuyệt vời! 🎉' : pct >= 50 ? 'Khá ổn, tiếp tục!' : 'Ôn lại thêm nhé!'}</p>
        <button type="button" className="btn btn-primary" onClick={() => setSession((s) => s + 1)}>
          Phiên mới
        </button>
      </div>
    );
  }

  const askIsJapanese = form.ask === 'jp';

  return (
    <div>
      <p className="quiz-progress">
        Câu {idx + 1}/{queue.length} · Đúng {result.correct}/{result.total}
      </p>
      <div className="quiz-word-row">
        <h3 className={`quiz-word${askIsJapanese ? ' jp-text' : ' quiz-word-vi'}`}>{val(word, form.ask)}</h3>
        {form.speak && (
          <button
            type="button"
            className="btn btn-outline tts-btn"
            onClick={() => speakJapanese(word.jp)}
            aria-label="Đọc phát âm"
          >
            <IconVolume />
          </button>
        )}
      </div>
      {/* Dạng câu hỏi đổi liên tục nên phải nói rõ đang hỏi gì */}
      {!answered && <p className="quiz-hint quiz-ask">{form.hint} (phím 1-4)</p>}
      <div className="quiz-options">
        {options.map((opt, i) => {
          const isCorrectOpt = opt.id === word.id;
          let cls = 'answer-option';
          if (answered && isCorrectOpt) cls += ' correct';
          if (answered && chosen === i && !isCorrectOpt) cls += ' wrong';
          return (
            <button key={opt.id} type="button" className={cls} onClick={() => choose(i)} disabled={answered}>
              <span className="opt-letter">{i + 1}</span>
              <span className={form.pick === 'meaning' ? '' : 'jp-text'}>{val(opt, form.pick)}</span>
              {answered && isCorrectOpt && (
                <span className="opt-result">
                  <IconCheck />
                </span>
              )}
              {answered && chosen === i && !isCorrectOpt && (
                <span className="opt-result">
                  <IconX />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Trả lời xong thì hiện đủ cả ba mặt của từ, dù vừa hỏi dạng nào */}
      {answered && (
        <div className="quiz-reveal" ref={revealRef}>
          <div className="quiz-reveal-head">
            <span className="jp-text quiz-reveal-jp">{word.jp}</span>
            <button
              type="button"
              className="btn btn-outline tts-btn"
              onClick={() => speakJapanese(word.jp)}
              aria-label="Đọc phát âm"
            >
              <IconVolume />
            </button>
            <FreqBadge jp={word.jp} subject={subject} full />
          </div>
          {word.kana && <p className="quiz-reveal-kana jp-text">{word.kana}</p>}
          {word.meaning && <p className="quiz-reveal-meaning">{word.meaning}</p>}
          {(word.exJp || word.exVi) && (
            <div className="quiz-reveal-ex">
              {word.exJp && <p className="jp-text">{word.exJp}</p>}
              {word.exVi && <p className="quiz-reveal-ex-vi">{word.exVi}</p>}
            </div>
          )}
        </div>
      )}

      {/* Ghim xuống đáy sau khi trả lời: cả cụm câu hỏi + 4 đáp án + bảng nghĩa
          vốn đã cao hơn màn hình iPhone, để nút chạy theo cuối trang thì mỗi câu
          phải cuộn một lần mới bấm được. Chỉ ghim lúc đã trả lời — lúc đang cân
          nhắc thì không có gì che đáp án. */}
      <div className={`quiz-actions${answered ? ' is-pinned' : ''}`}>
        {answered && (
          <>
            <button
              type="button"
              className="btn btn-outline btn-remember"
              onClick={() => {
                setMastered(subject, word.id, true);
                next();
              }}
            >
              <IconStar /> Đã nhớ!
            </button>
            <button type="button" ref={nextBtnRef} className="btn btn-primary" onClick={next}>
              Câu tiếp theo <IconArrowRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
