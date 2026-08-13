// Nạp dữ liệu đề từ public/exam-data/ — mỗi mảnh là một (năm, môn).
// Mảnh nặng nhất 304KB nên nạp lười từng đề, không bao giờ nạp cả 1189 câu.
// Service worker (vite.config.js: exam-json-cache) lo phần offline.

import { examDataUrl } from '../data/examBank.js';

const cache = new Map(); // 'năm-MÔN' -> Promise<mảnh>

export function loadShard(year, subject) {
  const key = `${year}-${subject}`;
  if (!cache.has(key)) {
    const p = fetch(examDataUrl(year, subject))
      .then((res) => {
        if (!res.ok) throw new Error(`Không tải được đề ${key} (HTTP ${res.status})`);
        return res.json();
      })
      .catch((err) => {
        cache.delete(key); // hỏng thì cho thử lại, đừng nhớ luôn cái lỗi
        throw err;
      });
    cache.set(key, p);
  }
  return cache.get(key);
}

// Thứ tự môn trong đề thật: Ⅰ基礎 → Ⅱ適性 → Ⅲ専門. Làm cả năm thì đi đúng
// trình tự này, không theo thứ tự nút bấm trên màn chọn đề.
const EXAM_ORDER = ['KISO', 'TEKISEI', 'KENSETSU'];

/**
 * Nạp nhiều môn của cùng một năm, nối thành một mạch theo đúng thứ tự đề thi.
 * Trong từng môn dùng `ord` do script sinh sẵn — KHÔNG sắp theo qid (qid mở đầu
 * bằng mã chuyên mục nên sẽ ra thứ tự bảng chữ cái) và cũng không sắp theo
 * questionNumber trần (có năm đánh số lặp 1–6 trong từng nhóm 基礎).
 */
export async function loadYear(year, subjects) {
  const ordered = [...subjects].sort((a, b) => EXAM_ORDER.indexOf(a) - EXAM_ORDER.indexOf(b));
  const shards = await Promise.all(ordered.map((s) => loadShard(year, s)));
  return shards.flatMap((shard) =>
    [...shard.questions]
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
      .map((q) => ({ ...q, year: shard.year, subject: shard.subject }))
  );
}

/**
 * Câu trả lời có đúng không — KHÔNG so sánh chuỗi trực tiếp được vì ban tổ chức
 * có ca đặc biệt (đã đối chiếu công bố chính thức, xem kho-de-thi/check_official.py):
 *  - sp.voided: câu bị HUỶ, thi thật ai chọn gì cũng được điểm → luôn tính đúng.
 *  - sp.multi : chấp nhận nhiều đáp án (vd 2011-TEKISEI-LAW-04 = A hoặc E).
 */
export function isCorrect(q, letter) {
  if (!letter) return false;
  if (q.sp?.voided) return true;
  if (q.sp?.multi) return q.sp.multi.includes(letter);
  return q.ans === letter;
}

/** Đáp án để hiển thị: câu huỷ thì không có đáp án đúng nào cả. */
export function answerLabel(q) {
  if (q.sp?.voided) return null;
  if (q.sp?.multi) return q.sp.multi;
  return [q.ans];
}

export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Nạp câu theo DANH SÁCH qid (giữ nguyên thứ tự truyền vào) — nền của các chế độ
 * ôn câu sai / câu đánh dấu / làm tiếp phiên tuỳ chỉnh. qid mở đầu bằng
 * `<năm>-<MÔN>-` nên tự suy ra được cần tải những mảnh nào, không tải thừa.
 */
export async function loadQuestionsByQids(qids) {
  const need = new Map();
  for (const qid of qids) {
    const [y, s] = qid.split('-');
    need.set(`${y}-${s}`, { year: Number(y), subject: s });
  }
  const shards = await Promise.all(
    [...need.values()].map((g) => loadShard(g.year, g.subject))
  );
  const byQid = new Map();
  for (const shard of shards) {
    for (const q of shard.questions) {
      byQid.set(q.qid, { ...q, year: shard.year, subject: shard.subject });
    }
  }
  return qids.map((qid) => byQid.get(qid)).filter(Boolean);
}

/** Xáo trộn Fisher–Yates, trả mảng mới. */
export function shuffleQuestions(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
