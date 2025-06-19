// 강화된 mockData.js

export const lineData = Array.from({ length: 36 }, (_, i) => {
  const year = 2022 + Math.floor(i / 12);
  const month = (i % 12 + 1).toString().padStart(2, "0");
  return {
    기간: `${year}-${month}`,
    연체율: Number((1.0 + i * 0.15).toFixed(2)),
    회수율: 50 + i,
  };
});

export const barData = [];
const categories = ["카드론", "일시불", "할부", "리볼빙", "대출", "현금서비스"];
const months = Array.from({ length: 10 }, (_, i) => `2025-${(i + 1).toString().padStart(2, "0")}`);
months.forEach((month) => {
  categories.forEach((cat, i) => {
    const overdue = 1200000 + i * 300000 + i * 77777 % 300000;
    const recovered = 400000 + i * 250000 + i * 13579 % 200000;
    barData.push({
      기간: month,
      category: cat,
      avgAmount: 600000 + i * 150000,
      기준월: month,
      연체금액: overdue,
      회수금액: recovered,
      회수율: Number(((recovered / overdue) * 100).toFixed(1)),
    });
  });
});

export const pieData = Array.from({ length: 24 }, (_, i) => ({
  name: `${2023 + Math.floor(i / 12)}-${(i % 12 + 1).toString().padStart(2, "0")}`,
  value: 10 + ((i * 7) % 40),
}));

export const radarData = [];
const ageGroups = ["20대", "30대", "40대", "50대", "60대", "70대"];
const genders = ["남", "여"];
ageGroups.forEach((age) => {
  genders.forEach((gender) => {
    categories.forEach((cat, i) => {
      radarData.push({
        period: "2025-04",
        category: cat,
        age_group: age,
        gender,
        value: 20 + (i * 5 + age.charCodeAt(1) + gender.charCodeAt(0)) % 60,
      });
    });
  });
});

export const recoveryPieData = {};
months.forEach((month, i) => {
  recoveryPieData[month] = [
    { name: "미회수", value: 8 + i % 10 },
    { name: "부분 회수", value: 15 + (i * 2) % 10 },
    { name: "전액 회수", value: 20 + (i * 3) % 15 },
  ];
});

export const tableData = Array.from({ length: 500 }, (_, i) => {
  const gender = i % 2 === 0 ? "남" : "여";
  const age = `${20 + (i % 6) * 10}대`;
  const overdue = 1000000 + (i * 17123) % 1000000;
  const recovered = (i * 14579) % 900000;
  return {
    기준월: "2025-04",
    고객명: `고객${i + 1}`,
    성별: gender,
    연령: age,
    연락처: `010-${(1000 + i).toString().padStart(4, "0")}-${(3000 + i).toString().padStart(4, "0")}`,
    주소: `서울시 종로구 ${i + 1}길`,
    연체기간: `${7 + (i % 50)}일`,
    연체금액: overdue,
    회수금액: recovered,
    회수율: Number(((recovered / overdue) * 100).toFixed(1)),
    member_id: `user${i + 1}`,
  };
});
