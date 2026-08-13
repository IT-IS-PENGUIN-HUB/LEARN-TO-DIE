// Cập nhật app (service worker) mà KHÔNG cắt ngang việc đang học.
//
// Trước đây dùng registerType:'autoUpdate' + registerSW({immediate:true}):
// hễ có bản mới là service worker tự chiếm quyền rồi TẢI LẠI TRANG ngay lập tức.
// Đang giữa phiên quiz thì màn hình nháy một cái, phiên đang làm mất sạch và app
// nhảy về trang chủ — vài giây sau khi mở app, đúng lúc tải xong bản mới.
//
// Giờ bản mới chỉ được nằm chờ; app tự chọn thời điểm an toàn để áp dụng
// (xem App.jsx: chỉ áp dụng khi không mở phần ôn tập và không xem PDF).

import { registerSW } from 'virtual:pwa-register';

let applyUpdate = null; // hàm do vite-plugin-pwa trả về
let ready = false;
const listeners = new Set();

export function initAppUpdate() {
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      ready = true;
      listeners.forEach((fn) => fn());
    },
  });
}

/** Đăng ký lắng nghe "đã có bản mới đang chờ". Trả về hàm huỷ đăng ký. */
export function onUpdateReady(fn) {
  listeners.add(fn);
  if (ready) fn();
  return () => listeners.delete(fn);
}

export const isUpdateReady = () => ready;

/** Áp dụng bản mới — service worker chiếm quyền và trang tải lại. */
export function applyAppUpdate() {
  if (!ready) return;
  ready = false;
  applyUpdate?.(true);
  // updateSW chỉ tải lại trang SAU khi service worker mới kịp kích hoạt — có
  // máy mất vài giây, có ca kẹt hẳn (ロン bấm nút mà "chả thấy gì hiện ra",
  // 14/8). Bản mới lúc này đã nằm sẵn trong máy nên quá 2,5s chưa thấy tải
  // lại thì tự tải lại — không có gì để mất.
  setTimeout(() => window.location.reload(), 2500);
}
