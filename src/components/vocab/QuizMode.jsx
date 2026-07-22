import { useEffect, useMemo, useRef, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { buildQueue } from '../../lib/srs.js';
import { speakJapanese } from '../../services/tts.js';
import { IconArrowRight, IconCheck, IconStar, IconVolume, IconX } from '../icons.jsx';

const SESSION_SIZE = 10;
const OPTION_KEYS = ['1', '2', '3', '4'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizMode({ subject, onRecordAnswer }) {
  const { vocab, allWords, answerWord, setMastered } = useVocab();
  const [session, setSession] = useState(0); // tăng để bắt đầu phiên mới
  const [queue, setQueue] = useState(() => buildQueue(vocab[subject], { limit: SESSION_SIZE }));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null); // index option đã chọn
  const [result, setResult] = useState({ correct: 0, total: 0 });
  const nextBtnRef = useRef(null);

  // Phiên mới khi đổi subject hoặc bấm "Phiên mới"
  useEffect(() => {
    setQueue(buildQueue(vocab[subject], { limit: SESSION_SIZE }));
    setIdx(0);
    setChosen(null);
    setResult({ correct: 0, total: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, session]);

  const word = queue[idx] ?? null;
  const finished = queue.length > 0 && idx >= queue.length;

  // 4 đáp án: nghĩa đúng + 3 nghĩa nhiễu (ưu tiên cùng môn, thiếu thì lấy môn khác)
  const options = useMemo(() => {
    if (!word) return [];
    const samePool = vocab[subject].filter((w) => w.id !== word.id && w.meaning);
    const otherPool = allWords.filter((w) => w.id !== word.id && w.meaning && !samePool.includes(w));
    const distractors = shuffle([...shuffle(samePool).slice(0, 3), ...shuffle(otherPool)]).slice(0, 3);
    return shuffle([word, ...distractors]);
  }, [word, vocab, subject, allWords]);

  const answered = chosen !== null;

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
    return <p className="quiz-hint">Chưa có từ nào để quiz. Thêm từ mới trước nhé!</p>;
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

  return (
    <div>
      <p className="quiz-progress">
        Câu {idx + 1}/{queue.length} · Đúng {result.correct}/{result.total}
      </p>
      <div className="quiz-word-row">
        <h3 className="jp-text quiz-word">{word.jp}</h3>
        <button
          type="button"
          className="btn btn-outline tts-btn"
          onClick={() => speakJapanese(word.jp)}
          aria-label="Đọc phát âm"
        >
          <IconVolume />
        </button>
      </div>
      <p className="quiz-hint">{answered ? word.kana || ' ' : 'Chọn nghĩa đúng (phím 1-4)'}</p>
      <div className="quiz-options">
        {options.map((opt, i) => {
          const isCorrectOpt = opt.id === word.id;
          let cls = 'answer-option';
          if (answered && isCorrectOpt) cls += ' correct';
          if (answered && chosen === i && !isCorrectOpt) cls += ' wrong';
          return (
            <button key={opt.id} type="button" className={cls} onClick={() => choose(i)} disabled={answered}>
              <span className="opt-letter">{i + 1}</span>
              <span>{opt.meaning}</span>
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
      <div className="quiz-actions">
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
