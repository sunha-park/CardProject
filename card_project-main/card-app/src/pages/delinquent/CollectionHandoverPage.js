import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import styles from './CollectionHandoverPage.module.css';
import { useNavigate } from "react-router-dom";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ✅ DelinquentManagePage 내부 구성 요소
import MemberList from './components/MemberList';
import MemberDetailCard from './components/MemberDetailCard';
import RiskGroupDisplay from './components/RiskGroupDisplay';
import CollectionLogList from './components/CollectionLogList';
import CollectionActionForm from './components/CollectionActionForm';
import DelinquentDetailTarget from './components/DelinquentDetailTarget';

const BASE_URL = "http://34.47.73.162:7000";
const TERM_LABELS = ["30일 미만", "30~60일", "60~90일", "90일 이상"];

const CollectionHandoverPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("handover");

  // 공통 상태
  const [termTab, setTermTab] = useState("30일 미만");
  const [selectedRecoveryMonth, setSelectedRecoveryMonth] = useState("2025-04");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState({
    noRecovery: false,
    partialRecovery: false,
    fullRecovery: false,
  });
  const [sortBy, setSortBy] = useState("none");

  // 회수현황
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const baseMonth = selectedRecoveryMonth.replace("-", "");

    axios.get(`${BASE_URL}/api/delinquent/recovery/table-data`, {
      params: { termGroup: termTab, baseMonth }
    }).then(res => setTableData(res.data ?? []))
      .catch(err => console.error("table-data fetch 실패:", err));

    axios.get(`${BASE_URL}/api/delinquent/handover-data`, {
      params: { termGroup: termTab, baseMonth }
    }).then(res => setChartData(res.data.lineData ?? []))
      .catch(err => console.error("chart-data fetch 실패:", err));
  }, [termTab, selectedRecoveryMonth]);

  const handleRowClick = (row) => {
    navigate('/delinquent/detail', {
      state: {
        rowData: row,
        member_id: row.member_id,
      },
    });
  };

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    let filtered = [...tableData];

    if (keyword) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          (value ?? '').toString().toLowerCase().includes(keyword)
        )
      );
    }

    const checkedStates = Object.entries(statusFilter)
      .filter(([_, checked]) => checked)
      .map(([state]) => state);

    if (checkedStates.length > 0) {
      filtered = filtered.filter(row => {
        const rate = Math.round(Number(row['회수율']));
        if (rate === 0 && checkedStates.includes('noRecovery')) return true;
        if (rate > 0 && rate < 100 && checkedStates.includes('partialRecovery')) return true;
        if (rate === 100 && checkedStates.includes('fullRecovery')) return true;
        return false;
      });
    }

    if (sortBy === 'overdue') {
      filtered = [...filtered].sort((a, b) => b['연체금액'] - a['연체금액']);
    } else if (sortBy === 'recovered') {
      filtered = [...filtered].sort((a, b) => b['회수금액'] - a['회수금액']);
    } else if (sortBy === 'rate') {
      filtered = [...filtered].sort((a, b) => b['회수율'] - a['회수율']);
    }

    return filtered;
  }, [tableData, searchTerm, statusFilter, sortBy]);

  const columnDefs = useMemo(() => {
    const formatMoney = (val) => val != null ? Number(val).toLocaleString() + '원' : '0원';
    return [
      { headerName: "회원ID", field: "member_id", flex: 0.5 },
      { headerName: "고객명", field: "고객명", flex: 0.5 },
      { headerName: "기준월", field: "기준월", flex: 0.5 },
      { headerName: "성별", field: "성별", flex: 0.5 },
      { headerName: "연령", field: "연령", flex: 0.5 },
      { headerName: "연락처", field: "연락처", flex: 0.6 },
      { headerName: "연체기간", field: "연체기간", flex: 0.5 },
      { headerName: "연체금액", field: "연체금액", flex: 0.7, valueFormatter: (p) => formatMoney(p.value) },
      { headerName: "회수금액", field: "회수금액", flex: 0.7, valueFormatter: (p) => formatMoney(p.value) },
      { headerName: "회수율", field: "회수율", flex: 0.5, valueFormatter: (p) => `${p.value}%` },
    ];
  }, []);

  return (
    <div className={styles.handoverPage}>
      <div style={{ display: 'flex', gap: 10 }}>
        {[['handover', '회수 및 연체비율'], ['manage', '연체 추심 관리대상']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === key ? '2px solid #007bff' : '2px solid transparent',
              color: activeTab === key ? '#007bff' : '#888',
              fontWeight: activeTab === key ? 'bold' : 500,
              fontSize: '15px',
              padding: '4px 6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '30px'
            }}
          >
            {label}
          </button>
        ))}
      </div>



      {activeTab === "handover" && (
        <>
          <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto' }}>
  <ResponsiveContainer width="100%" height={260}>
    <ComposedChart data={chartData}>
      <CartesianGrid stroke="#eee" />
      <XAxis
        dataKey="연체기간"
        tick={{ fontSize: 13 }}
        label={{
          value: '연체기간',
          position: 'insideLeft',
          offset: 0,
          dy: 20,
          dx: -10,
          style: { textAnchor: 'start', fontSize: 14 }
        }}
      />
      <YAxis yAxisId="left" tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
      <Tooltip formatter={(value, name) =>
        `${typeof value === 'number' ? value.toLocaleString() : value}${name.includes('율') ? '%' : '원'}`
      } />
      <Legend />
      <Line yAxisId="left" type="monotone" dataKey="연체금액" stroke="#339af0" strokeWidth={2} />
      <Line yAxisId="left" type="monotone" dataKey="회수금액" stroke="#82c91e" strokeWidth={2} />
      <Line yAxisId="right" type="monotone" dataKey="회수율" stroke="#5c6f85" strokeWidth={2} strokeDasharray="4 2" />
      <Line yAxisId="right" type="monotone" dataKey="연체율" stroke="#ff6b6b" strokeWidth={2} strokeDasharray="4 2" />
    </ComposedChart>
  </ResponsiveContainer>
</div>

          {/* 필터 */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <div className={styles.checkboxGroup}>
                {['noRecovery', 'partialRecovery', 'fullRecovery'].map(key => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={statusFilter[key]}
                      onChange={(e) => setStatusFilter({ ...statusFilter, [key]: e.target.checked })}
                    />
                    {key === 'noRecovery' ? '미회수' : key === 'partialRecovery' ? '부분 회수' : '전액 회수'}
                  </label>
                ))}
              </div>
              <label>회수기간:</label>
              <select value={termTab} onChange={e => setTermTab(e.target.value)}>
                {TERM_LABELS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <label>기준 월:</label>
              <select value={selectedRecoveryMonth} onChange={e => setSelectedRecoveryMonth(e.target.value)}>
                {["2024-12", "2025-01", "2025-02", "2025-03", "2025-04"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="none">정렬 안함</option>
                <option value="overdue">연체금액순</option>
                <option value="recovered">회수금액순</option>
                <option value="rate">회수율순</option>
              </select>
              <input
                type="text"
                placeholder="고객명, 연락처 등 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* 표 */}
          <div className="ag-theme-alpine" style={{ height: 300, width: '100%' }}>
            <AgGridReact
              rowData={filteredData}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              domLayout="autoHeight"
              onRowClicked={event => handleRowClick(event.data)}
              rowHeight={28}
            />
          </div>
        </>
      )}

      {activeTab === "manage" && (
        <DelinquentDetailTarget />
      )}
    </div>
  );
};

export default CollectionHandoverPage;
