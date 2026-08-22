// localStorage helpers — giữ nguyên toàn bộ key learn_to_die_* của bản cũ
// để thiết bị đang dùng không mất dữ liệu khi lên bản mới.

export const KEYS = {
  vocab: 'learn_to_die_vocab',
  theme: 'learn_to_die_theme',
  geminiKey: 'learn_to_die_gemini_key',
  deepseekKey: 'learn_to_die_deepseek_key',
  ghUser: 'learn_to_die_gh_user',
  ghRepo: 'learn_to_die_gh_repo',
  ghToken: 'learn_to_die_gh_token',
  wotdDate: 'learn_to_die_wotd_date',
  wotdData: 'learn_to_die_wotd_data',
  stats: 'learn_to_die_stats',
  reminderMin: 'learn_to_die_reminder_min',
  reminderLast: 'learn_to_die_reminder_last',
  textbookProgress: 'learn_to_die_textbook_progress',
  // Làm đề: SRS theo qid + đánh dấu + phiên đang làm dở. Để RIÊNG, không nhét
  // vào learn_to_die_vocab (migrateVocab cắt sạch field lạ).
  examState: 'learn_to_die_exam_state',
  // Tuỳ chọn hiển thị khi làm đề: ngôn ngữ, furigana, cỡ chữ
  examPrefs: 'learn_to_die_exam_prefs',
  // Sidebar đang thu gọn thành dải icon hay mở rộng (chỉ desktop)
  sidebarCollapsed: 'learn_to_die_sidebar_collapsed',
  // Ngày thi (YYYY-MM-DD) người dùng tự nhập trong Cài đặt — KHÔNG hardcode vào
  // code (có thể thi tiếp các năm sau). Chỉ nuôi đếm ngược, lưu theo từng máy.
  examDay: 'learn_to_die_exam_day',
  // Bậc hạng cao nhất ĐÃ chúc mừng (id trong TIERS) — để màn thăng bậc chỉ hiện
  // một lần cho mỗi bậc, kể cả khi acc 30 ngày sụt làm hạng tạm rơi rồi leo lại.
  lastRankTier: 'learn_to_die_last_rank_tier',
};

export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Không lưu được localStorage:', e);
  }
}

export function loadString(key, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('Không lưu được localStorage:', e);
  }
}
