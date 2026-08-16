// Giáo trình của lớp học — mỗi môn là một "thư mục cha", mỗi chương là "thư mục con".
//
// Tài liệu gốc gộp nhiều buổi vào một file PDF, mỗi chương mở đầu bằng một trang bìa.
// Ở đây lưu sẵn khoảng trang của từng chương (dò từ trang bìa trong PDF) để mở
// thẳng đúng chương thay vì phải lật tay.
//
// Trang đầu mỗi file là các bảng 出題傾向 (tỷ lệ ra đề) — KHÔNG thuộc chương 1,
// nên để thành một mục riêng ngang hàng chương (kind: 'trend').
//
// Thêm giáo trình mới: copy PDF vào public/textbooks/<môn>/ rồi thêm một mục
// vào DOCS + các chương vào CHAPTERS của môn đó.

import { SUBJECTS } from './exams.js';

/** Các file PDF gốc, theo môn. `pages` = tổng số trang, dùng để hiện tiến độ. */
const DOCS = {
  tekisei: [
    {
      id: 'part1',
      label: '前半（第1〜7章）',
      labelVi: 'Phần đầu — chương 1–7',
      path: 'textbooks/tekisei/tekisei_part1_ch01-07.pdf',
      pages: 106,
    },
    {
      id: 'part2',
      label: '後半（第8〜16章＋付録）',
      labelVi: 'Phần sau — chương 8–16 + phụ lục',
      path: 'textbooks/tekisei/tekisei_part2_ch08-16.pdf',
      pages: 118,
    },
  ],
  kiso: [
    { id: 'ch1', label: '第1章 設計・計画', labelVi: 'Chương 1 — Thiết kế & Kế hoạch',
      path: 'textbooks/kiso/kiso_ch1_sekkei-keikaku.pdf', pages: 172 },
    { id: 'ch2', label: '第2章 情報・論理', labelVi: 'Chương 2 — Thông tin & Logic',
      path: 'textbooks/kiso/kiso_ch2_joho-ronri.pdf', pages: 104 },
    { id: 'ch3', label: '第3章 解析', labelVi: 'Chương 3 — Giải tích',
      path: 'textbooks/kiso/kiso_ch3_kaiseki.pdf', pages: 91 },
    { id: 'ch4', label: '第4章 材料・化学・バイオ', labelVi: 'Chương 4 — Vật liệu · Hóa học · Sinh học',
      path: 'textbooks/kiso/kiso_ch4_zairyo-kagaku-bio.pdf', pages: 111 },
    { id: 'ch5', label: '第5章 環境・エネルギー・技術', labelVi: 'Chương 5 — Môi trường · Năng lượng · Công nghệ',
      path: 'textbooks/kiso/kiso_ch5_kankyo-energy-gijutsu.pdf', pages: 98 },
  ],
  senmon: [],
};

/**
 * Chương học. `start`/`end` là số trang trong file PDF (tính từ 1, bao gồm cả hai đầu).
 * `rate` = 出題率 ghi trên trang bìa chương — dùng để sắp thứ tự ưu tiên ôn.
 * kind: 'trend' = bảng tỷ lệ ra đề | 'chapter' = chương | 'appendix' = phụ lục.
 */
const CHAPTERS = {
  tekisei: [
    { id: 'trend1', kind: 'trend', doc: 'part1', start: 2, end: 4,
      titleJp: '目次・出題傾向（前半）', titleVi: 'Mục lục & bảng tỷ lệ ra đề — phần đầu' },
    { id: 'ch01', kind: 'chapter', no: '①', doc: 'part1', start: 5, end: 20, rate: 100,
      titleJp: '技術士制度・技術士法・CPD・資質能力', titleVi: 'Chế độ 技術士 · Luật 技術士法 · CPD · Năng lực' },
    { id: 'ch02', kind: 'chapter', no: '②', doc: 'part1', start: 21, end: 37, rate: 100,
      titleJp: 'リスクマネジメント・安全', titleVi: 'Quản lý rủi ro & an toàn (リスクアセスメント・ALARP)' },
    { id: 'ch03', kind: 'chapter', no: '③', doc: 'part1', start: 38, end: 52, rate: 100,
      titleJp: '技術者倫理の基礎理論', titleVi: 'Lý thuyết nền tảng về đạo đức kỹ sư' },
    { id: 'ch04', kind: 'chapter', no: '④', doc: 'part1', start: 53, end: 67, rate: 83,
      titleJp: 'SDGs・持続可能・環境', titleVi: 'SDGs · Phát triển bền vững · Môi trường' },
    { id: 'ch05', kind: 'chapter', no: '⑤', doc: 'part1', start: 68, end: 82, rate: 100,
      titleJp: '知的財産権', titleVi: 'Quyền sở hữu trí tuệ (知財)' },
    { id: 'ch06', kind: 'chapter', no: '⑥', doc: 'part1', start: 83, end: 94, rate: 100,
      titleJp: '製造物責任法（PL法）', titleVi: 'Luật trách nhiệm sản phẩm (PL法)' },
    { id: 'ch07', kind: 'chapter', no: '⑦', doc: 'part1', start: 95, end: 106, rate: 58,
      titleJp: '研究倫理・研究不正', titleVi: 'Đạo đức nghiên cứu & gian lận nghiên cứu' },

    { id: 'trend2', kind: 'trend', doc: 'part2', start: 2, end: 5,
      titleJp: '目次・出題傾向（後半）', titleVi: 'Mục lục & bảng tỷ lệ ra đề — phần sau' },
    { id: 'ch08', kind: 'chapter', no: '⑧', doc: 'part2', start: 6, end: 17, rate: 42,
      titleJp: '新技術と社会・倫理（AI等）', titleVi: 'Công nghệ mới & xã hội · đạo đức (AI…)' },
    { id: 'ch09', kind: 'chapter', no: '⑨', doc: 'part2', start: 18, end: 29, rate: 58,
      titleJp: '公益通報者保護法', titleVi: 'Luật bảo vệ người tố giác vì lợi ích công' },
    { id: 'ch10', kind: 'chapter', no: '⑩', doc: 'part2', start: 30, end: 41, rate: 50,
      titleJp: '働き方・労働・ダイバーシティ', titleVi: 'Cách làm việc · Lao động · Đa dạng' },
    { id: 'ch11', kind: 'chapter', no: '⑪', doc: 'part2', start: 42, end: 53, rate: 42,
      titleJp: 'ハラスメント', titleVi: 'Quấy rối nơi làm việc (harassment)' },
    { id: 'ch12', kind: 'chapter', no: '⑫', doc: 'part2', start: 54, end: 65, rate: 42,
      titleJp: '組織不正・品質不正・失敗学', titleVi: 'Gian lận tổ chức · gian lận chất lượng · khoa học thất bại' },
    { id: 'ch13', kind: 'chapter', no: '⑬', doc: 'part2', start: 66, end: 77, rate: 33,
      titleJp: '公正取引・独占禁止', titleVi: 'Thương mại công bằng · chống độc quyền' },
    { id: 'ch14', kind: 'chapter', no: '⑭', doc: 'part2', start: 78, end: 92, rate: 58,
      titleJp: '個人情報・情報セキュリティ', titleVi: 'Thông tin cá nhân · an ninh thông tin' },
    { id: 'ch15', kind: 'chapter', no: '⑮', doc: 'part2', start: 93, end: 104, rate: 25,
      titleJp: '安全保障貿易管理', titleVi: 'Quản lý thương mại an ninh (輸出管理)' },
    { id: 'ch16', kind: 'chapter', no: '⑯', doc: 'part2', start: 105, end: 116, rate: 50,
      titleJp: 'ISO 26000・社会的責任・国際標準', titleVi: 'ISO 26000 · trách nhiệm xã hội · tiêu chuẩn quốc tế' },
    { id: 'appendix', kind: 'appendix', doc: 'part2', start: 117, end: 118,
      titleJp: '付録：ユニバーサルデザイン・バリアフリー', titleVi: 'Phụ lục: Universal Design · Barrier-free' },
  ],
  kiso: [
    // ===== 第1章 設計・計画 (172 trang) =====
    { id: 'ch1_trend', kind: 'trend', doc: 'ch1', start: 1, end: 3,
      titleJp: '目次・出題傾向', titleVi: 'Mục lục & tỷ lệ ra đề' },
    { id: 'ch1_01', kind: 'chapter', no: '①', doc: 'ch1', start: 4, end: 24, rate: 100,
      titleJp: '信頼性（直列・並列・FTA・R−S・可用性）', titleVi: 'Độ tin cậy (nối tiếp·song song·FTA·R–S·khả dụng)' },
    { id: 'ch1_02', kind: 'chapter', no: '②', doc: 'ch1', start: 25, end: 38, rate: 75,
      titleJp: '材料力学・材料の機械的特性', titleVi: 'Sức bền vật liệu · đặc tính cơ học' },
    { id: 'ch1_03', kind: 'chapter', no: '③', doc: 'ch1', start: 39, end: 49, rate: 58,
      titleJp: '製図法（第三角法・投影）', titleVi: 'Vẽ kỹ thuật (phép chiếu góc thứ ba)' },
    { id: 'ch1_07', kind: 'chapter', no: '⑦', doc: 'ch1', start: 50, end: 65, rate: 42,
      titleJp: '最適化・在庫管理（EOQ）', titleVi: 'Tối ưu hóa · quản lý tồn kho (EOQ)' },
    { id: 'ch1_04', kind: 'chapter', no: '④', doc: 'ch1', start: 66, end: 79, rate: 50,
      titleJp: '待ち行列（M/M/1・ATM）', titleVi: 'Lý thuyết hàng đợi (M/M/1·ATM)' },
    { id: 'ch1_05', kind: 'chapter', no: '⑤', doc: 'ch1', start: 80, end: 91, rate: 50,
      titleJp: '線形計画法（LP）', titleVi: 'Quy hoạch tuyến tính (LP)' },
    { id: 'ch1_06', kind: 'chapter', no: '⑥', doc: 'ch1', start: 92, end: 106, rate: 50,
      titleJp: '安全率・安全係数・構造設計', titleVi: 'Hệ số an toàn · thiết kế kết cấu' },
    { id: 'ch1_09', kind: 'chapter', no: '⑨', doc: 'ch1', start: 107, end: 120, rate: 33,
      titleJp: '品質管理（ISO9001・抜取検査・PDCA）', titleVi: 'Quản lý chất lượng (ISO9001·chọn mẫu·PDCA)' },
    { id: 'ch1_10', kind: 'chapter', no: '⑩', doc: 'ch1', start: 121, end: 132, rate: 33,
      titleJp: '工程管理（PERT・アローダイアグラム）', titleVi: 'Quản lý tiến độ (PERT·sơ đồ mũi tên)' },
    { id: 'ch1_08', kind: 'chapter', no: '⑧', doc: 'ch1', start: 133, end: 144, rate: 42,
      titleJp: 'ユニバーサルデザイン（UD7原則）', titleVi: 'Universal Design (7 nguyên tắc UD)' },
    { id: 'ch1_11', kind: 'chapter', no: '⑪', doc: 'ch1', start: 145, end: 159, rate: 33,
      titleJp: '確率・統計（正規分布・確率分布）', titleVi: 'Xác suất · thống kê (phân phối chuẩn)' },
    { id: 'ch1_12', kind: 'chapter', no: '⑫', doc: 'ch1', start: 160, end: 172, rate: 17,
      titleJp: '製造物責任法（PL法）', titleVi: 'Luật trách nhiệm sản phẩm (PL法)' },
    // ===== 第2章 情報・論理 (104 trang) =====
    { id: 'ch2_trend', kind: 'trend', doc: 'ch2', start: 1, end: 4,
      titleJp: '目次・出題傾向', titleVi: 'Mục lục & tỷ lệ ra đề' },
    { id: 'ch2_01', kind: 'chapter', no: '①', doc: 'ch2', start: 5, end: 12, rate: 83,
      titleJp: 'アルゴリズム・計算量', titleVi: 'Thuật toán · độ phức tạp tính toán' },
    { id: 'ch2_02', kind: 'chapter', no: '②', doc: 'ch2', start: 13, end: 20, rate: 83,
      titleJp: 'セキュリティ・暗号', titleVi: 'Bảo mật · mã hóa' },
    { id: 'ch2_03', kind: 'chapter', no: '③', doc: 'ch2', start: 21, end: 26, rate: 58,
      titleJp: '論理演算', titleVi: 'Phép toán logic' },
    { id: 'ch2_04', kind: 'chapter', no: '④', doc: 'ch2', start: 27, end: 32, rate: 50,
      titleJp: '符号化・情報圧縮・情報理論', titleVi: 'Mã hóa · nén thông tin · lý thuyết thông tin' },
    { id: 'ch2_05', kind: 'chapter', no: '⑤', doc: 'ch2', start: 33, end: 39, rate: 42,
      titleJp: '情報量・伝送時間', titleVi: 'Lượng tin · thời gian truyền' },
    { id: 'ch2_06', kind: 'chapter', no: '⑥', doc: 'ch2', start: 40, end: 45, rate: 33,
      titleJp: '集合・写像', titleVi: 'Tập hợp · ánh xạ' },
    { id: 'ch2_07', kind: 'chapter', no: '⑦', doc: 'ch2', start: 46, end: 52, rate: 33,
      titleJp: '記憶・実効アクセス時間', titleVi: 'Bộ nhớ · thời gian truy cập hiệu dụng' },
    { id: 'ch2_08', kind: 'chapter', no: '⑧', doc: 'ch2', start: 53, end: 58, rate: 33,
      titleJp: 'ネットワーク・IP', titleVi: 'Mạng · IP' },
    { id: 'ch2_09', kind: 'chapter', no: '⑨', doc: 'ch2', start: 59, end: 64, rate: 25,
      titleJp: '数値表現・浮動小数点', titleVi: 'Biểu diễn số · dấu phẩy động' },
    { id: 'ch2_10', kind: 'chapter', no: '⑩', doc: 'ch2', start: 65, end: 72, rate: 25,
      titleJp: '基数変換', titleVi: 'Chuyển đổi cơ số' },
    { id: 'ch2_11', kind: 'chapter', no: '⑪', doc: 'ch2', start: 73, end: 78, rate: 17,
      titleJp: 'データ構造（スタック・キュー・木）', titleVi: 'Cấu trúc dữ liệu (stack·queue·cây)' },
    { id: 'ch2_12', kind: 'chapter', no: '⑫', doc: 'ch2', start: 79, end: 84, rate: 17,
      titleJp: '補数表現', titleVi: 'Biểu diễn số bù' },
    { id: 'ch2_13', kind: 'chapter', no: '⑬', doc: 'ch2', start: 85, end: 90, rate: 17,
      titleJp: '逆ポーランド記法', titleVi: 'Ký pháp Ba Lan ngược (RPN)' },
    { id: 'ch2_14', kind: 'chapter', no: '⑭', doc: 'ch2', start: 91, end: 96, rate: 8,
      titleJp: '数値計算誤差', titleVi: 'Sai số tính toán số' },
    { id: 'ch2_15', kind: 'chapter', no: '⑮', doc: 'ch2', start: 97, end: 104, rate: 8,
      titleJp: '確率', titleVi: 'Xác suất' },
    // ===== 第3章 解析 (91 trang) =====
    { id: 'ch3_trend', kind: 'trend', doc: 'ch3', start: 1, end: 4,
      titleJp: '目次・出題傾向', titleVi: 'Mục lục & tỷ lệ ra đề' },
    { id: 'ch3_01', kind: 'chapter', no: '①', doc: 'ch3', start: 5, end: 13, rate: 92,
      titleJp: '応力・ひずみ・変位', titleVi: 'Ứng suất · biến dạng · chuyển vị' },
    { id: 'ch3_02', kind: 'chapter', no: '②', doc: 'ch3', start: 14, end: 19, rate: 75,
      titleJp: 'ベクトル解析（grad・div・rot）', titleVi: 'Giải tích vector (grad·div·rot)' },
    { id: 'ch3_03', kind: 'chapter', no: '③', doc: 'ch3', start: 20, end: 26, rate: 75,
      titleJp: '固有振動数・振動', titleVi: 'Tần số riêng · dao động' },
    { id: 'ch3_04', kind: 'chapter', no: '④', doc: 'ch3', start: 27, end: 33, rate: 50,
      titleJp: '積分（定積分・重積分・数値積分）', titleVi: 'Tích phân (xác định·bội·số)' },
    { id: 'ch3_05', kind: 'chapter', no: '⑤', doc: 'ch3', start: 34, end: 39, rate: 42,
      titleJp: '行列（逆行列・行列式・ヤコビ）', titleVi: 'Ma trận (nghịch đảo·định thức·Jacobi)' },
    { id: 'ch3_06', kind: 'chapter', no: '⑥', doc: 'ch3', start: 40, end: 46, rate: 42,
      titleJp: '数値解析・誤差', titleVi: 'Giải tích số · sai số' },
    { id: 'ch3_07', kind: 'chapter', no: '⑦', doc: 'ch3', start: 47, end: 52, rate: 33,
      titleJp: '電気回路（合成抵抗）', titleVi: 'Mạch điện (điện trở tương đương)' },
    { id: 'ch3_08', kind: 'chapter', no: '⑧', doc: 'ch3', start: 53, end: 59, rate: 33,
      titleJp: '有限要素法（FEM）', titleVi: 'Phương pháp phần tử hữu hạn (FEM)' },
    { id: 'ch3_09', kind: 'chapter', no: '⑨', doc: 'ch3', start: 60, end: 65, rate: 33,
      titleJp: '慣性モーメント・剛体回転', titleVi: 'Mô men quán tính · quay vật rắn' },
    { id: 'ch3_10', kind: 'chapter', no: '⑩', doc: 'ch3', start: 66, end: 71, rate: 33,
      titleJp: '導関数・差分表現', titleVi: 'Đạo hàm · biểu diễn sai phân' },
    { id: 'ch3_11', kind: 'chapter', no: '⑪', doc: 'ch3', start: 72, end: 77, rate: 17,
      titleJp: 'Newton法（反復計算）', titleVi: 'Phương pháp Newton (lặp)' },
    { id: 'ch3_12', kind: 'chapter', no: '⑫', doc: 'ch3', start: 78, end: 83, rate: 17,
      titleJp: 'その他（微分方程式・流体）', titleVi: 'Khác (phương trình vi phân·chất lưu)' },
    { id: 'ch3_13', kind: 'chapter', no: '⑬', doc: 'ch3', start: 84, end: 91, rate: 8,
      titleJp: '補間・近似', titleVi: 'Nội suy · xấp xỉ' },
    // ===== 第4章 材料・化学・バイオ (111 trang) =====
    { id: 'ch4_trend', kind: 'trend', doc: 'ch4', start: 1, end: 3,
      titleJp: '目次・出題傾向', titleVi: 'Mục lục & tỷ lệ ra đề' },
    { id: 'ch4_01', kind: 'chapter', no: '①', doc: 'ch4', start: 4, end: 13, rate: 42,
      titleJp: '金属の結晶構造', titleVi: 'Cấu trúc tinh thể kim loại' },
    { id: 'ch4_02', kind: 'chapter', no: '②', doc: 'ch4', start: 14, end: 23, rate: 75,
      titleJp: '金属の性質・力学特性', titleVi: 'Tính chất · đặc tính cơ học kim loại' },
    { id: 'ch4_03', kind: 'chapter', no: '③', doc: 'ch4', start: 24, end: 32, rate: 33,
      titleJp: '合金組成の計算', titleVi: 'Tính thành phần hợp kim' },
    { id: 'ch4_04', kind: 'chapter', no: '④', doc: 'ch4', start: 33, end: 39, rate: 42,
      titleJp: '腐食・金属製造', titleVi: 'Ăn mòn · chế tạo kim loại' },
    { id: 'ch4_05', kind: 'chapter', no: '⑤', doc: 'ch4', start: 40, end: 49, rate: 42,
      titleJp: '原子・同位体・電子配置・ハロゲン', titleVi: 'Nguyên tử · đồng vị · cấu hình e⁻ · halogen' },
    { id: 'ch4_06', kind: 'chapter', no: '⑥', doc: 'ch4', start: 50, end: 58, rate: 42,
      titleJp: '酸化数・酸化還元反応', titleVi: 'Số oxi hóa · phản ứng oxi hóa–khử' },
    { id: 'ch4_07', kind: 'chapter', no: '⑦', doc: 'ch4', start: 59, end: 63, rate: 42,
      titleJp: '物質量(mol)・化学反応・熱化学', titleVi: 'Số mol · phản ứng · nhiệt hóa học' },
    { id: 'ch4_08', kind: 'chapter', no: '⑧', doc: 'ch4', start: 64, end: 74, rate: 58,
      titleJp: '酸・塩基・物質の性質', titleVi: 'Acid · base · tính chất vật chất' },
    { id: 'ch4_09', kind: 'chapter', no: '⑨', doc: 'ch4', start: 75, end: 84, rate: 42,
      titleJp: 'DNAの構造と複製', titleVi: 'Cấu trúc & sao chép DNA' },
    { id: 'ch4_10', kind: 'chapter', no: '⑩', doc: 'ch4', start: 85, end: 95, rate: 83,
      titleJp: 'タンパク質・アミノ酸・酵素', titleVi: 'Protein · amino acid · enzyme' },
    { id: 'ch4_11', kind: 'chapter', no: '⑪', doc: 'ch4', start: 96, end: 102, rate: 42,
      titleJp: '遺伝子技術（PCR・組換え・突然変異）', titleVi: 'Công nghệ gen (PCR·tái tổ hợp·đột biến)' },
    { id: 'ch4_12', kind: 'chapter', no: '⑫', doc: 'ch4', start: 103, end: 109, rate: 33,
      titleJp: '代謝と細胞の化学組成', titleVi: 'Chuyển hóa & thành phần hóa học tế bào' },
    { id: 'ch4_appendix', kind: 'appendix', doc: 'ch4', start: 110, end: 111,
      titleJp: '略号一覧・章末○×', titleVi: 'Bảng viết tắt & ôn tập cuối chương' },
    // ===== 第5章 環境・エネルギー・技術 (98 trang) =====
    { id: 'ch5_trend', kind: 'trend', doc: 'ch5', start: 1, end: 3,
      titleJp: '目次・出題傾向', titleVi: 'Mục lục & tỷ lệ ra đề' },
    { id: 'ch5_01', kind: 'chapter', no: '①', doc: 'ch5', start: 4, end: 14, rate: 58,
      titleJp: '廃棄物・リサイクル・3R', titleVi: 'Chất thải · tái chế · 3R' },
    { id: 'ch5_02', kind: 'chapter', no: '②', doc: 'ch5', start: 15, end: 21, rate: 50,
      titleJp: '地球温暖化・パリ協定・IPCC', titleVi: 'Nóng lên toàn cầu · Paris · IPCC' },
    { id: 'ch5_03', kind: 'chapter', no: '③', doc: 'ch5', start: 22, end: 28, rate: 42,
      titleJp: '生物多様性・大気汚染', titleVi: 'Đa dạng sinh học · ô nhiễm không khí' },
    { id: 'ch5_04', kind: 'chapter', no: '④', doc: 'ch5', start: 29, end: 35, rate: 33,
      titleJp: '環境管理・SDGs・対策技術', titleVi: 'Quản lý môi trường · SDGs · công nghệ xử lý' },
    { id: 'ch5_05', kind: 'chapter', no: '⑤', doc: 'ch5', start: 36, end: 45, rate: 75,
      titleJp: 'エネルギー需給・基本計画', titleVi: 'Cung–cầu năng lượng · kế hoạch cơ bản' },
    { id: 'ch5_06', kind: 'chapter', no: '⑥', doc: 'ch5', start: 46, end: 54, rate: 67,
      titleJp: '資源（石油・ガス・水素・再エネ）', titleVi: 'Tài nguyên (dầu·khí·hydro·NL tái tạo)' },
    { id: 'ch5_07', kind: 'chapter', no: '⑦', doc: 'ch5', start: 55, end: 62, rate: 42,
      titleJp: '省エネ・新技術（スマートグリッド）', titleVi: 'Tiết kiệm NL · công nghệ mới (smart grid)' },
    { id: 'ch5_08', kind: 'chapter', no: '⑧', doc: 'ch5', start: 63, end: 72, rate: 67,
      titleJp: '科学史・技術史（年代順）', titleVi: 'Lịch sử KH–CN (theo niên đại)' },
    { id: 'ch5_09', kind: 'chapter', no: '⑨', doc: 'ch5', start: 73, end: 79, rate: 33,
      titleJp: '科学史・技術史（人物と業績）', titleVi: 'Lịch sử KH–CN (nhân vật & thành tựu)' },
    { id: 'ch5_10', kind: 'chapter', no: '⑩', doc: 'ch5', start: 80, end: 88, rate: 67,
      titleJp: '科学技術とリスク・倫理', titleVi: 'KH–CN với rủi ro · đạo đức' },
    { id: 'ch5_11', kind: 'chapter', no: '⑪', doc: 'ch5', start: 89, end: 98, rate: 33,
      titleJp: '科学技術政策・知的財産', titleVi: 'Chính sách KH–CN · sở hữu trí tuệ' },
  ],
  senmon: [],
};

/** Thư mục cha: 3 môn, kèm số chương hiện có (0 = chưa có giáo trình). */
export const TEXTBOOK_SUBJECTS = Object.values(SUBJECTS).map((s) => ({
  ...s,
  docCount: (DOCS[s.id] ?? []).length,
  chapterCount: (CHAPTERS[s.id] ?? []).filter((c) => c.kind === 'chapter').length,
}));

export function getDocs(subjectId) {
  return DOCS[subjectId] ?? [];
}

export function getChapters(subjectId) {
  return CHAPTERS[subjectId] ?? [];
}

export function getChapter(subjectId, chapterId) {
  return getChapters(subjectId).find((c) => c.id === chapterId) ?? null;
}

export function getDoc(subjectId, docId) {
  return getDocs(subjectId).find((d) => d.id === docId) ?? null;
}

export function pageCount(chapter) {
  return chapter.end - chapter.start + 1;
}

/** Nhãn hiển thị ngắn: "① 技術士制度…" / "出題傾向" / "付録". */
export function chapterLabel(chapter) {
  if (chapter.kind === 'chapter') return `${chapter.no} ${chapter.titleJp}`;
  return chapter.titleJp;
}
