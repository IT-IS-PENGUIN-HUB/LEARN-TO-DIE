import { EXAMS, SUBJECTS, pdfUrl } from '../data/exams.js';
import AddWordForm from './vocab/AddWordForm.jsx';
import PdfViewer from './PdfViewer.jsx';
import PomodoroTimer from './PomodoroTimer.jsx';
import { IconArrowLeft } from './icons.jsx';

export default function ExamView({ subjectId, examId, onBack }) {
  const subject = SUBJECTS[subjectId];
  const exam = (EXAMS[subjectId] ?? []).find((e) => e.id === examId);
  if (!exam) return null;

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
          <PdfViewer url={pdfUrl(exam.pdfPath)} title={`Đề thi ${exam.year} ${subject.nameJp}`} />
        </div>
        <div className="right-panel sticky">
          <div className="side-panel">
            <PomodoroTimer />
            {/* Gặp từ mới trong đề → thêm ngay vào kho từ vựng của môn này */}
            <AddWordForm subject={subjectId} />
          </div>
        </div>
      </div>
    </section>
  );
}
