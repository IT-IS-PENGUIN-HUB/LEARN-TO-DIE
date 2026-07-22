import { useEffect, useState } from 'react';
import { EXAMS, SUBJECTS, pdfUrl } from '../data/exams.js';
import PomodoroTimer from './PomodoroTimer.jsx';
import { IconArrowLeft, IconExpand, IconX } from './icons.jsx';

// Phase 6 sẽ thay iframe bằng PDF.js viewer (tốt hơn hẳn trên iOS).
export default function ExamView({ subjectId, examId, onBack }) {
  const subject = SUBJECTS[subjectId];
  const exam = (EXAMS[subjectId] ?? []).find((e) => e.id === examId);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  if (!exam) return null;
  const url = pdfUrl(exam.pdfPath);

  return (
    <section className="question-view container">
      <div className="question-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Danh sách đề
        </button>
        <h3>
          {exam.id} {subject.nameJp}
        </h3>
      </div>
      <div className="layout-70-30">
        <div className="left-panel">
          <div className="pdf-toolbar">
            <span />
            <button type="button" className="btn btn-outline btn-xs" onClick={() => setFullscreen(true)}>
              <IconExpand /> Toàn màn hình
            </button>
          </div>
          <iframe className="pdf-frame" src={url} title={`Đề thi ${exam.year} ${subject.nameJp}`} />
        </div>
        <div className="right-panel sticky">
          <div className="side-panel">
            <PomodoroTimer />
            {/* Quick-add từ vựng sẽ gắn ở Phase 5/6 */}
          </div>
        </div>
      </div>

      {fullscreen && (
        <div className="pdf-fullscreen-overlay" role="dialog" aria-label="PDF toàn màn hình">
          <div className="pdf-fullscreen-bar">
            <span>
              Nhấn <kbd>Esc</kbd> để thoát
            </span>
            <button type="button" className="btn-danger" onClick={() => setFullscreen(false)}>
              <IconX /> Đóng
            </button>
          </div>
          <div className="pdf-fullscreen-body">
            <iframe className="pdf-frame" src={url} title={`Đề thi ${exam.year} (toàn màn hình)`} />
          </div>
        </div>
      )}
    </section>
  );
}
