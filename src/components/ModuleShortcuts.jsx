import { useMemo } from 'react';
import { getChapter } from '../data/textbooks.js';
import { getLastRead } from '../lib/textbookProgress.js';
import { useProgressVersion } from '../hooks/useProgressVersion.js';
import { SUBJECTS } from '../data/exams.js';
import { SCHEDULE_IMAGES } from '../lib/schedule.js';
import { IconBookOpen, IconCalendar, IconTable } from './icons.jsx';
import { BANK_TOTAL, EXAM_YEARS } from '../data/examBank.js';

/** Lối tắt trên trang chủ: đề thi, giáo trình, lịch học (menu trên cùng bị ẩn ở điện thoại). */
export default function ModuleShortcuts({ onOpenTextbooks, onOpenSchedule, onResume, onOpenPractice }) {
  // Đổi khi vừa kéo tiến độ từ GitHub về → "Đọc tiếp" trỏ đúng chương máy kia vừa đọc
  const version = useProgressVersion();
  // Chương đang đọc dở — mở app trên tàu là bấm một nút đọc tiếp ngay
  const resume = useMemo(() => {
    const last = getLastRead();
    if (!last) return null;
    const chapter = getChapter(last.subjectId, last.chapterId);
    if (!chapter) return null;
    return { ...last, chapter, subject: SUBJECTS[last.subjectId] };
  }, [version]);

  return (
    <div className="module-grid">
      <button type="button" className="module-card module-practice" onClick={onOpenPractice}>
        <span className="module-icon">
          <IconTable />
        </span>
        <span className="module-body">
          {/* strong dùng --font-jp (không có glyph ệ/ề tiếng Việt) → phần Việt để ở sub */}
          <strong>問題演習</strong>
          <span className="module-sub">
            Luyện đề — {BANK_TOTAL} câu song ngữ · {EXAM_YEARS.length} năm, có lời giải
          </span>
        </span>
      </button>

      <button type="button" className="module-card module-textbook" onClick={onOpenTextbooks}>
        <span className="module-icon">
          <IconBookOpen />
        </span>
        <span className="module-body">
          <strong>教科書 — Giáo trình</strong>
          <span className="module-sub">Bài giảng của lớp, chia theo chương</span>
        </span>
      </button>

      <button type="button" className="module-card module-schedule" onClick={onOpenSchedule}>
        <span className="module-icon">
          <IconCalendar />
        </span>
        <span className="module-body">
          <strong>スケジュール — Lịch học</strong>
          <span className="module-sub">
            {SCHEDULE_IMAGES.length > 0 ? `${SCHEDULE_IMAGES.length} đợt` : 'Chưa có ảnh'}
          </span>
        </span>
      </button>

      {resume && (
        <button
          type="button"
          className="module-card module-resume"
          onClick={() => onResume(resume.subjectId, resume.chapterId)}
        >
          <span className="module-icon">
            <IconBookOpen />
          </span>
          <span className="module-body">
            <strong>Đọc tiếp</strong>
            <span className="module-sub">
              {resume.subject?.nameJp} · {resume.chapter.titleJp}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
