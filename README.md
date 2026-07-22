# LEARN TO DIE

App cá nhân ôn thi **技術士補** (kỳ thi sơ cấp kỹ sư chuyên nghiệp Nhật Bản): luyện đề PDF các năm + học từ vựng chuyên ngành bằng SRS (spaced repetition). Chạy dạng PWA — cài được lên iPhone, học offline trên tàu.

**Live:** https://it-is-penguin-hub.github.io/LEARN-TO-DIE/

## Tech

React + Vite (JS thuần), PWA qua `vite-plugin-pwa`, PDF render bằng PDF.js, deploy GitHub Pages qua GitHub Actions.

```bash
npm install     # cài dependencies
npm run dev     # dev server tại http://localhost:5173/LEARN-TO-DIE/
npm run build   # build ra dist/
npm run preview # chạy thử bản build (test PWA/service worker)
```

## Cấu trúc

- `src/lib/srs.js` — thuật toán Leitner: score = hộp 0–7, interval `[0,1,2,4,7,14,30,60]` ngày; đúng +1 hộp, sai −2 hộp và ôn lại ngay.
- `src/services/github.js` — đồng bộ `vocab.json` với repo này qua GitHub Contents API. Push luôn GET bản remote rồi **merge từng từ theo `updatedAt`** (không ghi đè mù → 2 thiết bị cùng sync không mất dữ liệu).
- `src/services/ai.js` — AI điền tự động từ vựng: DeepSeek trước, lỗi thì Gemini.
- `vocab.json` (root) — kho từ vựng, là file đích của sync. Commit "Sync vocab" không kích hoạt deploy (xem `paths-ignore` trong workflow).
- `public/pdfs/` — đề thi PDF gốc theo môn (`kiso`/`tekisei`/`senmon`).

## Đồng bộ giữa các thiết bị

1. Tạo **fine-grained PAT**: GitHub → Settings → Developer settings → Fine-grained tokens → chọn đúng repo này, quyền **Contents: Read and write**.
2. Mở app → Cài đặt → dán token → Lưu. Làm một lần trên mỗi thiết bị.
3. App tự pull khi mở và tự push sau khi có thay đổi (hoặc bấm nút thủ công).

⚠️ **Không bao giờ hardcode token vào code** — repo này public, token trong code là token bị lộ.

## Deploy

Push lên `main` → GitHub Actions build và deploy Pages tự động (Settings → Pages → Source: **GitHub Actions**).
