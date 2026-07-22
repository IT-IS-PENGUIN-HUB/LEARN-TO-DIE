import { useVocab } from '../../context/VocabProvider.jsx';

export default function MasteredList({ subject }) {
  const { vocab, setMastered } = useVocab();
  const mastered = vocab[subject].filter((w) => w.mastered);

  if (!mastered.length) {
    return <p className="mastered-hint">Chưa có từ nào trong kho "Đã nhớ" của môn này.</p>;
  }

  return (
    <div className="mastered-container">
      <p className="mastered-hint">⭐ Kho từ đã nhớ — nhấn vào một từ để đưa nó quay lại vòng ôn tập</p>
      <div className="mastered-list">
        {mastered.map((w) => (
          <button
            key={w.id}
            type="button"
            className="mastered-item"
            onClick={() => setMastered(subject, w.id, false)}
            title="Đưa từ này quay lại vòng ôn tập"
          >
            <span className="m-jp">{w.jp}</span>
            <span className="m-kana">{w.kana}</span>
            <span className="m-meaning">{w.meaning}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
