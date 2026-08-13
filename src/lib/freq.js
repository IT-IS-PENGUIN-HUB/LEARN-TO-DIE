// Tần suất từ vựng trong đề thi thật — sinh bằng `python scripts/build_freq.py`,
// chạy lại khi thêm từ mới hoặc thêm đề mới.
//
// Con số đáng tin nhất là SỐ KỲ có từ đó (ownExams), không phải số lần: một từ
// ra 40 lần trong đúng một kỳ chỉ là chủ đề của năm đó, còn ra ở 12/16 kỳ mới
// là từ bắt buộc phải thuộc. Vì vậy xếp hạng ở đây tính theo tỷ lệ kỳ.

import freqData from '../data/freq.json';
import { EXAMS } from '../data/exams.js';

/**
 * Ngưỡng tỷ lệ kỳ có từ đó, trong đúng môn của nó.
 * Đặt cao (60% / 35%) vì 専門 chỉ có 11 đề và thuật ngữ xây dựng lặp lại rất
 * nhiều — để ngưỡng 25% thì 2/3 kho từ môn đó đều "hay thi", nhãn mất tác dụng.
 */
const HOT = 0.6;
const OFTEN = 0.35;

/** Số kỳ thi (số đề) của mỗi môn — mẫu số của "ra ở N/M kỳ". */
export const examCount = (subject) => EXAMS[subject]?.length ?? 0;

/**
 * @param {string} jp - từ tiếng Nhật, đúng chuỗi đang lưu trong kho
 * @param {string} subject - kiso | tekisei | senmon
 * @returns {{exams: number, hits: number, total: number, ratio: number,
 *            tier: 'hot'|'often'|'seen'|'unseen', approx: boolean} | null}
 *          null khi từ chưa có trong bảng (mới thêm, chưa chạy lại script).
 */
export function wordFreq(jp, subject) {
  // Tra theo môn: cùng một từ nằm ở hai môn thì mẫu số kỳ thi khác nhau
  const row = freqData[subject]?.[jp];
  if (!row) return null;
  const total = examCount(subject);
  const exams = row.ownExams ?? 0;
  const ratio = total ? exams / total : 0;
  const tier = ratio >= HOT ? 'hot' : ratio >= OFTEN ? 'often' : exams > 0 ? 'seen' : 'unseen';
  return {
    exams,
    hits: row.ownHits ?? 0,
    total,
    ratio,
    tier,
    // Tiếng Nhật không có dấu cách nên đây là đếm chuỗi con: từ 1 ký tự bị đếm
    // lố vì nằm trong từ dài hơn (基 tính cả trong 基礎・基本), phải nói rõ.
    approx: [...jp].length === 1,
  };
}

/** Từ đáng ưu tiên ôn — dùng cho bộ lọc "hay thi". */
export const isFrequent = (info) => info?.tier === 'hot' || info?.tier === 'often';

/** Xếp từ hay thi lên đầu; hoà thì từ ra nhiều lần hơn đứng trước. */
export function byFrequency(subject) {
  return (a, b) => {
    const fa = wordFreq(a.jp, subject);
    const fb = wordFreq(b.jp, subject);
    return (fb?.exams ?? 0) - (fa?.exams ?? 0) || (fb?.hits ?? 0) - (fa?.hits ?? 0);
  };
}
