import { useCallback, useEffect, useState } from 'react';
import { useVocab } from '../context/VocabProvider.jsx';
import { KEYS, loadJSON, loadString, saveJSON, saveString } from '../lib/storage.js';
import { speakJapanese } from '../services/tts.js';
import { IconCalendar, IconRefresh, IconVolume } from './icons.jsx';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WordOfTheDay({ onOpenVocab }) {
  const { allWords, dueTotal } = useVocab();
  const [word, setWord] = useState(null);

  const pickNew = useCallback(() => {
    const pool = allWords.filter((w) => !w.mastered);
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setWord(next);
    saveString(KEYS.wotdDate, todayKey());
    saveJSON(KEYS.wotdData, next);
  }, [allWords]);

  useEffect(() => {
    if (word) return;
    const savedDate = loadString(KEYS.wotdDate);
    const saved = loadJSON(KEYS.wotdData);
    if (savedDate === todayKey() && saved?.jp) {
      setWord(saved);
    } else if (allWords.length) {
      pickNew();
    }
  }, [word, allWords, pickNew]);

  if (!word) return null;

  return (
    <div className="wotd-card">
      <button type="button" className="wotd-next" onClick={pickNew} aria-label="Đổi từ khác" title="Đổi từ khác">
        <IconRefresh />
      </button>
      <h3 className="wotd-label">
        <IconCalendar /> Từ vựng hôm nay
      </h3>
      <div className="wotd-word-row">
        <h2 className="jp-text wotd-jp">{word.jp}</h2>
        <button
          type="button"
          className="btn btn-outline tts-btn"
          onClick={() => speakJapanese(word.jp)}
          aria-label="Đọc phát âm"
        >
          <IconVolume />
        </button>
      </div>
      <p className="wotd-kana">{word.kana}</p>
      <p className="wotd-meaning">{word.meaning}</p>
      {dueTotal > 0 && (
        <button type="button" className="due-reminder" onClick={onOpenVocab}>
          📚 Hôm nay có <strong>&nbsp;{dueTotal}&nbsp;</strong> từ cần ôn — bắt đầu ngay
        </button>
      )}
    </div>
  );
}
