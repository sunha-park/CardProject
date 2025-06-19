/* --------------------------------------------------------------------------
 *  mock 데이터 – Line / Bar / Pie / Radar / Table 전부 포함
 * -------------------------------------------------------------------------- */

/* 1) 월 배열 : 2024-01 ~ 2025-04 --------------------------------------- */
export const months = Array.from({ length: 16 }, (_, i) => {
  const y = 2024 + Math.floor(i / 12);
  const m = String((i % 12) + 1).padStart(2, '0');
  return `${y}-${m}`;
});
export const months16 = months;          // 페이지 코드와 호환용

/* 2) 공통 상수 --------------------------------------------------------- */
export const termGroups = ['30일 미만', '30~60일', '60~90일', '90일 이상'];
export const categories = ['카드론', '일시불', '할부', '리볼빙', '대출'];
const   ageGroups  = ['20대', '30대', '40대', '50대', '60대'];

/* ▸ “일수 → 구간” ------------------------------------------------------ */
const toTerm = (days) => {
  if (days < 30) return termGroups[0];
  if (days < 60) return termGroups[1];
  if (days < 90) return termGroups[2];
  return termGroups[3];
};

/* ======================================================================
 * ➊ 고객 10 000 명 프로필
 *    · 1.3 %  (130명)  : 연속 연체(cont)
 *    · 2.3 %  (230명)  : 간헐 연체(intm)
 *    · 96.4 % (나머지) : 무연체(clean)
 * ====================================================================== */
const TOTAL = 23_253;

 /** 페이지에서 사용하기 위한 총 고객 수 상수 */
 export const TOTAL_CUSTOMERS = TOTAL;

const CONT  = 130;              // 1.3 %
const INTM  = 230;              // 2.3 %
const customers = Array.from({ length: TOTAL }, (_, i) => {
  const id     = `C-${String(i + 1).padStart(5, '0')}`;
  const gender = i % 2 ? '여' : '남';
  const age    = ageGroups[i % ageGroups.length];
  let type     = 'clean';
  if (i < CONT)             type = 'cont';   // 지속
  else if (i < CONT + INTM) type = 'intm';   // 간헐
  return { id, gender, age, type };
});

/* ➋ 월별 × 고객별 연체 히스토리 --------------------------------------- */
const monthlyHist = {};         // { '2024-01': { id:{days,overdue,recovered} … } … }
months.forEach(m => { monthlyHist[m] = {}; });

customers.forEach(cust => {
  months.forEach(mon => {
    const store = monthlyHist[mon];

    /* 연체 발생 여부 */
    let isDelinquent = false;
    if (cust.type === 'cont')        isDelinquent = true;             // 매월
    else if (cust.type === 'intm')   isDelinquent = Math.random() < 0.35; // 35 %
    /* clean ⇒ false */

    if (!isDelinquent) return;

    /* 연체 세부 정보 */
    const days      = Math.floor(Math.random() * 120) + 1;            // 1-120일
    const overdue   = Math.floor(Math.random() * 3_000_000 + 200_000);
    const recovered = Math.random() < 0.2
      ? overdue                                        // 20 % 전액 회수
      : Math.floor(overdue * Math.random());           // 부분 회수

    store[cust.id] = { days, overdue, recovered };
  });
});

/* ======================================================================
 * ➌  그래프 & 표용 mock 배열
 * ====================================================================== */

/* 3) LineChart (기간 모드) – 월별 연체율(%) --------------------------- */
export const mockLineData = months.map(mon => {
  const delinCnt = Object.keys(monthlyHist[mon]).length;
  return {
    기간   : mon,
    연체율 : +((delinCnt / TOTAL) * 100).toFixed(2),
  };
});

/* 4) LineChart (회수율 모드) – 월·일수 샘플 -------------------------- */
const recoverySamples = [];
months.forEach(mon => {
  const ids = Object.keys(monthlyHist[mon]).slice(0, 30); // 최대 30 샘플
  ids.forEach(id => {
    const r = monthlyHist[mon][id];
    recoverySamples.push({
      기간        : mon,
      연체일수     : r.days,
      연체일구간   : toTerm(r.days),
      회수율       : Math.floor((r.recovered / r.overdue) * 100),
    });
  });
});
mockLineData.push(...recoverySamples);       // 한 배열에 통합

/* 5) BarChart (period) – 월·카테고리별 평균 연체금액 ----------------- */
const periodBar = categories.flatMap(cat =>
  months.map(mon => {
    const relCust = customers.filter(c =>
      c.type !== 'clean' &&
      Number(c.id.slice(-1)) % categories.length === categories.indexOf(cat));
    const list = relCust
      .map(c => monthlyHist[mon][c.id])
      .filter(Boolean);
    const avg = list.length
      ? Math.floor(list.reduce((s,r)=>s + r.overdue, 0) / list.length)
      : 0;
    return { 기간: mon, category: cat, avgAmount: avg };
  })
);

/* 6) BarChart & PieChart (recovery) ---------------------------------- */
export const mockRecoveryPieData = {};
const recoveryBar = [];

months.forEach(mon => {
  const hist  = monthlyHist[mon];
  const none  = Object.values(hist).filter(r => r.recovered === 0).length;
  const full  = Object.values(hist).filter(r => r.recovered === r.overdue).length;
  const part  = Object.keys(hist).length - none - full;

  mockRecoveryPieData[mon] = [
    { name:'미회수',   value: none },
    { name:'부분 회수', value: part },
    { name:'전액 회수', value: full },
  ];

    /* ── ② BarChart용 : 4구간 × 5카테고리 전부 출력 ------------------- */
  termGroups.forEach(term => {
    categories.forEach(cat => {
     /* 이번 (월·구간·카테고리)에 해당하는 고객 id */
      const ids = Object.keys(hist).filter(id => {
        const r = hist[id];
        return r && toTerm(r.days) === term &&
               Number(id.slice(-2)) % categories.length === categories.indexOf(cat);
      });      /* 실제 레코드가 있으면 합계/평균을, 없으면 전부 0 */      let over = 0, rec = 0, rate = 0;      if (ids.length) {        ids.forEach(id => {          over += hist[id].overdue;          rec  += hist[id].recovered;        });        rate = Math.floor((rec / over) * 100);      }      recoveryBar.push({        기준월     : mon,        category   : cat,        연체금액    : over,        회수금액    : rec,        회수율      : rate,        연체일구간  : term,  // ← 고정 구간
      });
    });
  });
});

/* 7) BarChart 통합 --------------------------------------------------- */
export const mockBarData = [...periodBar, ...recoveryBar];

/* 8) PieChart (period) – 월별 연체 인원 ----------------------------- */
export const mockPieData = months.map(mon => ({
  name  : mon,
  value : Object.keys(monthlyHist[mon]).length,
}));

/* 9) RadarChart ----------------------------------------------------- */
export const mockRadarData = [];
months.forEach(mon => {
  ageGroups.forEach(age => {
    categories.forEach(cat => {
      ['남','여'].forEach(gender => {
        const base  = gender === '남' ? 20 : 18;
        const boost = Math.random()*10 + (age==='20대'?5:0);
        mockRadarData.push({
          period    : mon,
          age_group : age,
          gender,
          category  : cat,
          value     : Math.floor(base + boost),
        });
      });
    });
  });
});

/* 10) Ag-Grid Table -------------------------------------------------- */
export const mockTableData = customers.map((c,idx) => {
  const rec = monthlyHist['2025-04'][c.id] || { days:0, overdue:0, recovered:0 };
  return {
    기준월   : '2025-04',
    고객명   : `고객${idx + 1}`,
    성별     : c.gender,
    연령     : c.age,
    연락처   : `010-${String(1000+idx%9000).padStart(4,'0')}-${String(idx%10000).padStart(4,'0')}`,
    주소     : `서울시 가상구 ${idx%25+1}동`,
    연체일수  : rec.days,
    연체기간  : toTerm(rec.days),
    연체금액  : rec.overdue,
    회수금액  : rec.recovered,
    회수율    : rec.overdue ? Math.floor((rec.recovered/rec.overdue)*100) : 0,
    member_id: c.id,
  };
});
