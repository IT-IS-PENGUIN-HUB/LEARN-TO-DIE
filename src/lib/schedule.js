// Ảnh lịch học — tự nhặt mọi file trong src/assets/schedule/, không cần khai báo tay.
// Thêm buổi mới: chỉ cần copy ảnh vào thư mục đó rồi build lại.
//
// Quy ước tên file: "8月2～8月30.jpg" (tháng/ngày bắt đầu ～ tháng/ngày kết thúc).
// Đặt đúng quy ước thì app xếp đúng thứ tự thời gian và hiện nhãn tiếng Việt;
// đặt tên khác vẫn hiện được, chỉ là xếp cuối theo tên file.

const modules = import.meta.glob('../assets/schedule/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const RANGE_RE = /^(\d{1,2})月(\d{1,2})[〜～~-]+(?:(\d{1,2})月)?(\d{1,2})/;

function parse(fileName) {
  const base = fileName.replace(/\.[^.]+$/, '');
  const m = RANGE_RE.exec(base);
  if (!m) return { label: base, labelVi: '', sort: Number.MAX_SAFE_INTEGER };
  const [, m1, d1, m2, d2] = m;
  const endMonth = m2 ?? m1;
  return {
    label: `${m1}月${d1}日 〜 ${endMonth}月${d2}日`,
    labelVi: `${d1}/${m1} – ${d2}/${endMonth}`,
    sort: Number(m1) * 100 + Number(d1),
  };
}

/**
 * Lịch học đã sắp theo thời gian.
 * Tháng 8→12 xếp trước tháng 1→7 vì kỳ thi rơi vào tháng 11: khoá học chạy
 * vắt qua năm mới thì các buổi đầu năm sau vẫn nằm đúng phía sau.
 */
export const SCHEDULE_IMAGES = Object.entries(modules)
  .map(([path, url]) => {
    const fileName = path.split('/').pop();
    const info = parse(fileName);
    return { id: fileName, url, fileName, ...info };
  })
  .sort((a, b) => {
    const wrap = (s) => (s === Number.MAX_SAFE_INTEGER ? s : s < 800 ? s + 10000 : s);
    return wrap(a.sort) - wrap(b.sort) || a.fileName.localeCompare(b.fileName);
  });
