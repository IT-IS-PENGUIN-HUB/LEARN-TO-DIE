import { useEffect, useState } from 'react';
import { PROGRESS_EVENT } from '../lib/textbookProgress.js';

/**
 * Bộ đếm tăng mỗi khi tiến độ đọc đổi (lật trang, hoặc vừa kéo về từ GitHub).
 * Dùng làm dependency để danh sách chương / nút "Đọc tiếp" đọc lại số mới.
 */
export function useProgressVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((n) => n + 1);
    window.addEventListener(PROGRESS_EVENT, bump);
    return () => window.removeEventListener(PROGRESS_EVENT, bump);
  }, []);
  return v;
}
