/* --------------------------------------------------------------------------
 *  CollectionHandoverPage – 100 % Mock-Data 버전
 *    · axios / 네트워크 호출 제거
 *    · mockTableData·TOTAL_CUSTOMERS를 이용해
 *      - 회수/연체 테이블
 *      - 연체·회수·회수율 추이(line+bar)  을 즉석 계산
 * -------------------------------------------------------------------------- */
import React, { useState, useMemo } from "react";
import { AgGridReact }   from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import styles from "./CollectionHandoverPage.module.css";
import DelinquentDetailTarget from "./components/DelinquentDetailTarget";  // ← 이 한 줄
import { useNavigate } from "react-router-dom";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

/* ✅ mock 데이터 */
import {
  mockTableData,           // 상세 행
  TOTAL_CUSTOMERS,          // 10 000
} from "../../mock/delinquentMockData";

const TERM_LABELS = ["30일 미만", "30~60일", "60~90일", "90일 이상"];
const MONTH_OPTIONS = ["2024-12", "2025-01", "2025-02", "2025-03", "2025-04"];

/* ▸ 금액·퍼센트 포맷 -------------------------------------------------- */
const money   = v => (v ?? 0).toLocaleString() + "원";
const percent = v => `${Number(v ?? 0).toFixed(1)}%`;

export default function CollectionHandoverPage () {
  const navigate = useNavigate();

  /* ① 공용 상태 ----------------------------------------------------- */
  const [activeTab,             setActiveTab]             = useState("handover");
  const [termTab,               setTermTab]               = useState(TERM_LABELS[0]);
  const [selectedRecoveryMonth, setSelectedRecoveryMonth] = useState("2025-04");
  const [searchTerm,            setSearchTerm]            = useState("");
  const [statusFilter,          setStatusFilter]          = useState({
    noRecovery:false, partialRecovery:false, fullRecovery:false,
  });
  const [sortBy,                setSortBy]                = useState("none");

  /* ② 테이블 원본(필터 전) ----------------------------------------- */
  const tableData = useMemo(() => {
    return mockTableData.filter(
      r => r.연체기간 === termTab && r.기준월 === selectedRecoveryMonth
    );
  }, [termTab, selectedRecoveryMonth]);

  /* ③ 차트 데이터 – 선택 월의 4개 연체기간 집계 ---------------------- */
  const chartData = useMemo(() => {
    return TERM_LABELS.map(label => {
      const rows = mockTableData.filter(
        r => r.기준월 === selectedRecoveryMonth && r.연체기간 === label
      );
      const overdue   = rows.reduce((s,r)=>s + r.연체금액,   0);
      const recovered = rows.reduce((s,r)=>s + r.회수금액,   0);
      const delinCnt  = rows.length;
      /* 아주 단순한 연체율 예시 = 연체인원/전체 */
      const delinRate = TOTAL_CUSTOMERS
        ? (delinCnt / TOTAL_CUSTOMERS) * 100
        : 0;
      const recRate   = overdue ? (recovered / overdue) * 100 : 0;
      return {
        연체기간 : label,
        연체금액 : overdue,
        회수금액 : recovered,
        회수율   : +recRate.toFixed(2),
        연체율   : +delinRate.toFixed(2),
      };
    });
  }, [selectedRecoveryMonth]);

  /* ④ UI용 필터링/정렬/검색 ---------------------------------------- */
  const filteredData = useMemo(() => {
    let rows = [...tableData];

    /* 검색 */
    const kw = searchTerm.trim().toLowerCase();
    if (kw) {
      rows = rows.filter(r =>
        Object.values(r).some(v =>
          (v ?? "").toString().toLowerCase().includes(kw)
        )
      );
    }

    /* 상태 체크박스 */
    const checked = Object.entries(statusFilter)
      .filter(([,v])=>v).map(([k])=>k);
    if (checked.length) {
      rows = rows.filter(r => {
        const rt = Math.round(r.회수율);
        if (rt === 0 && checked.includes("noRecovery"))         return true;
        if (rt > 0 && rt < 100 && checked.includes("partialRecovery")) return true;
        if (rt === 100 && checked.includes("fullRecovery"))     return true;
        return false;
      });
    }

    /* 정렬 */
    const sorter = {
      overdue   : (a,b)=>b.연체금액 - a.연체금액,
      recovered : (a,b)=>b.회수금액 - a.회수금액,
      rate      : (a,b)=>b.회수율   - a.회수율,
      none      : ()=>0,
    };
    rows.sort(sorter[sortBy]);

    return rows;
  }, [tableData, searchTerm, statusFilter, sortBy]);

  /* ⑤ AG-Grid 컬럼 정의 -------------------------------------------- */
  const columnDefs = useMemo(() => [
    { headerName:"회원ID",  field:"member_id", flex:0.6 },
    { headerName:"고객명",  field:"고객명",   flex:0.6 },
    { headerName:"성별",    field:"성별",     flex:0.4 },
    { headerName:"연령",    field:"연령",     flex:0.4 },
    { headerName:"연락처",  field:"연락처",   flex:0.8 },
    { headerName:"연체금액", field:"연체금액", flex:0.7,
      valueFormatter:p=>money(p.value) },
    { headerName:"회수금액", field:"회수금액", flex:0.7,
      valueFormatter:p=>money(p.value) },
    { headerName:"회수율",   field:"회수율",   flex:0.5,
      valueFormatter:p=>percent(p.value) },
  ], []);

  /* ⑥ 행 클릭 → 상세 페이지 ---------------------------------------- */
  const handleRowClick = row =>
    navigate("/delinquent/detail", { state:{ rowData:row, member_id:row.member_id } });

  /* ─────────────────────────── 렌더 ──────────────────────────── */
  return (
    <div className={styles.handoverPage}>
      {/* 상단 탭 (2개) */}
      <div style={{ display:'flex', gap:10 }}>
        {[["handover","회수 및 연체비율"],["manage","연체 추심 관리대상"]]
          .map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTab(k)}
              style={{
                border:'none',background:'transparent',cursor:'pointer',
                borderBottom:activeTab===k?'2px solid #007bff':'2px solid transparent',
                color:activeTab===k?'#007bff':'#888',
                fontWeight:activeTab===k?'bold':500,fontSize:15,padding:'4px 6px',
                marginBottom:30,transition:'all .2s'
              }}>{l}</button>
        ))}
      </div>

      {/* ▸ 회수/연체 탭 ------------------------------------------------ */}
      {activeTab==="handover" && (
        <>
          {/* 차트 --------------------------------------------------- */}
          <div style={{ width:'100%', maxWidth:1000, margin:'0 auto' }}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData}>
                <CartesianGrid stroke="#eee"/>
                <XAxis dataKey="연체기간" tick={{fontSize:13}}/>
                <YAxis yAxisId="left" tickFormatter={v=>v.toLocaleString()} tick={{fontSize:11}}/>
                <YAxis yAxisId="right" orientation="right" tickFormatter={v=>`${v}%`}/>
                <Tooltip formatter={(v,n)=>
                  n.includes("율") ? percent(v) : money(v)}/>
                <Legend/>
                <Line yAxisId="left"  dataKey="연체금액" stroke="#339af0" strokeWidth={2}/>
                <Line yAxisId="left"  dataKey="회수금액" stroke="#82c91e" strokeWidth={2}/>
                <Line yAxisId="right" dataKey="회수율"   stroke="#5c6f85" strokeWidth={2} strokeDasharray="4 2"/>
                <Line yAxisId="right" dataKey="연체율"   stroke="#ff6b6b" strokeWidth={2} strokeDasharray="4 2"/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 필터 --------------------------------------------------- */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              {/* 상태 체크 */}
              <div className={styles.checkboxGroup}>
                {[
                  ["noRecovery","미회수"],
                  ["partialRecovery","부분 회수"],
                  ["fullRecovery","전액 회수"]
                ].map(([k,l])=>(
                  <label key={k}>
                    <input type="checkbox"
                      checked={statusFilter[k]}
                      onChange={e=>setStatusFilter({...statusFilter,[k]:e.target.checked})}/>
                    {l}
                  </label>
                ))}
              </div>

              {/* 기간/월 선택 */}
              <label>회수기간:</label>
              <select value={termTab} onChange={e=>setTermTab(e.target.value)}>
                {TERM_LABELS.map(o=><option key={o}>{o}</option>)}
              </select>

              <label>기준 월:</label>
              <select value={selectedRecoveryMonth}
                      onChange={e=>setSelectedRecoveryMonth(e.target.value)}>
                {MONTH_OPTIONS.map(o=><option key={o}>{o}</option>)}
              </select>

              {/* 정렬 */}
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                      className={styles.sortSelect}>
                <option value="none">정렬 안함</option>
                <option value="overdue">연체금액순</option>
                <option value="recovered">회수금액순</option>
                <option value="rate">회수율순</option>
              </select>

              {/* 검색 */}
              <input
                type="text"
                value={searchTerm}
                onChange={e=>setSearchTerm(e.target.value)}
                placeholder="고객명, 연락처 등 검색"
                className={styles.searchInput}/>
            </div>
          </div>

          {/* 표 ----------------------------------------------------- */}
          <div className="ag-theme-alpine" style={{ height:300, width:'100%' }}>
            <AgGridReact
              rowData={filteredData}
              columnDefs={columnDefs}
              pagination paginationPageSize={10}
              domLayout="autoHeight"
              onRowClicked={e=>handleRowClick(e.data)}
              rowHeight={28}/>
          </div>
        </>
      )}

      {/* ▸ 추심 관리 대상 (기존 컴포넌트 그대로) ----------------------- */}
      {activeTab==="manage" && (
        <DelinquentDetailTarget />
      )}
    </div>
  );
}
