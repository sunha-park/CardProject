/* ------------------------------------------------------------------
 *  DelinquentTargetPage – mock (compact modern edition)
 * ------------------------------------------------------------------ */
import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './DelinquentTargetPage.css';
import RiskGroupDisplay from './RiskGroupDisplay';
import jsPDF        from 'jspdf';
import html2canvas  from 'html2canvas';

/* ─── 1) Mock list ─────────────────────────────────────────── */
const makeRow = (id, name, g, age, phone, addr, days) => ({
  member_id: id, name, gender: g, age, phone_number: phone,
  address: addr, overdue_days_recent: days
});
const MOCK_LIST_60_90 = [
  makeRow('C-00011','김지현','여',31,'010-1234-5678','서울시 가상구 1동',75),
  makeRow('C-00027','이준호','남',44,'010-9876-5432','부산시 가상구 3동',62),
  makeRow('C-00033','정다은','여',29,'010-3456-7890','대전시 가상구 5동',61),
  makeRow('C-00045','조민기','남',41,'010-2222-1111','서울시 가상구 9동',72),
  makeRow('C-00058','한서린','여',36,'010-3333-4444','인천시 가상구 6동',69),
  makeRow('C-00066','남도윤','남',38,'010-7777-8888','울산시 가상구 2동',74),
  makeRow('C-00079','이소율','여',47,'010-5555-9999','광주시 가상구 3동',64),
  makeRow('C-00085','오지훈','남',32,'010-6666-1234','부산시 가상구 4동',70),
  makeRow('C-00092','김하나','여',35,'010-1111-2222','수원시 가상구 7동',68),
  makeRow('C-00097','양승현','남',43,'010-9999-0000','서울시 가상구 8동',73)
];

const MOCK_LIST_90_PLUS = [
  makeRow('C-00102','박서연','여',52,'010-2222-3333','대구시 가상구 7동',108),
  makeRow('C-00155','최민수','남',37,'010-4444-5555','광주시 가상구 2동',124),
  makeRow('C-00163','백은채','여',49,'010-8888-7777','전주시 가상구 4동',103),
  makeRow('C-00172','차현우','남',54,'010-1212-3434','창원시 가상구 1동',111),
  makeRow('C-00188','문유진','여',46,'010-2323-4545','포항시 가상구 5동',132),
  makeRow('C-00193','류지혁','남',40,'010-3434-5656','부산시 가상구 6동',119),
  makeRow('C-00204','윤가은','여',34,'010-4545-6767','서울시 가상구 11동',107),
  makeRow('C-00215','신지후','남',58,'010-5656-7878','대전시 가상구 8동',126),
  makeRow('C-00226','서예린','여',51,'010-6767-8989','대구시 가상구 9동',141),
  makeRow('C-00239','정도현','남',48,'010-7878-9090','인천시 가상구 10동',133)
];

/* ─── 2) Detail mock (필요한 고객만 포함) ───────────────────── */
const MOCK_DETAIL = {
  'C-00011': { base_month:'2025-04', overdue_principal_recent:1580000,
    overdue_days_recent:75, recovered_amount:320000, recovery_rate:20.3,
    delinquency_rate:3.5, logs:['2025-04-28 전화','2025-04-15 문자'],
    checklist:['SMS 완료','콜 시도 중'] },
  'C-00027': { base_month:'2025-04', overdue_principal_recent:760000,
    overdue_days_recent:62, recovered_amount:0, recovery_rate:0,
    delinquency_rate:1.1, logs:['2025-04-10 문자'], checklist:['SMS 완료'] },
  'C-00102': { base_month:'2025-04', overdue_principal_recent:3280000,
    overdue_days_recent:108, recovered_amount:910000, recovery_rate:27.7,
    delinquency_rate:6.4, logs:['2025-04-30 방문','2025-03-25 전화'],
    checklist:['SMS 완료','콜 완료','방문 완료'] },
  'C-00155': { base_month:'2025-04', overdue_principal_recent:1450000,
    overdue_days_recent:124, recovered_amount:0, recovery_rate:0,
    delinquency_rate:4.0, logs:['2025-04-08 문자'], checklist:['SMS 완료'] }
};

/* ─── 3) Helpers ───────────────────────────────────────────── */
const money   = v => `${Number(v||0).toLocaleString()}원`;
const percent = v => `${(+v||0).toFixed(1)}%`;

const InfoBox = ({ title, children }) => (
  <div className="info-box">
    <h4>{title}</h4>{children}
  </div>
);

/* ─── 4) Component ────────────────────────────────────────── */
export default function DelinquentTargetPage () {
  const [activeTab,  setActiveTab ] = useState('60_90');
  const [search,     setSearch    ] = useState('');
  const [selected,   setSelected  ] = useState(null);

  const list = activeTab === '60_90' ? MOCK_LIST_60_90 : MOCK_LIST_90_PLUS;
  const rows = list.filter(r=>{
    const kw = search.trim().toLowerCase();
    return !kw || Object.values(r).some(v=>String(v).toLowerCase().includes(kw));
  });
  const detail = selected ? MOCK_DETAIL[selected.member_id] : null;

  /* PDF 저장 */
  const savePdf = () => {
    if(!selected) return;
    html2canvas(document.getElementById('pdf-target'),{scale:2}).then(cv=>{
      const pdf = new jsPDF('p','mm','a4');
      const w   = pdf.internal.pageSize.getWidth();
      const h   = cv.height * w / cv.width;
      pdf.addImage(cv.toDataURL('image/png'),'PNG',0,0,w,h);
      pdf.save(`연체고객_${selected.member_id}.pdf`);
    });
  };

  /* render */
  return (
    <div className="delinquent-page">
      <h2 className="page-title">연체 추심관리대상</h2>

      {/* ▼ 탭 */}
      <div className="tab-bar">
        {[
          {k:'60_90',   t:'60 ~ 90일'},
          {k:'90_plus', t:'90일 이상'}
        ].map(tab=>(
          <button key={tab.k}
                  className={activeTab===tab.k ? 'active' : ''}
                  onClick={()=>{setActiveTab(tab.k);setSelected(null);}}>
            {tab.t}
          </button>
        ))}
      </div>

      {/* ▼ 상단 카드/이력 */}
      <div id="pdf-target">
        <RiskGroupDisplay memberId={selected?.member_id} />

        <div className="info-wrap">
          <InfoBox title="고객 기본정보">
            {selected ? (
              <>
                <p>이름 / 회원번호 : {selected.name} ({selected.member_id})</p>
                <p>성별·나이 : {selected.gender} / {selected.age}</p>
                <p>연락처 : {selected.phone_number}</p>
                <p>주소 : {selected.address}</p>
              </>
            ):<p className="placeholder">고객을 선택하세요</p>}
          </InfoBox>

          <InfoBox title="연체 정보">
            {detail ? (
              <>
                <p>연체년월 : {detail.base_month}</p>
                <p>연체금액 : {money(detail.overdue_principal_recent)}</p>
                <p>연체일수 : {detail.overdue_days_recent}일</p>
                <p>회수금액 : {money(detail.recovered_amount)}</p>
                <p>회수율 / 연체율 : {percent(detail.recovery_rate)} / {percent(detail.delinquency_rate)}</p>
              </>
            ):<p className="placeholder">고객을 선택하세요</p>}
          </InfoBox>
        </div>

        <div className="detail-section">
          <div className="log-box">
            <h4>추심 이력</h4>
            {detail ? (
              <ul>{detail.logs.map((l,i)=><li key={i}>{l}</li>)}</ul>
            ):<p className="placeholder">고객을 선택하세요</p>}
          </div>
          <div className="checklist-box">
            <h4>체크리스트</h4>
            {detail ? (
              <ul>{detail.checklist.map((c,i)=><li key={i}>{c}</li>)}</ul>
            ):<p className="placeholder">고객을 선택하세요</p>}
          </div>
        </div>
      </div>

      {/* ▼ PDF 버튼 */}
      <div className="btn-area">
        <button className="pdf-btn" onClick={savePdf} disabled={!selected}>
          PDF 다운로드
        </button>
      </div>

      {/* ▼ 검색 + 그리드 (맨 하단) */}
      <input
        className="search"
        placeholder="이름·회원번호·주소·연락처 검색 …"
        value={search}
        onChange={e=>setSearch(e.target.value)}
      />

      <div className="ag-theme-alpine ag-grid-container">
        <AgGridReact
          rowData={rows}
          columnDefs={[
            {headerName:'회원번호',  field:'member_id',   minWidth:110},
            {headerName:'이름',      field:'name',        minWidth:90},
            {headerName:'성별',      field:'gender',      width:70},
            {headerName:'나이',      field:'age',         width:70},
            {headerName:'연락처',    field:'phone_number',minWidth:130},
            {headerName:'주소',      field:'address',     flex:1},
            {headerName:'연체일수',  field:'overdue_days_recent', width:90}
          ]}
          rowHeight={28}
          pagination pageSize={10}
          onRowClicked={e=>setSelected(e.data)}
        />
      </div>
    </div>
  );
}
