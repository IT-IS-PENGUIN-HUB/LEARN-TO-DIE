import { useMemo, useState } from 'react';
import {
  TEXTBOOK_SUBJECTS,
  getChapters,
  getDoc,
  pageCount,
} from '../../data/textbooks.js';
import { getSubjectProgress } from '../../lib/textbookProgress.js';
import { useProgressVersion } from '../../hooks/useProgressVersion.js';
import { chapterWordCount } from '../../lib/chapterVocab.js';
import { IconArrowLeft, IconBookOpen, IconFolder, IconTable } from '../icons.jsx';

const KIND_ICON = { trend: IconTable, appendix: IconBookOpen, chapter: IconBookOpen };

/** Màu nhãn 出題率: càng hay ra đề càng nổi. */
function rateClass(rate) {
  if (rate == null) return '';
  if (rate >= 80) return 'rate-high';
  if (rate >= 50) return 'rate-mid';
  return 'rate-low';
}

/** Cấp 1 — thư mục cha: 3 môn. */
function SubjectFolders({ onOpenSubject }) {
  return (
    <div className="folder-grid">
      {TEXTBOOK_SUBJECTS.map((s) => {
        const empty = s.chapterCount === 0;
        return (
          <button
            key={s.id}
            type="button"
            className={`folder-card${empty ? ' is-empty' : ''}`}
            onClick={() => !empty && onOpenSubject(s.id)}
            disabled={empty}
            aria-label={`${s.nameJp} — ${empty ? 'chưa có giáo trình' : `${s.chapterCount} chương`}`}
          >
            <span className="folder-icon">
              <IconFolder />
            </span>
            <span className="folder-body">
              <strong>{s.nameJp}</strong>
              <span className="folder-sub">
                {empty ? 'Chưa có giáo trình' : `${s.chapterCount} chương · ${s.docCount} file`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Cấp 2 — thư mục con: các chương trong giáo trình của một môn. */
function ChapterList({ subjectId, onOpenChapter }) {
  const chapters = getChapters(subjectId);
  const version = useProgressVersion();
  const progress = useMemo(() => getSubjectProgress(subjectId), [subjectId, version]);
  const [sortByRate, setSortByRate] = useState(false);

  const rows = useMemo(() => {
    if (!sortByRate) return chapters;
    // Ưu tiên ôn: chương hay ra đề lên trước; mục không có 出題率 xuống cuối
    return [...chapters].sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
  }, [chapters, sortByRate]);

  return (
    <>
      <div className="chapter-toolbar">
        <button
          type="button"
          className={`btn btn-outline btn-sm${sortByRate ? ' is-on' : ''}`}
          onClick={() => setSortByRate((v) => !v)}
          aria-pressed={sortByRate}
        >
          {sortByRate ? '↩ Thứ tự trong sách' : '▲ Xếp theo tỷ lệ ra đề'}
        </button>
      </div>
      <ul className="chapter-list">
        {rows.map((c) => {
          const Ico = KIND_ICON[c.kind] ?? IconBookOpen;
          const doc = getDoc(subjectId, c.doc);
          const read = progress[c.id]?.page;
          const total = pageCount(c);
          const nWords = chapterWordCount(subjectId, c.id);
          const readIdx = read != null ? Math.min(total, Math.max(1, read - c.start + 1)) : null;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`chapter-row kind-${c.kind}`}
                onClick={() => onOpenChapter(c.id)}
              >
                <span className="chapter-icon">
                  <Ico />
                </span>
                <span className="chapter-body">
                  <span className="chapter-title">
                    {c.kind === 'chapter' && <span className="chapter-no">{c.no}</span>}
                    {c.titleJp}
                  </span>
                  <span className="chapter-vi">{c.titleVi}</span>
                  <span className="chapter-meta">
                    {total} trang
                    {doc && <> · {doc.label}</>}
                    {nWords > 0 && <> · {nWords} từ vựng</>}
                    {readIdx != null && (
                      <>
                        {' '}
                        · <em className="chapter-resume">đang đọc tr. {readIdx}/{total}</em>
                      </>
                    )}
                  </span>
                </span>
                {c.rate != null && (
                  <span className={`rate-badge ${rateClass(c.rate)}`} title="出題率 — tỷ lệ kỳ thi có ra chương này">
                    {c.rate}%
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function TextbookLibrary({ subjectId, onBack, onOpenSubject, onOpenChapter }) {
  const subject = subjectId ? TEXTBOOK_SUBJECTS.find((s) => s.id === subjectId) : null;

  return (
    <section className="exam-list-container container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> {subject ? 'Danh sách môn' : 'Trang chủ'}
        </button>
        <h2>{subject ? `教科書 — ${subject.nameJp}` : '教科書 — Giáo trình'}</h2>
        <span className="section-note">
          {subject ? subject.nameVi : 'Bài giảng của lớp, chia theo chương'}
        </span>
      </div>

      {subject ? (
        <ChapterList subjectId={subject.id} onOpenChapter={onOpenChapter} />
      ) : (
        <SubjectFolders onOpenSubject={onOpenSubject} />
      )}
    </section>
  );
}
