import { Fragment, useMemo, useState } from 'react';
import {
  EDITION_LABEL,
  TEXTBOOK_SUBJECTS,
  getChaptersOf,
  getDoc,
  getDocs,
  getEditions,
  pageCount,
} from '../../data/textbooks.js';
import { getSubjectProgress } from '../../lib/textbookProgress.js';
import { useVocab } from '../../context/VocabProvider.jsx';
import { useProgressVersion } from '../../hooks/useProgressVersion.js';
import { chapterWordCount, getChapterWords } from '../../lib/chapterVocab.js';
import { IconArrowLeft, IconBookOpen, IconFolder, IconLayers, IconTable } from '../icons.jsx';

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
                {empty
                  ? 'Chưa có giáo trình'
                  : `${s.chapterCount} chương · ${s.docCount} file${s.hasOldEdition ? ' · có cả bộ cũ' : ''}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Cấp 2 — thư mục con: các chương trong giáo trình của một môn. */
function ChapterList({ subjectId, onOpenChapter, onReviewChapterVocab }) {
  const { vocab } = useVocab();
  const version = useProgressVersion();
  const progress = useMemo(() => getSubjectProgress(subjectId), [subjectId, version]);
  const [sortByRate, setSortByRate] = useState(false);
  // Từ 9/2026 mỗi môn có hai bộ sách. Trộn cả hai vào một danh sách là hơn 130
  // dòng, tìm chương nào cũng mệt → mặc định mở bộ ĐANG HỌC (2025).
  const editions = getEditions(subjectId);
  const [edition, setEdition] = useState(() => (editions.includes('2025') ? '2025' : editions[0]));
  const chapters = getChaptersOf(subjectId, editions.length > 1 ? edition : undefined);

  const rows = useMemo(() => {
    if (!sortByRate) return chapters;
    // Ưu tiên ôn: chương hay ra đề lên trước; mục không có 出題率 xuống cuối
    return [...chapters].sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
  }, [chapters, sortByRate]);

  // Dải phân nhóm theo 章 để danh sách dài không thành một mảng phẳng khó định vị,
  // và hiện cả khi môn chỉ có MỘT file: nó còn mang nút ôn từ vựng
  // của trọn cả 章 (ロン 15/9: chương 4 bản 2025 chia 21 mục, ôn lắt nhắt từng
  // mục thì mệt). Chỉ ẩn khi đang xếp theo tỷ lệ ra đề — lúc đó các 章 trộn nhau
  // nên tiêu đề nhóm mất nghĩa.
  const showGroups = !sortByRate;

  /** Từ vựng của TRỌN một file giáo trình (một 章) — gộp mọi mục, bỏ trùng.
   *  Chỉ tính từ mà kho từ HIỆN CÓ, giống hệt nút trong màn đọc: nút không được
   *  hứa số từ rồi mở ra ít hơn. */
  const docVocab = useMemo(() => {
    const kho = new Set((vocab[subjectId] ?? []).map((w) => w.jp));
    const out = {};
    for (const c of chapters) {
      const cur = out[c.doc] ?? (out[c.doc] = new Set());
      for (const w of getChapterWords(subjectId, c.id)) if (kho.has(w)) cur.add(w);
    }
    return out;
  }, [chapters, subjectId, vocab]);

  return (
    <>
      <div className="chapter-toolbar">
        {editions.length > 1 && (
          <span className="edition-switch" role="group" aria-label="Chọn bộ giáo trình">
            {editions.map((e) => (
              <button
                key={e}
                type="button"
                className={`btn btn-outline btn-sm${edition === e ? ' is-on' : ''}`}
                onClick={() => setEdition(e)}
                aria-pressed={edition === e}
              >
                {EDITION_LABEL[e] ?? e}
              </button>
            ))}
          </span>
        )}
        {/* Bộ 2025 không có 出題率 nên nút xếp theo tỷ lệ vô nghĩa ở đó */}
        {chapters.some((c) => c.rate != null) && (
          <button
            type="button"
            className={`btn btn-outline btn-sm${sortByRate ? ' is-on' : ''}`}
            onClick={() => setSortByRate((v) => !v)}
            aria-pressed={sortByRate}
          >
            {sortByRate ? '↩ Thứ tự trong sách' : '▲ Xếp theo tỷ lệ ra đề'}
          </button>
        )}
      </div>
      <ul className="chapter-list">
        {rows.map((c, i) => {
          const Ico = KIND_ICON[c.kind] ?? IconBookOpen;
          const doc = getDoc(subjectId, c.doc);
          const read = progress[c.id]?.page;
          const total = pageCount(c);
          const nWords = chapterWordCount(subjectId, c.id);
          const readIdx = read != null ? Math.min(total, Math.max(1, read - c.start + 1)) : null;
          const newGroup = showGroups && (i === 0 || rows[i - 1].doc !== c.doc);
          return (
            <Fragment key={c.id}>
              {newGroup && doc && (
                <li className="chapter-group-head">
                  <span className="cgh-text">
                    <span className="cgh-jp">{doc.label}</span>
                    <span className="cgh-vi">{doc.labelVi}</span>
                  </span>
                  {onReviewChapterVocab && docVocab[doc.id]?.size > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-xs cgh-vocab"
                      onClick={() =>
                        onReviewChapterVocab(subjectId, [...docVocab[doc.id]], doc.label)
                      }
                    >
                      <IconLayers /> Ôn {docVocab[doc.id].size} từ cả chương
                    </button>
                  )}
                </li>
              )}
              <li>
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
                    {c.kind === 'chapter' && c.no && <span className="chapter-no">{c.no}</span>}
                    {c.titleJp}
                  </span>
                  <span className="chapter-vi">{c.titleVi}</span>
                  <span className="chapter-meta">
                    {/* Bộ 2025 chia hai tầng: nhóm lớn A./B./C. rồi mới tới mục */}
                    {c.grp && <><strong className="chapter-grp">{c.grp}</strong> · </>}
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
            </Fragment>
          );
        })}
      </ul>
    </>
  );
}

export default function TextbookLibrary({
  subjectId,
  onBack,
  onOpenSubject,
  onOpenChapter,
  onReviewChapterVocab,
}) {
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
        <ChapterList
          subjectId={subject.id}
          onOpenChapter={onOpenChapter}
          onReviewChapterVocab={onReviewChapterVocab}
        />
      ) : (
        <SubjectFolders onOpenSubject={onOpenSubject} />
      )}
    </section>
  );
}
