// AI tự điền thông tin từ vựng: thử DeepSeek trước, lỗi thì chuyển Gemini.
// Port từ app.js cũ (562-649), thêm validate shape để không crash vì
// response bất thường.

import { KEYS, loadString } from '../lib/storage.js';
import { parseWordList } from '../lib/wordList.js';

const PROMPT = (jp) => `Bạn là từ điển Nhật-Việt cho kỹ sư xây dựng ôn thi 技術士補.
Cho từ tiếng Nhật: "${jp}"
Trả về DUY NHẤT một JSON object (không markdown, không giải thích) dạng:
{"kana":"cách đọc hiragana","meaning":"nghĩa tiếng Việt ngắn gọn","exJp":"1 câu ví dụ tiếng Nhật ngắn trong ngữ cảnh kỹ thuật","exVi":"dịch tiếng Việt của câu ví dụ"}`;

// Điền nhiều từ trong 1 lượt gọi — dùng cho luồng quét ảnh, đỡ tốn quota và
// nhanh hơn nhiều so với gọi lẻ từng từ.
const BATCH_PROMPT = (jpList) => `Bạn là từ điển Nhật-Việt cho kỹ sư xây dựng ôn thi 技術士補.
Cho danh sách từ tiếng Nhật: ${JSON.stringify(jpList)}
Trả về DUY NHẤT một JSON array (không markdown, không giải thích), mỗi từ một phần tử, ĐÚNG THỨ TỰ trên, dạng:
[{"jp":"từ đúng như đã cho","kana":"cách đọc hiragana","meaning":"nghĩa tiếng Việt ngắn gọn","exJp":"1 câu ví dụ tiếng Nhật ngắn trong ngữ cảnh kỹ thuật","exVi":"dịch tiếng Việt của câu ví dụ"}]`;

// Lọc từ vựng từ chữ CÓ SẴN trong PDF — không cần AI nhìn ảnh, nên DeepSeek
// làm được, khỏi cần key Gemini.
const PAGE_WORDS_PROMPT = (pageText) => `Bạn giúp một kỹ sư người Việt ôn thi 技術士補 (kỹ thuật xây dựng) xây dựng kho từ vựng.
Dưới đây là toàn bộ chữ lấy từ một trang tài liệu/đề thi tiếng Nhật.

Nhiệm vụ: rút ra danh sách TỪ / THUẬT NGỮ đáng học thuộc.
Quy tắc:
- Chỉ lấy từ đơn, từ ghép hoặc cụm cố định (ví dụ: 技術者倫理, 公益の確保, 設計荷重). KHÔNG lấy nguyên câu.
- Ưu tiên thuật ngữ chuyên ngành và từ Hán-Nhật khó; bỏ trợ từ, số hiệu câu hỏi, ký hiệu, con số, công thức.
- Trang có thể lẫn tiếng Việt: nếu đã có sẵn bản dịch tiếng Việt cho từ nào thì dùng đúng nghĩa đó; không lấy chữ tiếng Việt/tiếng Anh làm từ vựng.
- "kana": cách đọc hiragana đầy đủ của từ, bắt buộc có, không để trống.
- "meaning": nghĩa tiếng Việt ngắn gọn.
- Giữ thứ tự xuất hiện, không lặp lại từ, tối đa 40 từ.

Trả về DUY NHẤT một JSON array (không markdown, không giải thích):
[{"jp":"từ tiếng Nhật","kana":"cách đọc hiragana","meaning":"nghĩa tiếng Việt ngắn gọn"}]

--- CHỮ TRONG TRANG ---
${pageText}`;

const BATCH_SIZE = 8;
const MAX_PAGE_CHARS = 6000;

function pickFields(obj) {
  return {
    kana: typeof obj.kana === 'string' ? obj.kana : '',
    meaning: typeof obj.meaning === 'string' ? obj.meaning : '',
    exJp: typeof obj.exJp === 'string' ? obj.exJp : '',
    exVi: typeof obj.exVi === 'string' ? obj.exVi : '',
  };
}

function extractJson(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (!obj || typeof obj !== 'object') return null;
    return pickFields(obj);
  } catch {
    return null;
  }
}

/** Parse response của BATCH_PROMPT → Map<jp, {kana,meaning,exJp,exVi}> */
function extractJsonBatch(text, jpList) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end <= start) return null;
  let arr;
  try {
    arr = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const map = new Map();
  arr.forEach((item, i) => {
    if (!item || typeof item !== 'object') return;
    // Khớp theo jp. Chỉ khi AI trả thiếu jp MÀ số phần tử khớp đúng số từ đã
    // hỏi mới dám dựa vào vị trí — lệch số lượng mà gán theo vị trí là gán
    // nhầm cách đọc/ví dụ của từ này sang từ khác.
    const byJp = typeof item.jp === 'string' && jpList.includes(item.jp.trim()) ? item.jp.trim() : null;
    const jp = byJp ?? (arr.length === jpList.length ? jpList[i] : null);
    if (!jp || map.has(jp)) return;
    map.set(jp, pickFields(item));
  });
  return map.size ? map : null;
}

async function callDeepSeek(prompt, key) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}

async function callGemini(prompt, key) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

/**
 * Hỏi AI và parse kết quả. Đường chính là Gemini (ロン chỉ dùng Gemini, ô nhập
 * key DeepSeek đã bỏ khỏi Cài đặt 14/8); nhánh DeepSeek giữ lại cho máy nào
 * còn key cũ trong localStorage — có key thì vẫn chạy, không thì đi thẳng Gemini.
 * @param {(text: string) => any} parse - trả null nếu response không dùng được
 */
async function askAI(prompt, parse) {
  const deepseekKey = loadString(KEYS.deepseekKey);
  const geminiKey = loadString(KEYS.geminiKey);
  if (!deepseekKey && !geminiKey) {
    throw new Error('Chưa có API key. Vào Cài đặt để nhập key Gemini.');
  }
  if (deepseekKey) {
    try {
      const parsed = parse(await callDeepSeek(prompt, deepseekKey));
      if (!parsed) throw new Error('DeepSeek trả về format không đọc được');
      return parsed;
    } catch (e) {
      console.warn('DeepSeek lỗi, chuyển sang Gemini:', e);
      if (!geminiKey) throw new Error('DeepSeek lỗi và chưa có key Gemini dự phòng.');
    }
  }
  const parsed = parse(await callGemini(prompt, geminiKey));
  if (!parsed) throw new Error('Gemini trả về format không đọc được');
  return parsed;
}

/**
 * @returns {Promise<{kana,meaning,exJp,exVi}>}
 * @throws Error với message tiếng Việt hiển thị được cho user
 */
export async function autofillWord(jp) {
  return askAI(PROMPT(jp), extractJson);
}

/**
 * Lọc từ vựng từ chữ có sẵn của một trang PDF (không qua AI vision).
 * @param {string} pageText
 * @returns {Promise<Array<{jp, kana, meaning}>>}
 */
export async function extractWordsFromText(pageText) {
  const clean = (pageText ?? '').trim().slice(0, MAX_PAGE_CHARS);
  if (!clean) throw new Error('Trang này không có chữ để đọc.');
  return askAI(PAGE_WORDS_PROMPT(clean), parseWordList);
}

/**
 * Điền hàng loạt cho luồng quét ảnh: chia lô 8 từ/lượt gọi, từ nào lô hỏng
 * thì gọi lẻ bù lại. Không throw vì một vài từ lỗi — trả về Map thiếu từ đó,
 * phía gọi tự quyết định (đang dùng nghĩa đọc được từ ảnh làm dự phòng).
 * Chỉ throw khi chưa có API key nào.
 * @param {string[]} jpList
 * @param {(done: number, total: number) => void} [onProgress]
 * @returns {Promise<Map<string, {kana,meaning,exJp,exVi}>>}
 */
export async function autofillWords(jpList, onProgress) {
  const words = [...new Set(jpList.map((s) => s.trim()).filter(Boolean))];
  const filled = new Map();
  if (!words.length) return filled;

  if (!loadString(KEYS.deepseekKey) && !loadString(KEYS.geminiKey)) {
    throw new Error('Chưa có API key. Vào Cài đặt để nhập key Gemini.');
  }

  let done = 0;
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const chunk = words.slice(i, i + BATCH_SIZE);
    try {
      const map = await askAI(BATCH_PROMPT(chunk), (text) => extractJsonBatch(text, chunk));
      for (const [jp, fields] of map) filled.set(jp, fields);
    } catch (e) {
      console.warn('Lô autofill lỗi, sẽ thử lại từng từ:', e);
    }
    done += chunk.length;
    onProgress?.(done, words.length);
  }

  // Từ nào lô bỏ sót → gọi lẻ, vẫn lỗi thì bỏ qua
  const missing = words.filter((jp) => !filled.has(jp));
  for (const jp of missing) {
    try {
      filled.set(jp, await autofillWord(jp));
    } catch (e) {
      console.warn(`Không điền được từ "${jp}":`, e);
    }
  }
  return filled;
}
