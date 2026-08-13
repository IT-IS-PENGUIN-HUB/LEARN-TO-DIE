import { wordFreq } from '../../lib/freq.js';

const LABEL = {
  hot: 'hay thi',
  often: 'hay gặp',
  seen: 'ít gặp',
  unseen: 'chưa thấy',
};

/**
 * Nhãn "từ này ra bao nhiêu kỳ trong đề thật".
 * `full` = kèm số kỳ (dùng ở kho từ, quiz); mặc định chỉ chữ cho đỡ chật.
 * Từ chưa từng thấy trong đề thì im lặng, trừ khi `showUnseen` — chỗ đang xem
 * một từ duy nhất mới cần biết điều đó.
 */
export default function FreqBadge({ jp, subject, full = false, showUnseen = false }) {
  const info = wordFreq(jp, subject);
  if (!info) return null;
  if (info.tier === 'unseen' && !showUnseen) return null;

  const count = `${info.exams}/${info.total} kỳ`;
  const title =
    info.tier === 'unseen'
      ? `Chưa thấy trong ${info.total} đề của môn này`
      : `Ra ở ${count} thi của môn này, tổng ${info.hits} lần${
          info.approx ? ' (từ 1 ký tự nên số đếm bị lố: tính cả khi nằm trong từ dài hơn)' : ''
        }`;

  return (
    <span className={`freq-badge is-${info.tier}`} title={title}>
      {info.tier === 'hot' && '🔥 '}
      {LABEL[info.tier]}
      {full && info.tier !== 'unseen' && ` · ${info.approx ? '≈' : ''}${count}`}
    </span>
  );
}
