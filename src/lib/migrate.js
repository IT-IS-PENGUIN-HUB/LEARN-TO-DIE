// Chuẩn hoá dữ liệu vocab từ mọi nguồn (localStorage cũ, seed, file import,
// GitHub) về đúng một shape. Giữ nguyên các field cũ, bổ sung field thiếu.

export const SUBJECT_IDS = ['kiso', 'tekisei', 'senmon'];

function migrateEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const jp = typeof raw.jp === 'string' ? raw.jp.trim() : '';
  if (!jp) return null;
  return {
    id: String(raw.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    jp,
    kana: typeof raw.kana === 'string' ? raw.kana : '',
    meaning: typeof raw.meaning === 'string' ? raw.meaning : '',
    exJp: typeof raw.exJp === 'string' ? raw.exJp : '',
    exVi: typeof raw.exVi === 'string' ? raw.exVi : '',
    score: Number.isFinite(raw.score) ? Math.max(0, Math.min(7, Math.floor(raw.score))) : 0,
    nextReview: Number.isFinite(raw.nextReview) ? raw.nextReview : 0,
    mastered: raw.mastered === true,
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
    // Từ đã xoá giữ lại làm "bia mộ": app ẩn đi, nhưng vẫn nằm trong file sync
    // để máy khác biết là đã xoá — bỏ hẳn thì lần sync sau nó sống lại.
    ...(raw.deleted === true ? { deleted: true } : {}),
  };
}

/**
 * Nhận vocab thô ở bất kỳ format nào từng tồn tại:
 * - bản rất cũ: một mảng entries (dồn hết vào kiso)
 * - bản hiện tại: { kiso: [], tekisei: [], senmon: [] }
 * Trả về shape chuẩn, loại entry hỏng, khử trùng lặp id trong cùng subject.
 */
export function migrateVocab(raw) {
  const result = { kiso: [], tekisei: [], senmon: [] };
  if (!raw) return result;

  if (Array.isArray(raw)) {
    raw = { kiso: raw, tekisei: [], senmon: [] };
  }
  if (typeof raw !== 'object') return result;

  for (const subj of SUBJECT_IDS) {
    const list = Array.isArray(raw[subj]) ? raw[subj] : [];
    const seen = new Set();
    for (const item of list) {
      const entry = migrateEntry(item);
      if (!entry) continue;
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      result[subj].push(entry);
    }
  }
  return result;
}

export function countWords(vocab) {
  return SUBJECT_IDS.reduce((n, s) => n + (vocab[s]?.length ?? 0), 0);
}
