import { useEffect, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { buildQueue } from '../../lib/srs.js';
import { speakJapanese } from '../../services/tts.js';
import { IconCheck, IconStar, IconVolume, IconX } from '../icons.jsx';

export default function FlashcardMode({ subject, onRecordAnswer }) {
  const { vocab, answerWord, setMastered } = useVocab();
  const [queue, setQueue] = useState(() => buildQueue(vocab[subject]));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setQueue(buildQueue(vocab[subject]));
    setIdx(0);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const word = queue[idx] ?? null;

  const advance = () => {
    setFlipped(false);
    if (idx + 1 >= queue.length) {
      // Hết lượt: xây lại hàng đợi từ dữ liệu mới nhất
      setQueue(buildQueue(vocab[subject]));
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
  };

  if (!word) {
    return <p className="quiz-hint">Chưa có từ nào (hoặc tất cả đã được đánh dấu "Đã nhớ").</p>;
  }

  return (
    <div>
      <div className="flashcard-container">
        <button
          type="button"
          className={`flashcard${flipped ? ' flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? 'Lật về mặt trước' : 'Lật thẻ xem nghĩa'}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <h2 className="jp-text fc-word">{word.jp}</h2>
              <span
                role="button"
                tabIndex={0}
                className="btn btn-outline tts-btn fc-tts"
                aria-label="Đọc phát âm"
                onClick={(e) => {
                  e.stopPropagation();
                  speakJapanese(word.jp);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    speakJapanese(word.jp);
                  }
                }}
              >
                <IconVolume />
              </span>
              <p className="click-hint">Nhấn để lật thẻ</p>
            </div>
            <div className="flashcard-back">
              <h2 className="jp-text fc-kana">{word.kana}</h2>
              <h3 className="fc-meaning">{word.meaning}</h3>
              {(word.exJp || word.exVi) && (
                <div className="example-box">
                  {word.exJp && <p className="ex-jp jp-text">{word.exJp}</p>}
                  {word.exVi && <p className="ex-vi">{word.exVi}</p>}
                </div>
              )}
            </div>
          </div>
        </button>
      </div>
      <div className="fc-controls">
        <button
          type="button"
          className="btn btn-outline btn-forgot"
          onClick={() => {
            answerWord(subject, word.id, false);
            onRecordAnswer?.(false);
            advance();
          }}
        >
          <IconX /> Quên
        </button>
        <button
          type="button"
          className="btn btn-outline btn-remember"
          onClick={() => {
            answerWord(subject, word.id, true);
            onRecordAnswer?.(true);
            advance();
          }}
        >
          <IconCheck /> Nhớ
        </button>
        <button
          type="button"
          className="btn btn-outline btn-remember"
          onClick={() => {
            setMastered(subject, word.id, true);
            advance();
          }}
          title="Chuyển vào kho từ đã thuộc, không hỏi lại"
        >
          <IconStar /> Đã thuộc hẳn
        </button>
      </div>
    </div>
  );
}
