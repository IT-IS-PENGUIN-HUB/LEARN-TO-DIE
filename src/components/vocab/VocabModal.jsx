import { useEffect, useMemo, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { SUBJECTS } from '../../data/exams.js';
import { countDue } from '../../lib/srs.js';
import { isIOS, isStandalone } from '../../lib/platform.js';
import AddWordForm from './AddWordForm.jsx';
import FlashcardMode from './FlashcardMode.jsx';
import MasteredList from './MasteredList.jsx';
import QuizMode from './QuizMode.jsx';
import ScanImport from './ScanImport.jsx';
import VocabManager from './VocabManager.jsx';
import { IconInfo, IconShare, IconX } from '../icons.jsx';

const MODES = [
  { id: 'quiz', label: 'Quiz' },
  { id: 'flashcard', label: 'Flashcard' },
  { id: 'add', label: '+ Thêm từ' },
  { id: 'scan', label: '📷 Quét ảnh' },
  { id: 'manage', label: '🗂 Kho từ' },
  { id: 'mastered', label: '⭐ Đã nhớ' },
];

/**
 * filter (tuỳ chọn): {subject, words: string[], label} — chỉ ôn các từ của một
 * chương giáo trình. Lúc đó chỉ hiện Quiz + Flashcard; các tab còn lại (thêm từ,
 * quét ảnh, kho từ) không hợp với việc lọc nên ẩn đi.
 */
export default function VocabModal({ onClose, initialSubject = 'kiso', backupSlot, onRecordAnswer, filter, onClearFilter }) {
  const { statsFor, vocab } = useVocab();
  const [subject, setSubject] = useState(filter?.subject ?? initialSubject);
  // Quiz là tính năng dùng nhiều nhất → mặc định
  const [mode, setMode] = useState('quiz');
  // Từ cần tìm sẵn khi nhảy từ cảnh báo trùng sang tab Kho từ
  const [managerQuery, setManagerQuery] = useState('');

  // Danh sách từ thật (object) ứng với các chuỗi jp trong bộ lọc
  const pool = useMemo(() => {
    if (!filter) return null;
    const want = new Set(filter.words);
    return (vocab[filter.subject] ?? []).filter((w) => want.has(w.jp));
  }, [filter, vocab]);

  const activeModes = filter ? MODES.filter((m) => m.id === 'quiz' || m.id === 'flashcard') : MODES;
  useEffect(() => {
    if (filter && mode !== 'quiz' && mode !== 'flashcard') setMode('quiz');
  }, [filter, mode]);

  const openInManager = (word) => {
    setSubject(word.subject ?? subject);
    setManagerQuery(word.jp);
    setMode('manage');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stats = statsFor(subject);
  // Đang lọc theo chương thì thống kê phải tính trên đúng số từ đang ôn
  const shown = pool
    ? {
        total: pool.length,
        mastered: pool.filter((w) => w.mastered).length,
        due: countDue(pool),
      }
    : stats;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Luyện từ vựng" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
          <IconX />
        </button>
        <h2>Luyện từ vựng</h2>

        {filter && (
          <div className="vocab-filter-bar">
            <span>
              Chỉ ôn <strong>{pool.length} từ</strong> của chương{' '}
              <strong className="jp-text">{filter.label}</strong>
            </span>
            <button type="button" className="btn btn-outline btn-xs" onClick={onClearFilter}>
              Ôn toàn bộ kho từ
            </button>
          </div>
        )}

        {!filter && (
          <div className="tab-row" role="tablist" aria-label="Chọn môn">
            {Object.values(SUBJECTS).map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={subject === s.id}
                className={`btn btn-sm ${subject === s.id ? 'btn-primary' : 'btn-outline'} jp-text`}
                onClick={() => setSubject(s.id)}
              >
                {s.nameJp}
              </button>
            ))}
          </div>
        )}

        <div className="tab-row" role="tablist" aria-label="Chế độ luyện tập">
          {activeModes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              className={`btn btn-sm ${mode === m.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setManagerQuery(''); // bấm tab thủ công thì không giữ ô tìm kiếm cũ
                setMode(m.id);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="vocab-stats">
          <span>
            Tổng: <strong>{shown.total}</strong>
          </span>
          <span className="stat-mastered">
            Đã nhớ: <strong>{shown.mastered}</strong>
          </span>
          <span className="stat-due">
            Cần ôn: <strong>{shown.due}</strong>
          </span>
        </div>

        {mode === 'quiz' && <QuizMode subject={subject} onRecordAnswer={onRecordAnswer} pool={pool} />}
        {mode === 'flashcard' && <FlashcardMode subject={subject} onRecordAnswer={onRecordAnswer} pool={pool} />}
        {mode === 'add' && <AddWordForm subject={subject} onOpenInManager={openInManager} />}
        {mode === 'scan' && <ScanImport subject={subject} />}
        {mode === 'manage' && <VocabManager subject={subject} initialQuery={managerQuery} />}
        {mode === 'mastered' && <MasteredList subject={subject} />}

        {backupSlot}

        {isIOS && !isStandalone && (
          <div className="ios-hint">
            <p>
              <IconInfo /> <strong>Mẹo cho iPhone:</strong> Nhấn <IconShare /> rồi chọn{' '}
              <strong>"Thêm vào MH chính"</strong> để dùng như app thật và học offline trên tàu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
