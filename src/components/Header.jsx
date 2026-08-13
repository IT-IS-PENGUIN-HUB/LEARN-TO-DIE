import { SUBJECTS } from '../data/exams.js';
import { IconBook, IconBookOpen, IconCalendar, IconGear, IconMoon, IconSun } from './icons.jsx';
// Logo tròn cắt từ logo/logo.png bằng scripts/build_logo.py (đổi logo thì chạy lại script)
import logoUrl from '../assets/logo.png';

export default function Header({
  theme,
  onToggleTheme,
  onSelectSubject,
  onOpenVocab,
  onOpenSettings,
  onOpenTextbooks,
  onOpenSchedule,
  onGoHome,
  onOpenMenu,
  dueCount = 0,
}) {
  return (
    <header className="header">
      {/* ☰ chỉ hiện trên mobile (<900px) — mở ngăn kéo điều hướng */}
      <button type="button" className="menu-btn" onClick={onOpenMenu} aria-label="Mở menu">☰</button>
      {/* Logo + chữ chung MỘT nút — bấm đâu trong vùng này cũng về trang chủ
          (khác app trung tâm, ロン yêu cầu 14/8) */}
      <button type="button" className="logo" onClick={onGoHome} title="Về trang chủ" aria-label="Về trang chủ">
        <img className="logo-img" src={logoUrl} alt="" width="53" height="53" />
        GIVE UP IS LOSE
      </button>
      <nav className="main-menu" aria-label="Chọn môn thi">
        {Object.values(SUBJECTS).map((s) => (
          <button key={s.id} type="button" onClick={() => onSelectSubject(s.id)}>
            {s.nameJp}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          title="Đổi giao diện"
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenTextbooks}
          aria-label="Giáo trình"
          title="教科書 — Giáo trình"
        >
          <IconBookOpen />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSchedule}
          aria-label="Lịch học"
          title="スケジュール — Lịch học"
        >
          <IconCalendar />
        </button>
        <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="Cài đặt" title="Cài đặt">
          <IconGear />
        </button>
        <button
          type="button"
          className="icon-btn action-btn"
          onClick={onOpenVocab}
          title={dueCount > 0
            ? `Từ vựng — ${dueCount} từ ĐẾN HẠN ÔN hôm nay theo lịch SRS (không phải tổng kho)`
            : 'Từ vựng'}
        >
          <IconBook /> <span className="btn-label">Từ vựng</span>
          {dueCount > 0 && (
            <span className="due-badge" aria-label={`${dueCount} từ đến hạn ôn hôm nay`}>
              {dueCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
