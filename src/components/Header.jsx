import { SUBJECTS } from '../data/exams.js';
import { IconBook, IconGear, IconMoon, IconSun } from './icons.jsx';

export default function Header({ theme, onToggleTheme, onSelectSubject, onOpenVocab, onOpenSettings, dueCount = 0 }) {
  return (
    <header className="header">
      <div className="logo">GIVE UP IS LOSE</div>
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
        <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="Cài đặt" title="Cài đặt">
          <IconGear />
        </button>
        <button type="button" className="icon-btn action-btn" onClick={onOpenVocab}>
          <IconBook /> Từ vựng
          {dueCount > 0 && (
            <span className="due-badge" aria-label={`${dueCount} từ cần ôn`}>
              {dueCount > 99 ? '99+' : dueCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
