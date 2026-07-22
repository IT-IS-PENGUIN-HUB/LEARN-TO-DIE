import { useMemo, useState } from 'react';
import { EXAMS, SUBJECTS } from '../data/exams.js';
import { IconArrowLeft } from './icons.jsx';

export default function ExamList({ subjectId, onBack, onOpenExam }) {
  const [yearFilter, setYearFilter] = useState('all');
  const subject = SUBJECTS[subjectId];
  const exams = EXAMS[subjectId] ?? [];

  const filtered = useMemo(
    () => (yearFilter === 'all' ? exams : exams.filter((e) => e.id === yearFilter)),
    [exams, yearFilter]
  );

  return (
    <section className="exam-list-container container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Quay lại
        </button>
        <h2>{subject.nameJp}</h2>
        <select
          className="dropdown"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          aria-label="Lọc theo năm"
        >
          <option value="all">Tất cả các năm</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.year}
            </option>
          ))}
        </select>
      </div>
      <div className="exam-grid">
        {filtered.map((exam) => (
          <button
            key={exam.id}
            type="button"
            className="exam-card"
            onClick={() => onOpenExam(exam.id)}
            aria-label={`Mở đề ${exam.year}, ${exam.qCount} câu hỏi`}
          >
            <h3>{exam.year}</h3>
            <p>{exam.qCount} câu hỏi — PDF đề gốc</p>
          </button>
        ))}
      </div>
    </section>
  );
}
