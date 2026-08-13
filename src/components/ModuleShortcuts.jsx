import { useMemo } from 'react';
import { getChapter } from '../data/textbooks.js';
import { getLastRead } from '../lib/textbookProgress.js';
import { useProgressVersion } from '../hooks/useProgressVersion.js';
import { SUBJECTS } from '../data/exams.js';
import { SCHEDULE_IMAGES } from '../lib/schedule.js';
import { IconBookOpen, IconCalendar } from './icons.jsx';

/** Hai lối tắt trên trang chủ: giáo trình và lịch học (menu trên cùng bị ẩn ở điện thoại). */
export default function ModuleShortcuts({ onOpenTextbooks, onOpenSchedule, onResume }) {
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
      <button type="button" className="module-card" onClick={onOpenTextbooks}>
        <span className="module-icon">
          <IconBookOpen />
        </span>
        <span className="module-body">
          <strong>教科書 — Giáo trình</strong>
          <span className="module-sub">Bài giảng của lớp, chia theo chương</span>
        </span>
      </button>

      <button type="button" className="module-card" onClick={onOpenSchedule}>
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
