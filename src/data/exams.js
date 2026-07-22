// Dữ liệu đề thi — port từ app.js cũ, path PDF đổi sang public/pdfs/ (ASCII).
// Dùng pdfUrl() để resolve theo BASE_URL (/LEARN-TO-DIE/ trên Pages).

export const SUBJECTS = {
  kiso: {
    id: 'kiso',
    nameJp: '基礎科目',
    nameVi: 'Môn cơ sở',
    description: '15 câu — khoa học kỹ thuật cơ bản',
  },
  tekisei: {
    id: 'tekisei',
    nameJp: '適性科目',
    nameVi: 'Môn phẩm chất',
    description: '15 câu — đạo đức kỹ sư, luật 技術士法',
  },
  senmon: {
    id: 'senmon',
    nameJp: '専門科目',
    nameVi: 'Môn chuyên ngành (建設)',
    description: '35 câu — chuyên ngành xây dựng',
  },
};

export const EXAMS = {
  kiso: [
    { id: 'R07', year: '令和7年 (2025)', qCount: 15, pdfPath: 'pdfs/kiso/16_kiso_r07.pdf' },
    { id: 'R06', year: '令和6年 (2024)', qCount: 15, pdfPath: 'pdfs/kiso/15_kiso_r06.pdf' },
    { id: 'R05', year: '令和5年 (2023)', qCount: 15, pdfPath: 'pdfs/kiso/14_kiso_r05.pdf' },
    { id: 'R04', year: '令和4年 (2022)', qCount: 15, pdfPath: 'pdfs/kiso/13_kiso_r04.pdf' },
    { id: 'R03', year: '令和3年 (2021)', qCount: 15, pdfPath: 'pdfs/kiso/12_kiso_r03.pdf' },
    { id: 'R02', year: '令和2年 (2020)', qCount: 15, pdfPath: 'pdfs/kiso/11_kiso_r02.pdf' },
    { id: 'R01_re', year: '令和元年 再試験 (2019)', qCount: 15, pdfPath: 'pdfs/kiso/10_kiso_r01_reexam.pdf' },
    { id: 'R01', year: '令和元年 (2019)', qCount: 15, pdfPath: 'pdfs/kiso/09_kiso_r01.pdf' },
    { id: 'H30', year: '平成30年 (2018)', qCount: 15, pdfPath: 'pdfs/kiso/08_kiso_h30.pdf' },
    { id: 'H29', year: '平成29年 (2017)', qCount: 15, pdfPath: 'pdfs/kiso/07_kiso_h29.pdf' },
    { id: 'H28', year: '平成28年 (2016)', qCount: 15, pdfPath: 'pdfs/kiso/06_kiso_h28.pdf' },
    { id: 'H27', year: '平成27年 (2015)', qCount: 15, pdfPath: 'pdfs/kiso/05_kiso_h27.pdf' },
    { id: 'H26', year: '平成26年 (2014)', qCount: 15, pdfPath: 'pdfs/kiso/04_kiso_h26.pdf' },
    { id: 'H25', year: '平成25年 (2013)', qCount: 15, pdfPath: 'pdfs/kiso/03_kiso_h25.pdf' },
    { id: 'H24', year: '平成24年 (2012)', qCount: 15, pdfPath: 'pdfs/kiso/02_kiso_h24.pdf' },
    { id: 'H23', year: '平成23年 (2011)', qCount: 15, pdfPath: 'pdfs/kiso/01_kiso_h23.pdf' },
  ],
  tekisei: [
    { id: 'R07', year: '令和7年 (2025)', qCount: 15, pdfPath: 'pdfs/tekisei/16_tekisei_r07.pdf' },
    { id: 'R06', year: '令和6年 (2024)', qCount: 15, pdfPath: 'pdfs/tekisei/15_tekisei_r06.pdf' },
    { id: 'R05', year: '令和5年 (2023)', qCount: 15, pdfPath: 'pdfs/tekisei/14_tekisei_r05.pdf' },
    { id: 'R04', year: '令和4年 (2022)', qCount: 15, pdfPath: 'pdfs/tekisei/13_tekisei_r04.pdf' },
    { id: 'R03', year: '令和3年 (2021)', qCount: 15, pdfPath: 'pdfs/tekisei/12_tekisei_r03.pdf' },
    { id: 'R02', year: '令和2年 (2020)', qCount: 15, pdfPath: 'pdfs/tekisei/11_tekisei_r02.pdf' },
    { id: 'R01_re', year: '令和元年 再試験 (2019)', qCount: 15, pdfPath: 'pdfs/tekisei/10_tekisei_r01_reexam.pdf' },
    { id: 'R01', year: '令和元年 (2019)', qCount: 15, pdfPath: 'pdfs/tekisei/09_tekise_r01.pdf' },
    { id: 'H30', year: '平成30年 (2018)', qCount: 15, pdfPath: 'pdfs/tekisei/08_tekisei_h30.pdf' },
    { id: 'H29', year: '平成29年 (2017)', qCount: 15, pdfPath: 'pdfs/tekisei/07_tekisei_h29.pdf' },
    { id: 'H28', year: '平成28年 (2016)', qCount: 15, pdfPath: 'pdfs/tekisei/06_tekisei_h28.pdf' },
    { id: 'H27', year: '平成27年 (2015)', qCount: 15, pdfPath: 'pdfs/tekisei/05_tekisei_h27.pdf' },
    { id: 'H26', year: '平成26年 (2014)', qCount: 15, pdfPath: 'pdfs/tekisei/04_tekisei_h26.pdf' },
    { id: 'H25', year: '平成25年 (2013)', qCount: 15, pdfPath: 'pdfs/tekisei/03_tekisei_h25.pdf' },
    { id: 'H24', year: '平成24年 (2012)', qCount: 15, pdfPath: 'pdfs/tekisei/02_tekisei_h24.pdf' },
    { id: 'H23', year: '平成23年 (2011)', qCount: 15, pdfPath: 'pdfs/tekisei/01_tekisei_h23.pdf' },
  ],
  senmon: [
    { id: 'R07', year: '令和7年 (2025)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2025.pdf' },
    { id: 'R06', year: '令和6年 (2024)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2024.pdf' },
    { id: 'R05', year: '令和5年 (2023)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2023.pdf' },
    { id: 'R04', year: '令和4年 (2022)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2022.pdf' },
    { id: 'R03', year: '令和3年 (2021)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2021.pdf' },
    { id: 'R02', year: '令和2年 (2020)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2020.pdf' },
    { id: 'R01_re', year: '令和元年 再試験 (2019)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2019_reexam.pdf' },
    { id: 'R01', year: '令和元年 (2019)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2019.pdf' },
    { id: 'H25', year: '平成25年 (2013)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2013.pdf' },
    { id: 'H24', year: '平成24年 (2012)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2012.pdf' },
    { id: 'H23', year: '平成23年 (2011)', qCount: 35, pdfPath: 'pdfs/senmon/senmon09kensetsu_2011.pdf' },
  ],
};

export function pdfUrl(pdfPath) {
  return import.meta.env.BASE_URL + pdfPath;
}
