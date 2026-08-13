// Ảnh chụp trạng thái làm đề cho các UI NGOÀI module Đề thi (sidebar, thống kê
// trang chủ…): đọc localStorage một lần, tự làm tươi khi có sự kiện đổi/focus —
// cùng pattern refresh của PracticeModule.

import { useEffect, useState } from 'react';
import { loadExamState, EXAM_EVENT } from '../lib/examState.js';

export function useExamSnapshot() {
  const [snap, setSnap] = useState(loadExamState);
  useEffect(() => {
    const refresh = () => {
      const disk = loadExamState();
      setSnap((cur) => (JSON.stringify(disk) !== JSON.stringify(cur) ? disk : cur));
    };
    window.addEventListener(EXAM_EVENT, refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener(EXAM_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return snap;
}
