// Nhật ký thao tác vuốt lật trang — CHỈ để gỡ lỗi trên máy thật.
//
// Lý do có file này: 9/9/2026 ロン báo vuốt trên iPhone không có hiệu ứng, mà máy
// tôi không dựng lại được (trình duyệt test luôn ở trạng thái ẩn nên PDF.js không
// vẽ, iOS thì không mô phỏng được). Đoán mò hai vòng đều trượt. Ghi lại vài dòng
// ngay trên máy ロン rồi đọc lên là biết chính xác kẹt ở đâu:
//  - không có dòng nào  → app không nhận được thao tác chạm
//  - "bỏ qua: phóng to" → app tưởng đang phóng to nên không lật
//  - "kéo 120px … chưa sẵn" → có kéo, nhưng trang kế vẽ chưa kịp

const KEY = 'learn_to_die_swipe_log';
const MAX = 6;

export function logSwipe(text) {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    const gio = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    arr.unshift(`${gio} ${text}`);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
  } catch {
    /* hết chỗ lưu thì thôi, đây chỉ là nhật ký gỡ lỗi */
  }
}

export function readSwipeLog() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearSwipeLog() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* kệ */
  }
}
