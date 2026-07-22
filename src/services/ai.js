// AI tự điền thông tin từ vựng: thử DeepSeek trước, lỗi thì chuyển Gemini.
// Port từ app.js cũ (562-649), thêm validate shape để không crash vì
// response bất thường.

import { KEYS, loadString } from '../lib/storage.js';

const PROMPT = (jp) => `Bạn là từ điển Nhật-Việt cho kỹ sư xây dựng ôn thi 技術士補.
Cho từ tiếng Nhật: "${jp}"
Trả về DUY NHẤT một JSON object (không markdown, không giải thích) dạng:
{"kana":"cách đọc hiragana","meaning":"nghĩa tiếng Việt ngắn gọn","exJp":"1 câu ví dụ tiếng Nhật ngắn trong ngữ cảnh kỹ thuật","exVi":"dịch tiếng Việt của câu ví dụ"}`;

function extractJson(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (!obj || typeof obj !== 'object') return null;
    return {
      kana: typeof obj.kana === 'string' ? obj.kana : '',
      meaning: typeof obj.meaning === 'string' ? obj.meaning : '',
      exJp: typeof obj.exJp === 'string' ? obj.exJp : '',
      exVi: typeof obj.exVi === 'string' ? obj.exVi : '',
    };
  } catch {
    return null;
  }
}

async function callDeepSeek(jp, key) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: PROMPT(jp) }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
  const data = await res.json();
  const parsed = extractJson(data?.choices?.[0]?.message?.content);
  if (!parsed) throw new Error('DeepSeek trả về format không đọc được');
  return parsed;
}

async function callGemini(jp, key) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT(jp) }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const parsed = extractJson(data?.candidates?.[0]?.content?.parts?.[0]?.text);
  if (!parsed) throw new Error('Gemini trả về format không đọc được');
  return parsed;
}

/**
 * @returns {Promise<{kana,meaning,exJp,exVi}>}
 * @throws Error với message tiếng Việt hiển thị được cho user
 */
export async function autofillWord(jp) {
  const deepseekKey = loadString(KEYS.deepseekKey);
  const geminiKey = loadString(KEYS.geminiKey);
  if (!deepseekKey && !geminiKey) {
    throw new Error('Chưa có API key. Vào Cài đặt để nhập key DeepSeek hoặc Gemini.');
  }
  if (deepseekKey) {
    try {
      return await callDeepSeek(jp, deepseekKey);
    } catch (e) {
      console.warn('DeepSeek lỗi, chuyển sang Gemini:', e);
      if (!geminiKey) throw new Error('DeepSeek lỗi và chưa có key Gemini dự phòng.');
    }
  }
  return callGemini(jp, geminiKey);
}
