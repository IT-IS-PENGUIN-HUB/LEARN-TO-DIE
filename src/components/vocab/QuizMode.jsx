import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { buildQueue } from '../../lib/srs.js';
import { speakJapanese } from '../../services/tts.js';
import { IconArrowRight, IconCheck, IconStar, IconVolume, IconX } from '../icons.jsx';
import FreqBadge from './FreqBadge.jsx';

const SESSION_SIZE = 10;
const OPTION_KEYS = ['1', '2', '3', '4'];

/**
 * Ngưỡng thu nhỏ chữ Hán ở khối lời giải. Đo trên iPhone 390px: khung lời giải
 * rộng 320px, mỗi chữ Hán 36px — từ 5 ký tự trở lên thì riêng chữ Hán cộng nhãn
 * tần suất và nút loa đã quá một hàng, chữ tự bẻ đôi và khối lời giải phình cao
 * hơn cả bố cục cũ. Thu nhỏ chữ cho nhóm này rẻ hơn hẳn so với để nó bẻ dòng, mà
 * cũng chỉ đụng 6,6% kho — 93,4% từ còn lại giữ nguyên cỡ chữ to.
 */
const LONG_WORD = 5;

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
  /**
   * Trả lời xong, cụm lời giải THAY CHỖ đề bài ở đầu màn hình (đỡ hiện từ hai
   * lần). Nhưng nó cao hơn dòng đề bài nên bốn ô đáp án bị đẩy xuống ~140px:
   * ô vừa chạm trôi khỏi ngón tay, dấu đúng/sai hiện ở chỗ khác chỗ đang nhìn.
   * Nên ngay sau khi chèn, cuộn bù đúng phần cao thêm để bốn ô đứng yên tại chỗ.
   */
  const optionsRef = useRef(null);
  const anchorTop = useRef(null);
  const topRef = useRef(null);

  useLayoutEffect(() => {
    const list = optionsRef.current;
    if (!answered || anchorTop.current === null || !list) return;
    let scroller = list.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    const delta = list.getBoundingClientRect().top - anchorTop.current;
    if (scroller && delta) scroller.scrollTop += delta;
    anchorTop.current = null;
  }, [answered]);

  // Sang câu mới thì kéo về đầu câu hỏi — không thì vẫn đứng ở chỗ đã cuộn của
  // câu trước, đề bài mới nằm khuất phía trên.
  useEffect(() => {
    if (!answered) topRef.current?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, session]);

  const choose = (i) => {
    if (!word || answered || !options[i]) return;
    const correct = options[i].id === word.id;
    // Ghi lại chỗ đang đứng của cụm đáp án để giữ nó yên khi lời giải chèn vào
    anchorTop.current = optionsRef.current?.getBoundingClientRect().top ?? null;
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
  const isLongWord = word.jp.length >= LONG_WORD;

  return (
    <div>
      <p className="quiz-progress" ref={topRef}>
        Câu {idx + 1}/{queue.length} · Đúng {result.correct}/{result.total}
      </p>

      {/* Trả lời xong: cụm lời giải thay luôn chỗ đề bài, hiện đủ ba mặt của từ
          cùng câu ví dụ. Không để ở cuối màn hình nữa vì như thế từ hiện hai lần
          và phải cuộn mới đọc được. */}
      {answered ? (
        <div className="quiz-reveal">
          {/* Nhãn tần suất bên TRÁI chữ Hán, cách đọc bên PHẢI — gộp ba thứ vốn
              chiếm ba dòng vào một hàng, trả chỗ đó cho câu ví dụ. Nghĩa tiếng
              Việt không lên hàng này: trung vị 29 ký tự, đứng cạnh sẽ vỡ thành
              ba dòng hẹp, đọc mệt hơn là để nguyên một dòng riêng. */}
          <div className={`quiz-reveal-head${isLongWord ? ' is-long' : ''}`}>
            <div className="quiz-reveal-main">
              <FreqBadge jp={word.jp} subject={subject} full stacked />
              <h3 className="quiz-word jp-text">{word.jp}</h3>
              <button
                type="button"
                className="btn btn-outline tts-btn"
                onClick={() => speakJapanese(word.jp)}
                aria-label="Đọc phát âm"
              >
                <IconVolume />
              </button>
            </div>
            {word.kana && <p className="quiz-reveal-kana jp-text">{word.kana}</p>}
          </div>
          {word.meaning && <p className="quiz-reveal-meaning">{word.meaning}</p>}
          {(word.exJp || word.exVi) && (
            <div className="quiz-reveal-ex">
              {word.exJp && <p className="jp-text">{word.exJp}</p>}
              {word.exVi && <p className="quiz-reveal-ex-vi">{word.exVi}</p>}
            </div>
          )}
        </div>
      ) : (
        <>
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
          <p className="quiz-hint quiz-ask">{form.hint} (phím 1-4)</p>
        </>
      )}

      <div className="quiz-options" ref={optionsRef}>
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

      {/* Ghim xuống đáy sau khi trả lời: cụm lời giải + 4 đáp án vẫn cao hơn màn
          hình iPhone, để nút chạy theo cuối trang thì mỗi câu phải cuộn một lần
          mới bấm được. Chỉ ghim lúc đã trả lời — lúc đang cân nhắc thì không có
          gì che đáp án. */}
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
