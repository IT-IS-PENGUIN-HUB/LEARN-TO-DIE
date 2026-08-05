// Quét ảnh/trang PDF tài liệu → danh sách từ vựng ứng viên.
//
// Chỉ dùng Gemini: DeepSeek (deepseek-chat) không đọc được ảnh, nên ở đây
// không có fallback như autofillWord. Sau khi user duyệt xong thì phần điền
// kana/nghĩa/ví dụ vẫn đi qua ai.js (DeepSeek trước, Gemini sau) như cũ.

import { KEYS, loadString } from '../lib/storage.js';
import { parseWordList } from '../lib/wordList.js';

const MODEL = 'gemini-2.5-flash';

const PROMPT = `Bạn giúp một kỹ sư người Việt ôn thi 技術士補 xây dựng kho từ vựng.
Ảnh dưới đây là một trang tài liệu học (slide, sách, vở), có thể lẫn tiếng Nhật và tiếng Việt.

Nhiệm vụ: đọc toàn bộ chữ Nhật trong ảnh và rút ra danh sách TỪ / THUẬT NGỮ đáng học thuộc.

Quy tắc:
- Chỉ lấy từ đơn, từ ghép hoặc cụm cố định (ví dụ: 技術者倫理, 倫理綱領, 公益の確保, 社会的責任). KHÔNG lấy nguyên câu dài.
- Ưu tiên thuật ngữ chuyên ngành và từ Hán-Nhật khó; bỏ qua trợ từ, số trang, tiêu đề trang trí, chữ đơn lẻ vô nghĩa.
- Bỏ qua phần chữ tiếng Việt/tiếng Anh đứng riêng (không phải từ vựng cần học).
- Nếu trong ảnh đã có sẵn bản dịch tiếng Việt cho từ đó, hãy dùng đúng nghĩa đó.
- "kana": cách đọc hiragana đầy đủ của từ, bắt buộc có, không để trống.
- Giữ thứ tự xuất hiện trong trang, không lặp lại từ, tối đa 40 từ.

Trả về DUY NHẤT một JSON array (không markdown, không giải thích):
[{"jp":"từ tiếng Nhật","kana":"cách đọc hiragana","meaning":"nghĩa tiếng Việt ngắn gọn"}]`;

/**
 * @param {{base64: string, mimeType: string}} image - lấy từ lib/imageInput.js
 * @returns {Promise<Array<{jp: string, kana: string, meaning: string}>>}
 * @throws Error với message tiếng Việt hiển thị được cho user
 */
export async function extractWordsFromImage({ base64, mimeType }) {
  const key = loadString(KEYS.geminiKey);
  if (!key) {
    throw new Error('Quét ảnh cần Gemini API key (DeepSeek không đọc được ảnh). Vào Cài đặt để nhập key Gemini.');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }],
          },
        ],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.message ?? '';
    } catch {
      /* body không phải JSON — bỏ qua */
    }
    throw new Error(`Gemini lỗi HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p?.text ?? '').join('');
  const words = parseWordList(text);
  if (!words) throw new Error('Gemini trả về format không đọc được. Thử quét lại hoặc chụp ảnh rõ hơn.');
  return words;
}
