import { useEffect, useState } from 'react';
import { SCHEDULE_IMAGES } from '../lib/schedule.js';
import { IconArrowLeft, IconExpand, IconX } from './icons.jsx';

/** Xem to một ảnh lịch: chạm để phóng, kéo/vuốt để di chuyển, Esc để đóng. */
function Lightbox({ item, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // Khoá cuộn nền để vuốt ảnh không kéo theo cả trang
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="schedule-lightbox" role="dialog" aria-modal="true" aria-label={item.label}>
      <div className="schedule-lightbox-bar">
        <strong>{item.label}</strong>
        <span className="schedule-lightbox-actions">
          <button type="button" className="btn btn-outline btn-xs" onClick={() => setZoomed((z) => !z)}>
            {zoomed ? 'Vừa màn hình' : 'Phóng to'}
          </button>
          <button type="button" className="btn btn-outline btn-xs" onClick={onClose} aria-label="Đóng">
            <IconX /> Đóng
          </button>
        </span>
      </div>
      <div className={`schedule-lightbox-scroll${zoomed ? ' is-zoomed' : ''}`}>
        <img
          src={item.url}
          alt={`Lịch học ${item.label}`}
          onClick={() => setZoomed((z) => !z)}
        />
      </div>
    </div>
  );
}

export default function ScheduleView({ onBack }) {
  const [open, setOpen] = useState(null);

  return (
    <section className="exam-list-container container">
      <div className="section-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <IconArrowLeft /> Trang chủ
        </button>
        <h2>スケジュール — Lịch học</h2>
        <span className="section-note">{SCHEDULE_IMAGES.length} đợt</span>
      </div>

      {SCHEDULE_IMAGES.length === 0 ? (
        <p className="empty-note">
          Chưa có ảnh lịch học. Copy ảnh vào <code>src/assets/schedule/</code> rồi build lại.
        </p>
      ) : (
        <div className="schedule-grid">
          {SCHEDULE_IMAGES.map((it) => (
            <figure key={it.id} className="schedule-card">
              <figcaption className="schedule-cap">
                <strong>{it.label}</strong>
                {it.labelVi && <span className="schedule-cap-vi">{it.labelVi}</span>}
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setOpen(it)}
                  aria-label={`Xem to lịch ${it.label}`}
                >
                  <IconExpand /> Xem to
                </button>
              </figcaption>
              <button type="button" className="schedule-thumb" onClick={() => setOpen(it)}>
                <img src={it.url} alt={`Lịch học ${it.label}`} loading="lazy" />
              </button>
            </figure>
          ))}
        </div>
      )}

      {open && <Lightbox item={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
