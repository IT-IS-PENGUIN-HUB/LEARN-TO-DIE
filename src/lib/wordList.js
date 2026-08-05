// Đọc danh sách từ vựng AI trả về. Dùng chung cho 2 đường vào:
// quét ảnh (Gemini nhìn ảnh) và quét chữ có sẵn trong PDF (DeepSeek/Gemini đọc text).

const MAX_WORDS = 60;

/**
 * @param {string} text - response thô của AI
 * @returns {Array<{jp: string, kana: string, meaning: string}> | null} null nếu không parse được
 */
export function parseWordList(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end <= start) return null;
  let raw;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;

  const seen = new Set();
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const jp = typeof item.jp === 'string' ? item.jp.trim() : '';
    if (!jp || seen.has(jp)) continue;
    seen.add(jp);
    out.push({
      jp,
      kana: typeof item.kana === 'string' ? item.kana.trim() : '',
      meaning: typeof item.meaning === 'string' ? item.meaning.trim() : '',
    });
    if (out.length >= MAX_WORDS) break;
  }
  return out;
}
