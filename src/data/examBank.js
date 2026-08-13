// SINH TỰ ĐỘNG bởi scripts/build_examdata.py — ĐỪNG SỬA TAY.
// Chạy lại sau mỗi lần bổ sung đề: python scripts/build_examdata.py

export const BANK_TOTAL = 1189;

export const SUBJECT_META = {
  "KISO": {
    "ja": "基礎科目",
    "vi": "Kiến thức cơ sở",
    "short": "基礎"
  },
  "TEKISEI": {
    "ja": "適性科目",
    "vi": "Đạo đức nghề nghiệp",
    "short": "適性"
  },
  "KENSETSU": {
    "ja": "専門科目（建設部門）",
    "vi": "Chuyên ngành xây dựng",
    "short": "専門"
  }
};

export const CATEGORIES = {
  "CON": {
    "ja": "コンクリート",
    "vi": "Bê tông",
    "subject": "KENSETSU"
  },
  "CPL": {
    "ja": "施工計画",
    "vi": "Kế hoạch thi công",
    "subject": "KENSETSU"
  },
  "CST": {
    "ja": "海岸",
    "vi": "Công trình ven biển",
    "subject": "KENSETSU"
  },
  "ENV": {
    "ja": "建設環境",
    "vi": "Môi trường xây dựng",
    "subject": "KENSETSU"
  },
  "ERO": {
    "ja": "砂防",
    "vi": "Phòng chống sạt lở",
    "subject": "KENSETSU"
  },
  "GEO": {
    "ja": "土質及び基礎",
    "vi": "Địa kỹ thuật & Nền móng",
    "subject": "KENSETSU"
  },
  "HWY": {
    "ja": "道路",
    "vi": "Đường bộ",
    "subject": "KENSETSU"
  },
  "KISO_ANALYSIS": {
    "ja": "解析に関するもの",
    "vi": "Phân tích",
    "subject": "KISO"
  },
  "KISO_DESIGN": {
    "ja": "設計・計画に関するもの",
    "vi": "Thiết kế và kế hoạch",
    "subject": "KISO"
  },
  "KISO_ENV": {
    "ja": "環境・エネルギー・技術に関するもの",
    "vi": "Môi trường, năng lượng, kỹ thuật",
    "subject": "KISO"
  },
  "KISO_INFO": {
    "ja": "情報・論理に関するもの",
    "vi": "Thông tin và logic",
    "subject": "KISO"
  },
  "KISO_MATERIAL": {
    "ja": "材料・化学・バイオに関するもの",
    "vi": "Vật liệu, hóa học, sinh học",
    "subject": "KISO"
  },
  "PRT": {
    "ja": "港湾及び空港",
    "vi": "Cảng & Sân bay",
    "subject": "KENSETSU"
  },
  "PWR": {
    "ja": "電力土木",
    "vi": "Công trình điện",
    "subject": "KENSETSU"
  },
  "RIV": {
    "ja": "河川",
    "vi": "Công trình sông",
    "subject": "KENSETSU"
  },
  "RWY": {
    "ja": "鉄道",
    "vi": "Đường sắt",
    "subject": "KENSETSU"
  },
  "STL": {
    "ja": "鋼構造",
    "vi": "Kết cấu thép",
    "subject": "KENSETSU"
  },
  "TEKISEI_ENV": {
    "ja": "環境配慮",
    "vi": "Bảo vệ môi trường",
    "subject": "TEKISEI"
  },
  "TEKISEI_ETHICS": {
    "ja": "技術者倫理",
    "vi": "Đạo đức kỹ sư",
    "subject": "TEKISEI"
  },
  "TEKISEI_LAW": {
    "ja": "技術士法",
    "vi": "Luật kỹ sư",
    "subject": "TEKISEI"
  },
  "TEKISEI_SAFETY": {
    "ja": "安全・リスク管理",
    "vi": "An toàn và quản lý rủi ro",
    "subject": "TEKISEI"
  },
  "TEKISEI_SOCIAL": {
    "ja": "社会的責任",
    "vi": "Trách nhiệm xã hội",
    "subject": "TEKISEI"
  },
  "TNL": {
    "ja": "トンネル",
    "vi": "Đường hầm",
    "subject": "KENSETSU"
  },
  "URB": {
    "ja": "都市計画",
    "vi": "Quy hoạch đô thị",
    "subject": "KENSETSU"
  }
};

// Danh sách năm sinh TỪ DỮ LIỆU — thêm đề năm mới chỉ cần chạy lại script.
export const EXAM_YEARS = [
  {
    "year": 2025,
    "wa": "令和7年度",
    "subjects": {
      "KENSETSU": 35,
      "TEKISEI": 15,
      "KISO": 30
    },
    "total": 80
  },
  {
    "year": 2024,
    "wa": "令和6年度",
    "subjects": {
      "KENSETSU": 35,
      "KISO": 30,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2023,
    "wa": "令和5年度",
    "subjects": {
      "KISO": 30,
      "KENSETSU": 35,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2022,
    "wa": "令和4年度",
    "subjects": {
      "KISO": 30,
      "KENSETSU": 35,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2021,
    "wa": "令和3年度",
    "subjects": {
      "KISO": 30,
      "KENSETSU": 35,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2020,
    "wa": "令和2年度",
    "subjects": {
      "KISO": 30,
      "KENSETSU": 35,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2019,
    "wa": "令和元年度",
    "subjects": {
      "KISO": 30,
      "KENSETSU": 35,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2018,
    "wa": "平成30年度",
    "subjects": {
      "KISO": 30,
      "KENSETSU": 35,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2017,
    "wa": "平成29年度",
    "subjects": {
      "KENSETSU": 35,
      "KISO": 30,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2016,
    "wa": "平成28年度",
    "subjects": {
      "KENSETSU": 35,
      "KISO": 30,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2015,
    "wa": "平成27年度",
    "subjects": {
      "KISO": 30,
      "KENSETSU": 35,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2014,
    "wa": "平成26年度",
    "subjects": {
      "KENSETSU": 35,
      "KISO": 30,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2013,
    "wa": "平成25年度",
    "subjects": {
      "KENSETSU": 35,
      "KISO": 30,
      "TEKISEI": 15
    },
    "total": 80
  },
  {
    "year": 2012,
    "wa": "平成24年度",
    "subjects": {
      "KENSETSU": 35,
      "KISO": 25,
      "TEKISEI": 15
    },
    "total": 75
  },
  {
    "year": 2011,
    "wa": "平成23年度",
    "subjects": {
      "KENSETSU": 35,
      "KISO": 25,
      "TEKISEI": 14
    },
    "total": 74
  }
];

const BASE = import.meta.env.BASE_URL;
export const examDataUrl = (year, subject) =>
  `${BASE}exam-data/${year}-${subject}.json`;
export const diagramUrl = (name) => `${BASE}exam-data/diagrams/${name}`;
