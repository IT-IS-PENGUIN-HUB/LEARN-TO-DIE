import { Suspense, lazy, useCallback, useMemo } from 'react';
import { getChapter, getChapters, getDoc, pageCount } from '../../data/textbooks.js';
import { pdfUrl } from '../../data/exams.js';
import { getProgress, saveProgress } from '../../lib/textbookProgress.js';
import { getChapterWords } from '../../lib/chapterVocab.js';
import { useVocab } from '../../context/VocabProvider.jsx';
import AddWordForm from '../vocab/AddWordForm.jsx';
import PomodoroTimer from '../PomodoroTimer.jsx';
import { IconArrowLeft, IconArrowRight, IconLayers } from '../icons.jsx';

// PDF.js nặng ~400KB → chỉ tải khi thực sự mở giáo trình
const PdfViewer = lazy(() => import('../PdfViewer.jsx'));

export default function TextbookReader({ subjectId, chapterId, onBack, onOpenChapter, onReviewChapterVocab }) {
  const { vocab } = useVocab();
  const chapter = getChapter(subjectId, chapterId);
  const chapters = getChapters(subjectId);
  const idx = chapters.findIndex((c) => c.id === chapterId);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

  // Đọc tiếp đúng trang lần trước — tính một lần cho mỗi chương, không đổi khi đang lật trang
  const resumePage = useMemo(() => {
    if (!chapter) return undefined;
    const saved = getProgress(subjectId, chapterId);
    if (saved == null) return undefined;
    return saved >= chapter.start && saved <= chapter.end ? saved : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, chapterId]);

  const onReportPage = useCallback(
    (page) => saveProgress(subjectId, chapterId, page),
    [subjectId, chapterId]
  );

  // Chỉ tính những từ của chương mà kho từ HIỆN CÓ — nút không được hứa số từ
  // rồi mở ra ít hơn (từ có thể đã bị xoá sau khi bảng ánh xạ được sinh).
  const chapterVocab = useMemo(() => {
    const inChapter = new Set(getChapterWords(subjectId, chapterId));
    return (vocab[subjectId] ?? []).filter((w) => inChapter.has(w.jp)).map((w) => w.jp);
  }, [subjectId, chapterId, vocab]);

  if (!chapter) return null;
  const doc = getDoc(subjectId, chapter.doc);
  if (!doc) return null;
  const chapterLabel = chapter.kind === 'chapter' ? `${chapter.no} ${chapter.titleJp}` : chapter.titleJp;

  return (
    <section className="question-view container">
      <div className="question-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Danh sách chương
        </button>
        <h3>
          {chapter.kind === 'chapter' && <span className="chapter-no">{chapter.no}</span>}
          {chapter.titleJp}
        </h3>
        {chapter.rate != null && (
          <span className="rate-badge rate-inline" title="出題率 — tỷ lệ kỳ thi có ra chương này">
            出題率 {chapter.rate}%
          </span>
        )}
      </div>
      <p className="chapter-subtitle">
        {chapter.titleVi} — {pageCount(chapter)} trang · {doc.label}
        {resumePage != null && <> · đọc tiếp từ trang {resumePage - chapter.start + 1}</>}
      </p>

      <div className="layout-70-30">
        <div className="left-panel">
          <Suspense
            fallback={<p className="pdf-status" style={{ color: 'var(--text-muted)' }}>Đang tải trình xem PDF…</p>}
          >
            <PdfViewer
              url={pdfUrl(doc.path)}
              title={`${chapter.titleJp} — ${doc.label}`}
              pageStart={chapter.start}
              pageEnd={chapter.end}
              initialPage={resumePage}
              wholeFile
              onReportPage={onReportPage}
              addWordSubject={subjectId}
            />
          </Suspense>

          {chapterVocab.length > 0 && (
            <button
              type="button"
              className="btn btn-primary chapter-vocab-btn"
              onClick={() => onReviewChapterVocab(subjectId, chapterVocab, chapterLabel)}
            >
              <IconLayers /> Ôn {chapterVocab.length} từ vựng của chương này
            </button>
          )}

          <div className="chapter-nav">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => prev && onOpenChapter(prev.id)}
              disabled={!prev}
            >
              <IconArrowLeft /> {prev ? prev.titleJp : 'Đầu sách'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => next && onOpenChapter(next.id)}
              disabled={!next}
            >
              {next ? next.titleJp : 'Cuối sách'} <IconArrowRight />
            </button>
          </div>
        </div>

        <div className="right-panel sticky">
          <div className="side-panel">
            <PomodoroTimer />
            {/* Gặp từ mới trong giáo trình → thêm thẳng vào kho từ của môn này */}
            <AddWordForm subject={subjectId} />
          </div>
        </div>
      </div>
    </section>
  );
}
