import { useEffect, useMemo, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { SUBJECTS } from '../../data/exams.js';
import { countDue } from '../../lib/srs.js';
import { isIOS, isStandalone } from '../../lib/platform.js';
import { resolveChapterKey, vocabChapterGroups } from '../../lib/chapterVocab.js';
import { KEYS, loadJSON, saveJSON, saveString } from '../../lib/storage.js';
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
export default function VocabModal({ onClose, initialSubject = 'kiso', backupSlot, onRecordAnswer, filter, onSetFilter, onClearFilter }) {
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

  // Chương của môn nào thì môn đó phải đang được chọn, kẻo thống kê/quiz lệch môn
  useEffect(() => {
    if (filter?.subject) setSubject(filter.subject);
  }, [filter?.subject]);

  // ロン 15/9: vào màn Từ vựng chỉ thấy chọn theo MÔN, tưởng không ôn theo chương
  // được — nút ôn theo chương trước đây chỉ nằm bên Giáo trình. Đặt luôn ô chọn
  // ở đây, gộp theo file giáo trình y như danh sách chương.
  const chapterGroups = useMemo(
    () => vocabChapterGroups(subject, vocab[subject] ?? []),
    [subject, vocab]
  );

  const pickChapter = (key) => {
    if (!key) {
      onClearFilter?.();
      return;
    }
    const hit = resolveChapterKey(subject, key, vocab[subject] ?? []);
    if (hit) onSetFilter?.({ subject, words: hit.words, label: hit.label, key });
  };

  // Từ nhắc góc màn hình (Cài đặt → Nhắc từ vựng định kỳ) lấy trong chương đang
  // lọc. Đặt nút ngay đây vì lúc chọn chương để ôn cũng là lúc muốn từ nhắc bám
  // theo (ロン 17/9); Cài đặt vẫn có ô chọn đầy đủ.
  const [reminderScope, setReminderScope] = useState(() => loadJSON(KEYS.reminderScope));
  const scopeIsThis =
    !!filter?.key && reminderScope?.subject === filter.subject && reminderScope?.key === filter.key;
  const toggleReminderScope = () => {
    const next = scopeIsThis ? null : { subject: filter.subject, key: filter.key, label: filter.label };
    saveJSON(KEYS.reminderScope, next);
    // Cho tick kế tiếp nhắc ngay một từ của chương mới, để thấy ngay là đã đổi
    saveString(KEYS.reminderLast, '0');
    setReminderScope(next);
  };

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
            <span className="vocab-filter-actions">
              {filter.key && (
                <button
                  type="button"
                  className={`btn btn-xs ${scopeIsThis ? 'btn-primary' : 'btn-outline'}`}
                  onClick={toggleReminderScope}
                  aria-pressed={scopeIsThis}
                  title="Từ vựng hiện ở góc màn hình theo chu kỳ (Cài đặt) chỉ lấy trong chương này"
                >
                  🔔 {scopeIsThis ? 'Đang nhắc theo chương này' : 'Nhắc từ theo chương này'}
                </button>
              )}
              <button type="button" className="btn btn-outline btn-xs" onClick={onClearFilter}>
                Ôn toàn bộ kho từ
              </button>
            </span>
          </div>
        )}

        {/* Hàng môn hiện cả khi đang lọc: ô chọn chương nằm ngay dưới nên phải
            đổi môn được, không thì muốn xem chương môn khác lại phải thoát ra. */}
        <div className="tab-row" role="tablist" aria-label="Chọn môn">
          {Object.values(SUBJECTS).map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={subject === s.id}
              className={`btn btn-sm ${subject === s.id ? 'btn-primary' : 'btn-outline'} jp-text`}
              onClick={() => {
                setSubject(s.id);
                if (filter) onClearFilter?.(); // bộ lọc của môn cũ không còn nghĩa
              }}
            >
              {s.nameJp}
            </button>
          ))}
        </div>

        {onSetFilter && chapterGroups.length > 0 && (
          <div className="vocab-chapter-pick">
            <label htmlFor="vocab-chapter">Ôn theo chương giáo trình</label>
            <select
              id="vocab-chapter"
              value={filter?.key ?? ''}
              onChange={(e) => pickChapter(e.target.value)}
            >
              <option value="">Cả kho từ — {stats.total} từ</option>
              {chapterGroups.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  <option value={g.key}>Cả {g.label} — {g.words.length} từ</option>
                  {g.items.map((it) => (
                    <option key={it.key} value={it.key}>
                      　{it.label} — {it.words.length} từ
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
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
