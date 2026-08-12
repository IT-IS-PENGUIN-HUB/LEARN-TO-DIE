import { useEffect, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { SUBJECTS } from '../../data/exams.js';
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

export default function VocabModal({ onClose, initialSubject = 'kiso', backupSlot, onRecordAnswer }) {
  const { statsFor } = useVocab();
  const [subject, setSubject] = useState(initialSubject);
  // Quiz là tính năng dùng nhiều nhất → mặc định
  const [mode, setMode] = useState('quiz');
  // Từ cần tìm sẵn khi nhảy từ cảnh báo trùng sang tab Kho từ
  const [managerQuery, setManagerQuery] = useState('');

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

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Luyện từ vựng" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
          <IconX />
        </button>
        <h2>Luyện từ vựng</h2>

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

        <div className="tab-row" role="tablist" aria-label="Chế độ luyện tập">
          {MODES.map((m) => (
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
            Tổng: <strong>{stats.total}</strong>
          </span>
          <span className="stat-mastered">
            Đã nhớ: <strong>{stats.mastered}</strong>
          </span>
          <span className="stat-due">
            Cần ôn: <strong>{stats.due}</strong>
          </span>
        </div>

        {mode === 'quiz' && <QuizMode subject={subject} onRecordAnswer={onRecordAnswer} />}
        {mode === 'flashcard' && <FlashcardMode subject={subject} onRecordAnswer={onRecordAnswer} />}
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
