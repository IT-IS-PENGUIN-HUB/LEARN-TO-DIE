import { IconLayers, IconPlay } from './icons.jsx';
import { KEYS, loadString } from '../lib/storage.js';

export default function Hero({ onStartPractice, onStudyVocab }) {
  // Đếm ngược ngày thi (học app trung tâm) — ngày do user nhập trong Cài đặt,
  // KHÔNG hardcode (thi tiếp các năm sau chỉ cần đổi trong Cài đặt). Đọc thẳng
  // mỗi lần render: đóng modal Cài đặt là App re-render nên số tự cập nhật.
  const examDay = loadString(KEYS.examDay);
  let countdown = null;
  if (examDay) {
    const target = new Date(`${examDay}T00:00:00`);
    if (!Number.isNaN(target.getTime())) {
      const days = Math.ceil((target.getTime() - Date.now()) / 86400000);
      if (days > 0) {
        countdown = <>🗓 Còn <b>{days}</b> ngày tới kỳ thi ({target.toLocaleDateString('vi-VN')})</>;
      } else if (days === 0) {
        countdown = <>🔥 <b>Hôm nay là ngày thi</b> — bình tĩnh, bạn ôn đủ rồi!</>;
      }
      // Qua ngày thi rồi thì thôi không hiện — user tự đặt ngày mới khi ôn tiếp
    }
  }
  return (
    <section className="hero">
      <h1 className="headline">LEARN TO DIE</h1>
      <p className="subtext">Repeat until you remember. No shortcuts.</p>
      {countdown && <p className="hero-countdown">{countdown}</p>}
      <div className="hero-cta">
        <button type="button" className="btn btn-primary" onClick={onStartPractice}>
          <IconPlay /> Luyện đề
        </button>
        <button type="button" className="btn btn-outline" onClick={onStudyVocab}>
          <IconLayers /> Học từ vựng
        </button>
      </div>
    </section>
  );
}
