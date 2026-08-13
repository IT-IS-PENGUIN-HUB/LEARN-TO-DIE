# -*- coding: utf-8 -*-
"""Cắt logo tròn từ logo/logo.png (bỏ nền đen) và sinh đủ bộ icon cho app.

Chạy:  python scripts/build_logo.py
Sinh:
  src/assets/logo.png            — 192px, nền TRONG SUỐT, cho header
  public/icons/icon-192.png      — icon PWA (Android/manifest)
  public/icons/icon-512.png      — icon PWA cỡ lớn + maskable
  public/icons/apple-touch-icon.png — icon màn hình chính iPhone (180px,
        iOS không nhận trong suốt nên lót nền navy #0f172a của app)

Cách tách hình tròn: nền ảnh gốc là màu tối gần đen, logo là vòng tròn sáng ở
giữa → tìm bounding box của mọi pixel sáng hơn nền rõ rệt, lấy hình tròn nội
tiếp, phủ mặt nạ alpha có viền mượt 2px.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "logo" / "logo.png"
OUT_HEADER = ROOT / "src" / "assets" / "logo.png"
ICONS = ROOT / "public" / "icons"

NAVY = (15, 23, 42, 255)  # --bg-color #0f172a của app


def _longest_run(flags, gap=8):
    """Dải True liền mạch dài nhất (cho phép đứt quãng ≤ gap pixel)."""
    best = (0, 0, 0)  # (dài, đầu, cuối)
    start = None
    miss = 0
    for i, f in enumerate(list(flags) + [False] * (gap + 1)):
        if f:
            if start is None:
                start = i
            miss = 0
        elif start is not None:
            miss += 1
            if miss > gap:
                end = i - miss
                if end - start > best[0]:
                    best = (end - start, start, end)
                start = None
                miss = 0
    return best[1], best[2]


def find_badge(img):
    """Bounding box của VÒNG TRÒN logo trên nền tối.

    Không dùng getbbox() thô: ảnh gốc có ngôi sao lấp lánh nhỏ ở góc làm bbox
    giãn lệch (đã dính một lần). Thay vào đó chiếu mask sáng lên từng trục và
    lấy dải liền mạch DÀI NHẤT — vòng tròn ~600px thắng đứt mọi đốm nhiễu.
    """
    g = img.convert("L")
    mask = g.point(lambda v: 255 if v > 60 else 0)
    w, h = mask.size
    px = mask.load()
    min_hits = 12  # một cột/hàng phải có ≥12px sáng mới tính là "thuộc logo"
    cols = [sum(1 for y in range(h) if px[x, y]) >= min_hits for x in range(w)]
    rows = [sum(1 for x in range(w) if px[x, y]) >= min_hits for y in range(h)]
    l, r = _longest_run(cols)
    t, b = _longest_run(rows)
    if r - l < 50 or b - t < 50:
        raise SystemExit("Không tìm thấy logo trên nền tối — kiểm tra lại ảnh nguồn")
    return l, t, r, b


def circle_crop(img):
    """Cắt hình tròn nội tiếp bbox, alpha mượt viền."""
    l, t, r, b = find_badge(img)
    w, h = r - l, b - t
    d = min(w, h)  # đường kính = cạnh ngắn (glow có thể làm bbox hơi méo)
    cx, cy = l + w // 2, t + h // 2
    box = (cx - d // 2, cy - d // 2, cx - d // 2 + d, cy - d // 2 + d)
    sq = img.convert("RGBA").crop(box)
    # mặt nạ tròn vẽ ở 4x rồi thu nhỏ → viền mượt
    big = d * 4
    m = Image.new("L", (big, big), 0)
    ImageDraw.Draw(m).ellipse((0, 0, big - 1, big - 1), fill=255)
    m = m.resize((d, d), Image.LANCZOS)
    sq.putalpha(m)
    return sq


def on_navy(circle, size, scale=0.86):
    """Đặt logo tròn lên nền navy vuông (icon iOS/maskable không nhận trong suốt)."""
    canvas = Image.new("RGBA", (size, size), NAVY)
    d = round(size * scale)
    logo = circle.resize((d, d), Image.LANCZOS)
    canvas.alpha_composite(logo, ((size - d) // 2, (size - d) // 2))
    return canvas.convert("RGB")  # icon nền đặc thì bỏ kênh alpha cho nhẹ


def main():
    img = Image.open(SRC)
    circle = circle_crop(img)
    print(f"Đã tách hình tròn {circle.size[0]}px từ {SRC.name} ({img.size[0]}x{img.size[1]})")

    OUT_HEADER.parent.mkdir(parents=True, exist_ok=True)
    circle.resize((192, 192), Image.LANCZOS).save(OUT_HEADER, optimize=True)
    print(f"→ {OUT_HEADER.relative_to(ROOT)} (header, trong suốt)")

    ICONS.mkdir(parents=True, exist_ok=True)
    # PWA/Android chấp nhận trong suốt nhưng nền navy nhìn đồng nhất hơn trên
    # mọi launcher; maskable cần logo chừa lề an toàn nên thu về 86%
    on_navy(circle, 192).save(ICONS / "icon-192.png", optimize=True)
    on_navy(circle, 512).save(ICONS / "icon-512.png", optimize=True)
    on_navy(circle, 180, scale=0.92).save(ICONS / "apple-touch-icon.png", optimize=True)
    for f in ("icon-192.png", "icon-512.png", "apple-touch-icon.png"):
        print(f"→ public/icons/{f} ({(ICONS / f).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
