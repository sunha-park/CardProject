export const RISK_TABS = ['저위험군', '관리군', '고위험군', 'VIP예정'];

/* ✅ 차트 데이터 */
const CHART_DATA = {
  고위험군: {
    lineBarData: [
      { category: '2024-11', male: 40, female: 45 },
      { category: '2024-12', male: 52, female: 48 },
      { category: '2025-01', male: 60, female: 63 },
      { category: '2025-02', male: 80, female: 85 },
    ],
    pieData: [
      { name: '쇼핑', value: 120 },
      { name: '공과금', value: 90 },
      { name: '외식', value: 80 },
      { name: '기타', value: 60 },
    ],
    radarData: [
      { subject: '쇼핑', A: 95, B: 90 },
      { subject: '공과금', A: 90, B: 85 },
      { subject: '외식', A: 80, B: 85 },
      { subject: '기타', A: 70, B: 75 },
    ],
  },
  관리군: {
    lineBarData: [
      { category: '2024-11', male: 20, female: 22 },
      { category: '2024-12', male: 25, female: 28 },
      { category: '2025-01', male: 23, female: 27 },
      { category: '2025-02', male: 30, female: 31 },
    ],
    pieData: [
      { name: '쇼핑', value: 100 },
      { name: '공과금', value: 80 },
      { name: '외식', value: 90 },
      { name: '기타', value: 40 },
    ],
    radarData: [
      { subject: '쇼핑', A: 80, B: 75 },
      { subject: '공과금', A: 70, B: 72 },
      { subject: '외식', A: 78, B: 74 },
      { subject: '기타', A: 60, B: 65 },
    ],
  },
  저위험군: {
    lineBarData: [
      { category: '2024-11', male: 10, female: 12 },
      { category: '2024-12', male: 15, female: 8 },
      { category: '2025-01', male: 23, female: 17 },
      { category: '2025-02', male: 27, female: 10 },
    ],
    pieData: [
      { name: '쇼핑', value: 80 },
      { name: '공과금', value: 60 },
      { name: '외식', value: 70 },
      { name: '기타', value: 50 },
    ],
    radarData: [
      { subject: '쇼핑', A: 60, B: 65 },
      { subject: '공과금', A: 55, B: 60 },
      { subject: '외식', A: 58, B: 65 },
      { subject: '기타', A: 50, B: 55 },
    ],
  },
  VIP예정: {
    lineBarData: [
      { category: '2024-11', male: 5, female: 7 },
      { category: '2024-12', male: 15, female: 18 },
      { category: '2025-01', male: 25, female: 28 },
      { category: '2025-02', male: 40, female: 45 },
    ],
    pieData: [
      { name: '쇼핑', value: 50 },
      { name: '공과금', value: 40 },
      { name: '외식', value: 30 },
      { name: '기타', value: 20 },
    ],
    radarData: [
      { subject: '쇼핑', A: 40, B: 45 },
      { subject: '공과금', A: 35, B: 38 },
      { subject: '외식', A: 30, B: 32 },
      { subject: '기타', A: 25, B: 28 },
    ],
  },
};

export const getChartDataByRisk = (risk) => CHART_DATA[risk] || CHART_DATA['저위험군'];

/* ✅ 유틸 */
const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/* ✅ 연속 3개월 이상 0원 사용 → 이탈 위험 */
const hasThreeConsecutiveZeroMonths = (usageArray) => {
  let count = 0;
  for (let i = 0; i < usageArray.length; i++) {
    if (usageArray[i] === 0) {
      count++;
      if (count >= 3) return true;
    } else {
      count = 0;
    }
  }
  return false;
};

/* ✅ VIP 예정 조건 */
const isVipCandidate = (usage, score) => {
  const isIncreasing = usage.every((v, i, arr) => i === 0 || v >= arr[i - 1]);
  const avg = usage.reduce((a, b) => a + b, 0) / usage.length;
  return isIncreasing && avg >= 200000 && score >= 80;
};

/* ✅ rowData – 2만 명 생성 */
export const rowData = Array.from({ length: 20000 }, (_, i) => {
  const name = `고객${i + 1}`;
  const usage = Array.from({ length: 16 }, () => getRandom(0, 300000)); // 2024.01 ~ 2025.04
  const visitCount = getRandom(0, 20);
  const vipScore = getRandom(0, 100);

  const avgSpend = Math.round(usage.reduce((a, b) => a + b, 0) / usage.length);
  const amount = usage[15]; // 마지막 월 사용액

  const usageHistory = {};
  for (let m = 0; m < 16; m++) {
    const date = new Date(2024, 0); // 2024-01 기준
    date.setMonth(date.getMonth() + m);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    usageHistory[key] = usage[m];
  }

  let risk = '관리군';
  if (isVipCandidate(usage, vipScore)) {
    risk = 'VIP예정';
  } else if (hasThreeConsecutiveZeroMonths(usage)) {
    risk = '고위험군';
  } else if (avgSpend < 100000) {
    risk = '저위험군';
  }

  return {
    name,
    risk,
    amount,
    avgSpend,
    visitCount,
    vipScore,
    usageHistory,
  };
});