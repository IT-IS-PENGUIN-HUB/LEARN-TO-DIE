# Tần suất từ vựng trong 43 đề thi thật

Đếm từng từ trong kho từ vựng xem xuất hiện bao nhiêu lần trong text của 43 đề
(gồm cả phần đề bài và phần giải thích 解説).

**Cột nào quan trọng nhất:** `Kỳ có / tổng kỳ môn`. Một từ ra 40 lần trong đúng
một kỳ thì chỉ là chủ đề của năm đó; một từ ra ở 14/16 kỳ mới thật sự là từ phải thuộc.

**Hai điểm cần biết khi đọc số:**

1. Tiếng Nhật không có dấu cách nên đây là đếm chuỗi con. Từ **1 ký tự (đánh dấu ⚠)**
   bị đếm lố vì nằm bên trong từ dài hơn — `基` được tính cả trong 基礎・基本・基準.
   Từ 2 ký tự trở lên thì con số đáng tin.
2. Động từ / tính từ bị chia đuôi trong đề nên dạng nguyên thể đếm ra ít hoặc bằng 0.
   Cột `stem_hits` trong file CSV đếm theo gốc từ (見合う → 見合) để bù chỗ này.

Dữ liệu đầy đủ cho cả 1095 từ: [tan-suat-tu-vung.csv](tan-suat-tu-vung.csv) (mở bằng Excel).

## 適性科目 — 284 từ, 16 kỳ thi

- Ra ở **mọi kỳ** (16/16): **6 từ**
- Chưa từng thấy trong đề nào: **11 từ** (3%)

### 50 từ hay thi nhất

| # | Từ | Cách đọc | Nghĩa | Kỳ có / tổng kỳ môn | Lần trong môn | Tổng 43 đề |
|---|---|---|---|---|---|---|
| 1 | 倫理 | りんり | Đạo đức nghề nghiệp, luân lý | 16/16 | 191 | 197 |
| 2 | 義務 | ぎむ | nghĩa vụ, bổn phận | 16/16 | 142 | 169 |
| 3 | 組織 | そしき | tổ chức | 16/16 | 142 | 154 |
| 4 | 責務 | せきむ | (trách vụ) nhiệm vụ, bổn phận | 16/16 | 70 | 73 |
| 5 | 努め | つとめ | công việc, bổn phận, nhiệm vụ, sự cố g… | 16/16 | 60 | 62 |
| 6 | 図る | はかる | lên kế hoạch, âm mưu, toan tính | 16/16 | 52 | 107 |
| 7 | 不適切 | ふてきせつ | không phù hợp | 15/16 | 76 | 446 |
| 8 | 当該 | とうがい | (Đương cai) nói trên, liên quan, tương… | 15/16 | 72 | 117 |
| 9 | 登録 | とうろく | (Đăng lục) sự đăng ký | 15/16 | 69 | 89 |
| 10 | 公衆 | こうしゅう | công chúng, quần chúng, cộng đồng | 15/16 | 50 | 53 |
| 11 | 正当 | せいとう | chính đáng, hợp pháp | 15/16 | 30 | 34 |
| 12 | 盗用 | とうよう | đạo văn, sao chép, ăn cắp (ý tưởng) | 15/16 | 29 | 29 |
| 13 | 顧客 | こきゃく | khách hàng, khách, chủ đầu tư, bên đặt… | 14/16 | 76 | 77 |
| 14 | 負う | おう | mang, gánh vác, chịu đựng | 14/16 | 19 | 22 |
| 15 | 規範 | きはん | (quy phạm) quy phạm, chuẩn mực | 13/16 | 64 | 68 |
| 16 | 与える | あたえる | cho, ban, cung cấp, gây ra | 13/16 | 25 | 39 |
| 17 | 持続可能 | じぞくかのう | bền vững, có khả năng duy trì | 12/16 | 49 | 68 |
| 18 | 措置 | そち | (Thố trí) biện pháp | 12/16 | 45 | 65 |
| 19 | 利害 | りがい | Lợi ích và thiệt hại; Quyền lợi | 12/16 | 34 | 38 |
| 20 | 遂行 | すいこう | thực hiện, thi hành, tiến hành, hoàn t… | 12/16 | 25 | 27 |
| 21 | 傷つけ | きずつけ | làm tổn thương, gây thương tích, làm đ… | 12/16 | 17 | 17 |
| 22 | 意匠 | いしょう | kiểu dáng công nghiệp; ý tưởng thiết k… | 11/16 | 24 | 25 |
| 23 | 商標 | しょうひょう | nhãn hiệu, thương hiệu | 11/16 | 20 | 22 |
| 24 | 開示 | かいじ | tiết lộ, thông báo | 11/16 | 12 | 19 |
| 25 | 漏らし | もらし | (lậu) làm lộ, rò rỉ | 11/16 | 12 | 12 |
| 26 | 守秘 | しゅひ | bảo mật, giữ bí mật | 10/16 | 25 | 25 |
| 27 | 綱領 | こうりょう | cương lĩnh, nguyên tắc cơ bản, đề cươn… | 10/16 | 23 | 23 |
| 28 | 資質向上 | ししつこうじょう | Nâng cao năng lực/phẩm chất chuyên môn | 10/16 | 21 | 21 |
| 29 | 倫理綱領 | りんりこうりょう | (Luân lý cương lĩnh) Bộ quy tắc đạo đứ… | 10/16 | 20 | 20 |
| 30 | 独自 | どくじ | độc đáo, riêng biệt, tự mình | 10/16 | 19 | 24 |
| 31 | 不具合 | ふぐあい | (bất cụ hợp) những lỗi, hỏng hóc | 10/16 | 14 | 20 |
| 32 | 雇用 | こよう | (Cố dụng) Tuyển dụng, thuê mướn | 9/16 | 27 | 29 |
| 33 | 重視 | じゅうし | coi trọng, xem trọng, chú trọng, đặt n… | 9/16 | 20 | 22 |
| 34 | 知見 | ちけん | (tri kiến) Sự hiểu biết, tri thức | 9/16 | 18 | 20 |
| 35 | 文部科学省 | もんぶかがくしょう | Bộ Giáo dục, Văn hóa, Thể thao, Khoa h… | 9/16 | 18 | 18 |
| 36 | 消費者庁 | しょうひしゃちょう | (tiêu phí giả thính) cơ quan người tiê… | 9/16 | 17 | 17 |
| 37 | 破壊 | はかい | sự phá hoại, sự hủy diệt, sự phá hủy | 9/16 | 16 | 121 |
| 38 | 資する | しする | (Tư) Giúp đỡ, viện trợ, đóng góp | 9/16 | 16 | 21 |
| 39 | 促進 | そくしん | (xúc tiến) xúc tiến, thúc đẩy | 9/16 | 15 | 51 |
| 40 | 特許庁 | とっきょちょう | (Đặc hứa sảnh) Nơi cấp bằng sáng chế | 9/16 | 12 | 12 |
| 41 | 掲げる | かかげる | giương lên, treo lên, nêu cao (biểu ng… | 9/16 | 9 | 9 |
| 42 | 模倣 | もほう | (mô phỏng) sự bắt chước, sao chép | 9/16 | 9 | 9 |
| 43 | 履行 | りこう | (Lý hành)Sự thực hiện, thi hành | 8/16 | 20 | 20 |
| 44 | 阻害 | そがい | (trở hại) cản trở, gây trở ngại | 8/16 | 15 | 22 |
| 45 | 進展 | しんてん | (tiến triển) sự tiến triển | 8/16 | 13 | 27 |
| 46 | 不名誉 | ふめいよ | tai tiếng, ô nhục, mất danh dự | 8/16 | 12 | 12 |
| 47 | 概念 | がいねん | (khái niệm) Khái niệm | 8/16 | 11 | 22 |
| 48 | 取引先 | とりひきさき | Khách hàng | 8/16 | 11 | 11 |
| 49 | 失墜 | しっつい | sự sụp đổ, sự mất đi (quyền uy, danh t… | 8/16 | 10 | 10 |
| 50 | 促す | うながす | thúc đẩy, xúc tiến, khuyến khích | 8/16 | 9 | 12 |

<details><summary>Từ chưa từng xuất hiện trong đề (11)</summary>

ハザード同定 · 多角的 · 委ねる · 後を絶たない · 忖度 · 自問 · 課す · 造り込まれる · 重症病 · 鍛える · 陥る

</details>

## 基礎科目 — 490 từ, 16 kỳ thi

- Ra ở **mọi kỳ** (16/16): **7 từ**
- Chưa từng thấy trong đề nào: **23 từ** (4%)

### 50 từ hay thi nhất

| # | Từ | Cách đọc | Nghĩa | Kỳ có / tổng kỳ môn | Lần trong môn | Tổng 43 đề |
|---|---|---|---|---|---|---|
| 1 | 基 ⚠ | き | (cơ) gốc, nhóm (hóa học); nền tảng | 16/16 | 269 | 768 |
| 2 | 記述 | きじゅつ | miêu tả, mô tả, sự ghi chép | 16/16 | 232 | 817 |
| 3 | 組合せ | くみあわせ | (tổ hợp) tổ hợp, sự kết hợp | 16/16 | 147 | 296 |
| 4 | 数値 | すうち | (số trị) giá trị số, trị số | 16/16 | 93 | 95 |
| 5 | 存在 | そんざい | (tồn tại) tồn tại | 16/16 | 56 | 109 |
| 6 | 解析 | かいせき | (giải tích) phân tích, giải tích | 16/16 | 50 | 77 |
| 7 | 単純 | たんじゅん | (đơn thuần) đơn giản | 16/16 | 46 | 68 |
| 8 | 炭素 | たんそ | cacbon | 14/16 | 76 | 94 |
| 9 | 消費 | しょうひ | (tiêu phí) tiêu thụ, tiêu dùng | 14/16 | 72 | 175 |
| 10 | 感覚 | かんかく | giác quan, cảm giác | 14/16 | 63 | 63 |
| 11 | 廃 ⚠ | はい | (phế) phế, bỏ đi (tiền tố: phế thải, p… | 13/16 | 77 | 149 |
| 12 | 真 ⚠ | しん | True | 13/16 | 35 | 44 |
| 13 | 平均 | へいきん | (bình quân) trung bình | 12/16 | 121 | 193 |
| 14 | 信頼 | しんらい | tín nhiệm | 12/16 | 77 | 102 |
| 15 | 関数 | かんすう | (quan số) hàm số | 12/16 | 61 | 76 |
| 16 | 引張 | ひっぱり | (dẫn trương) kéo, lực kéo (ứng suất ké… | 12/16 | 57 | 93 |
| 17 | 廃棄 | はいき | Tiêu hủy, loại bỏ | 12/16 | 55 | 120 |
| 18 | 代入 | だいにゅう | sự thay thế, sự gán (giá trị) | 12/16 | 27 | 40 |
| 19 | 年代 | ねんだい | (niên đại) niên đại, thời kỳ, thập niê… | 12/16 | 22 | 25 |
| 20 | 有限要素 | ゆうげんようそ | (hữu hạn yếu tố) phần tử hữu hạn | 12/16 | 19 | 19 |
| 21 | 進数 | しんすう | (tiến số) hệ đếm, cơ số (2進数: hệ nhị p… | 11/16 | 100 | 100 |
| 22 | 信頼度 | しんらいど | độ tin cậy | 11/16 | 57 | 58 |
| 23 | 並列 | へいれつ | song song, song hành | 11/16 | 29 | 29 |
| 24 | 断面積 | だんめんせき | (đoạn diện tích) diện tích mặt cắt nga… | 11/16 | 23 | 58 |
| 25 | 形状 | けいじょう | Hình thù | 11/16 | 17 | 67 |
| 26 | 再生可能 | さいせいかのう | (tái sinh khả năng) có thể tái tạo | 10/16 | 25 | 48 |
| 27 | 依存 | いぞん | sự phụ thuộc, sự lệ thuộc | 10/16 | 16 | 32 |
| 28 | 規模 | きぼ | (quy mô) quy mô | 10/16 | 15 | 89 |
| 29 | 桁 ⚠ | けた | chữ số, hàng (số); dầm (cầu) | 9/16 | 55 | 72 |
| 30 | 近似 | きんじ | (cận tự) xấp xỉ, gần đúng | 9/16 | 33 | 35 |
| 31 | 削減 | さくげん | (tước giảm) cắt giảm | 9/16 | 25 | 66 |
| 32 | 改良 | かいりょう | (cải lương) cải tạo, cải tiến | 9/16 | 10 | 33 |
| 33 | 脂 ⚠ | あぶら | Nhựa cây, mỡ | 8/16 | 48 | 54 |
| 34 | 整数 | せいすう | (chỉnh số) số nguyên | 8/16 | 28 | 28 |
| 35 | 領域 | りょういき | lĩnh vực khu vực | 8/16 | 27 | 53 |
| 36 | 偏差 | へんさ | Độ lệch, Sai số | 8/16 | 27 | 29 |
| 37 | 多様性 | たようせい | tính đa dạng | 8/16 | 25 | 71 |
| 38 | 窒素 | ちっそ | (trất tố) nitơ | 8/16 | 20 | 27 |
| 39 | 直列 | ちょくれつ | nối tiếp, mắc nối tiếp (điện) | 8/16 | 18 | 18 |
| 40 | 推進 | すいしん | đẩy mạnh, xúc tiến | 8/16 | 17 | 91 |
| 41 | 蒸気機関 | じょうききかん | (chưng khí cơ quan) động cơ hơi nước | 8/16 | 12 | 12 |
| 42 | 近年 | きんねん | (cận niên) những năm gần đây | 8/16 | 11 | 33 |
| 43 | 超 ⚠ | ちょう | (siêu) siêu, vượt quá | 8/16 | 9 | 73 |
| 44 | 途上国 | とじょうこく | nước đang phát triển | 8/16 | 9 | 21 |
| 45 | 論理積 | ろんりせき | Phép toán logic and | 7/16 | 23 | 23 |
| 46 | 係る | かかる | Liên quan, liên hệ | 7/16 | 20 | 78 |
| 47 | 論理和 | ろんりわ | phép toán logic OR | 7/16 | 20 | 20 |
| 48 | 欠陥 | けっかん | Khuyết tật / Lỗi | 7/16 | 19 | 127 |
| 49 | 任意 | にんい | (nhậm ý) tùy ý, bất kỳ | 7/16 | 13 | 19 |
| 50 | 環境保全 | かんきょうほぜん | (hoàn cảnh bảo toàn) bảo vệ môi trường | 7/16 | 12 | 25 |

<details><summary>Từ chưa từng xuất hiện trong đề (23)</summary>

アロ ーダイアグラム · 一人当たり · 償う · 兼ねる · 創る · 危惧 · 担ぐ · 振り返る · 捏ねる · 整う · 棄てる · 永い · 甚だしい · 疑似 · 硬性 · 競う · 蓄える · 見据える · 踏む · 退く · 離職 · 黙る · ２次元

</details>

## 専門科目 — 321 từ, 11 kỳ thi

- Ra ở **mọi kỳ** (11/11): **17 từ**
- Chưa từng thấy trong đề nào: **6 từ** (1%)

### 50 từ hay thi nhất

| # | Từ | Cách đọc | Nghĩa | Kỳ có / tổng kỳ môn | Lần trong môn | Tổng 43 đề |
|---|---|---|---|---|---|---|
| 1 | 河川 | かせん | (hà xuyên) sông ngòi | 11/11 | 185 | 189 |
| 2 | 水頭 | すいとう | (thủy đầu) cột nước (thủy lực) | 11/11 | 127 | 127 |
| 3 | 施設 | しせつ | (thi thiết) cơ sở, công trình, thiết b… | 11/11 | 125 | 158 |
| 4 | 値 ⚠ | あたい | (trị) giá trị, trị số | 11/11 | 119 | 511 |
| 5 | 土砂 | どしゃ | (thổ sa) đất cát, bùn cát | 11/11 | 103 | 108 |
| 6 | 堤防 | ていぼう | (đê phòng) đê | 11/11 | 101 | 102 |
| 7 | 種 ⚠ | しゅ | (chủng) loài, chủng loại | 11/11 | 97 | 234 |
| 8 | 浸透 | しんとう | (tẩm thấu) sự thấm, thẩm thấu | 11/11 | 96 | 102 |
| 9 | 軌道 | きどう | (quỹ đạo) đường ray, quỹ đạo | 11/11 | 62 | 64 |
| 10 | 抑制 | よくせい | ức chế, kìm hãm | 11/11 | 61 | 86 |
| 11 | 掘削 | くっさく | (quật tước) đào, khai đào | 11/11 | 59 | 62 |
| 12 | 市街地 | しがいち | (thị nhai địa) khu đô thị, khu phố xá | 11/11 | 48 | 48 |
| 13 | 疲労 | ひろう | (Bì lao)hiện tượng mỏi | 11/11 | 42 | 69 |
| 14 | 特性 | とくせい | đặc trưng, đặc tính | 11/11 | 39 | 72 |
| 15 | 常流 | じょうりゅう | (thường lưu) dòng êm, dòng chảy dưới p… | 11/11 | 33 | 33 |
| 16 | 手法 | しゅほう | (thủ pháp) phương pháp, thủ pháp | 11/11 | 31 | 83 |
| 17 | 上昇 | じょうしょう | (thượng thăng) sự tăng lên, dâng lên | 11/11 | 23 | 49 |
| 18 | 区域 | くいき | (khu vực) khu vực, vùng | 10/11 | 161 | 161 |
| 19 | 形成 | けいせい | (Hình thành) Sự hình thành | 10/11 | 76 | 138 |
| 20 | 管路 | かんろ | (quản lộ) đường ống, tuyến ống | 10/11 | 60 | 62 |
| 21 | 流水 | りゅうすい | Nước chảy, dòng nước | 10/11 | 58 | 58 |
| 22 | 保全 | ほぜん | (bảo toàn) sự bảo toàn, bảo vệ duy trì | 10/11 | 54 | 139 |
| 23 | 継手 | つぎて | (Kế thủ)Mối nối, khớp nối | 10/11 | 43 | 43 |
| 24 | 塑性 | そせい | (tố tính) tính dẻo | 10/11 | 40 | 57 |
| 25 | 指定 | してい | (chỉ định) chỉ định | 10/11 | 39 | 51 |
| 26 | 算定 | さんてい | phép tính | 10/11 | 39 | 44 |
| 27 | 都道府県 | とどうふけん | Chính quyền cấp tỉnh | 10/11 | 30 | 31 |
| 28 | 検討 | けんとう | (kiểm thảo) sự xem xét, nghiên cứu cân… | 10/11 | 29 | 57 |
| 29 | 被覆 | ひふく | (bị phúc) Lớp phủ, lớp bọc bảo vệ (vd:… | 10/11 | 29 | 29 |
| 30 | 間隙比 | かんげきひ | (gian khích bỉ) hệ số rỗng | 10/11 | 28 | 28 |
| 31 | 市町村 | しちょうそん | Thành phố - thị trấn - làng (đơn vị hà… | 10/11 | 27 | 30 |
| 32 | 選定 | せんてい | (tuyển định) lựa chọn, tuyển chọn | 10/11 | 27 | 28 |
| 33 | 堆積 | たいせき | (đôi tích) sự bồi tích, lắng đọng, trầ… | 10/11 | 24 | 24 |
| 34 | 流体 | りゅうたい | (lưu thể) chất lưu (chất lỏng và chất … | 10/11 | 17 | 20 |
| 35 | 接触 | せっしょく | Tiếp xúc | 10/11 | 17 | 18 |
| 36 | 上流 | じょうりゅう | (thượng lưu) thượng lưu, thượng nguồn | 10/11 | 16 | 18 |
| 37 | 圧密 | あつみつ | Nước thoát ra ngoài, thể tích giảm. Cố… | 9/11 | 93 | 93 |
| 38 | 策定 | さくてい | (sách định) xác lập, vẽ ra kế hoạch | 9/11 | 36 | 70 |
| 39 | 原価 | げんか | (nguyên giá) giá vốn, giá thành | 9/11 | 30 | 39 |
| 40 | 排出 | はいしゅつ | Thải ra, thoát ra | 9/11 | 27 | 166 |
| 41 | 大規模 | だいきぼ | (đại quy mô) quy mô lớn | 9/11 | 26 | 32 |
| 42 | 案 ⚠ | あん | (án) phương án, dự thảo | 9/11 | 25 | 127 |
| 43 | 含水比 | がんすいひ | (hàm thuỷ bỉ)hàm lượng nước | 9/11 | 25 | 25 |
| 44 | 動水勾配 | どうすいこうばい | (động thủy câu phối) độ dốc thủy lực, … | 9/11 | 21 | 21 |
| 45 | 凍害 | とうがい | (đống hại) Thiệt hại do sương giá | 9/11 | 19 | 19 |
| 46 | 浮遊 | ふゆう | (phù du) sự lơ lửng, trôi nổi | 9/11 | 16 | 23 |
| 47 | 乾燥密度 | かんそうみつど | (kền táo mật độ) mật độ khô | 9/11 | 16 | 16 |
| 48 | 接続 | せつぞく | (tiếp tục) sự kết nối, đấu nối | 9/11 | 12 | 35 |
| 49 | 舗装 | ほそう | (phô trang) mặt đường, lát mặt đường | 8/11 | 82 | 82 |
| 50 | 腐食 | ふしょく | (Hủ thực)ăn mòn | 8/11 | 55 | 75 |

<details><summary>Từ chưa từng xuất hiện trong đề (6)</summary>

くい打ち · 分泌状況 · 換地処分 · 援助 · 絡み合う · 道路盤

</details>
