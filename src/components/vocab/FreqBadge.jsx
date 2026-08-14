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
 * `stacked` = xếp nhãn trên, số kỳ dưới thành hai dòng. Cùng nội dung nhưng chỉ
 * rộng ~71px thay vì ~125px — đủ hẹp để đứng cạnh chữ Hán ở lời giải quiz thay
 * vì phải chiếm riêng một dòng.
 * Từ chưa từng thấy trong đề thì im lặng, trừ khi `showUnseen` — chỗ đang xem
 * một từ duy nhất mới cần biết điều đó.
 */
export default function FreqBadge({ jp, subject, full = false, showUnseen = false, stacked = false }) {
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

  const label = `${info.tier === 'hot' ? '🔥 ' : ''}${LABEL[info.tier]}`;
  const showCount = full && info.tier !== 'unseen';
  const countLabel = `${info.approx ? '≈' : ''}${count}`;

  if (stacked && showCount) {
    return (
      <span className={`freq-badge is-${info.tier} is-stacked`} title={title}>
        <span>{label}</span>
        <span>{countLabel}</span>
      </span>
    );
  }

  return (
    <span className={`freq-badge is-${info.tier}`} title={title}>
      {label}
      {showCount && ` · ${countLabel}`}
    </span>
  );
}
