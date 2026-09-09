import { Component } from 'react';

// Vì sao có: 9/9/2026 deploy ba lần trong một giờ, tab ロン đang mở vẫn giữ bản
// cũ trong bộ nhớ; tới lúc nó tải lười trình xem PDF thì file đó (tên có hash)
// đã bị bản mới thay mất → import hỏng → React không có lưới đỡ → CẢ APP trắng
// toát, ロン tưởng tôi làm hỏng giáo trình. Đây là lưới đỡ đó.
const CHUNK_ERR = /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|Failed to fetch/i;
const FLAG = 'ltd-chunk-reloaded';

export default class ChunkBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err) {
    console.error('Lỗi khi dựng màn hình:', err);
    // Đúng kiểu "tải mảnh code hụt" thì tải lại trang MỘT lần — sau khi tải lại,
    // index.html mới trỏ tới đúng file mới. Chỉ một lần mỗi tab để không lặp vô hạn
    // nếu lỗi là thứ khác.
    if (CHUNK_ERR.test(String(err?.message ?? ''))) {
      try {
        if (!sessionStorage.getItem(FLAG)) {
          sessionStorage.setItem(FLAG, '1');
          window.location.reload();
        }
      } catch {
        /* không có sessionStorage thì thôi, hiện thông báo bên dưới */
      }
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="qb-loading container" role="alert">
          Không mở được phần này — app vừa có bản mới trong lúc trang đang mở. Hãy tải lại trang
          (Ctrl+Shift+R, hoặc đóng app rồi mở lại).
        </p>
      );
    }
    return this.props.children;
  }
}
