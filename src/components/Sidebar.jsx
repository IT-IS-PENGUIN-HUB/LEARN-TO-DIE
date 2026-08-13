import { useMemo } from 'react';
import { BANK_TOTAL } from '../data/examBank.js';
import { computeRank } from '../lib/rank.js';
import logoUrl from '../assets/logo.png';

/**
 * Cột điều hướng trái (GĐ6b — mock đã được ロン duyệt): desktop đứng cố định,
 * mobile là ngăn kéo mở bằng ☰. Các module giữ nguyên ruột — đây chỉ là vỏ
 * điều hướng để khỏi phải quay về trang chủ mỗi lần đổi module.
 */
export default function Sidebar({
  view, examState, dueTotal, open, collapsed, onToggleCollapse,
  onGoHome, onOpenPractice, onOpenTextbooks, onOpenVocab, onOpenSchedule, onClose,
}) {
  const wrongCount = useMemo(
    () => Object.values(examState.srs ?? {}).filter((e) => (e.wrong ?? 0) > 0 && !e.mastered).length,
    [examState]
  );
  const bookmarkCount = useMemo(
    () => Object.values(examState.bookmarks ?? {}).filter((b) => b?.on).length,
    [examState]
  );
  const rank = useMemo(() => computeRank(examState, BANK_TOTAL), [examState]);

  // Bấm mục nào cũng đóng ngăn kéo (mobile) rồi mới điều hướng
  const go = (fn) => () => {
    fn();
    onClose?.();
  };

  const practiceSub = view.name === 'practice' ? view.sub?.screen ?? 'home' : null;
  const item = (label, opts) => (
    <button
      type="button"
      className={`sb-item${opts.on ? ' is-on' : ''}`}
      onClick={opts.go}
      title={label}
    >
      <span className="sb-ic">{opts.ic}</span>
      <span className="sb-label">{label}</span>
      {opts.badge != null && <span className={`sb-cnt${opts.hot ? ' is-hot' : ''}`}>{opts.badge}</span>}
    </button>
  );

  return (
    <aside
      className={`sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}
      aria-label="Điều hướng"
    >
      {/* Nút thu gọn ‹ / › như app trung tâm — chỉ hiện trên desktop */}
      <button
        type="button"
        className="sb-collapse"
        onClick={onToggleCollapse}
        title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        aria-expanded={!collapsed}
      >
        {collapsed ? '›' : '‹'}
      </button>
      {/* Chỉ LOGO — phần chữ nằm bên header để hai bên không lặp nhau (ロン chốt 14/8) */}
      <button type="button" className="sb-brand" onClick={go(onGoHome)} title="GIVE UP IS LOSE — Về trang chủ">
        <img src={logoUrl} alt="GIVE UP IS LOSE" className="sb-logo" width="51" height="51" />
      </button>

      <div className="sb-group">Học</div>
      {item('Trang chủ', { ic: '◧', on: view.name === 'home', go: go(onGoHome) })}
      {item('Đề thi', {
        ic: '▤', on: practiceSub === 'home', badge: BANK_TOTAL,
        go: go(() => onOpenPractice({ screen: 'home' })),
      })}
      {item('Giáo trình', { ic: '▦', on: view.name === 'textbook', go: go(onOpenTextbooks) })}
      {item('Từ vựng', { ic: '▩', badge: dueTotal > 0 ? dueTotal : null, hot: true, go: go(onOpenVocab) })}
      {item('Lịch học', { ic: '▣', on: view.name === 'schedule', go: go(onOpenSchedule) })}

      <div className="sb-group">Luyện thi</div>
      {item('Thi thử', {
        ic: '◔', go: go(() => onOpenPractice({ screen: 'home', focus: 'mock' })),
      })}
      {item('Câu sai', {
        ic: '↺', badge: wrongCount || null,
        on: practiceSub === 'browse' && view.sub?.tab === 'wrong',
        go: go(() => onOpenPractice({ screen: 'browse', tab: 'wrong' })),
      })}
      {item('Đánh dấu', {
        ic: '⚑', badge: bookmarkCount || null,
        on: practiceSub === 'browse' && view.sub?.tab === 'marked',
        go: go(() => onOpenPractice({ screen: 'browse', tab: 'marked' })),
      })}

      <div className="sb-group">Ghi nhận</div>
      {item('Thống kê', {
        ic: '◫', on: practiceSub === 'stats',
        go: go(() => onOpenPractice({ screen: 'stats' })),
      })}

      {rank && (
        <button type="button" className="sb-rank" onClick={go(() => onOpenPractice({ screen: 'stats' }))}>
          <b>{rank.label}</b>
          <span>{rank.missing ? `còn: ${rank.missing[0]}` : 'hạng cao nhất 🏆'}</span>
        </button>
      )}
    </aside>
  );
}
