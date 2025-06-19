import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './components/LeaverListPage.css';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip, Legend,
  CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

/* ✨ 더미 데이터 / 헬퍼 임포트 */
import {
  RISK_TABS,
  getChartDataByRisk,
  rowData as ALL_ROWS,
} from '../leaver/mockLeaverData';

const COLORS = ['#007bff', '#ff4d4f', '#ffc107', '#28a745']; // pie 색상

/* ▸ 통화 포맷터 */
const currencyFormatter = (params) =>
  params.value.toLocaleString('ko-KR') + '원';

const riskBadge = (risk) => {
  const map = {
    고위험군: '#ff6b6b',
    관리군: '#ffa502',
    저위험군: '#2ed573',
    VIP예정: '#1e90ff',
  };

  return (
    <span
      style={{
        backgroundColor: map[risk] || '#ced6e0',
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        display: 'inline-block',
        minWidth: 60,
        textAlign: 'center',
      }}
    >
      {risk}
    </span>
  );
};

const LeaverListPage = () => {
  const navigate = useNavigate();
  const [riskTab, setRiskTab] = useState('저위험군');
  const [lineBarTab, setLineBarTab] = useState('line');
  const [pieRadarTab, setPieRadarTab] = useState('pie');
  const [searchTerm, setSearchTerm] = useState('');

  /* 🔹 차트/그리드 데이터 */
  const { lineBarData, pieData, radarData } = getChartDataByRisk(riskTab);

  const filteredData = useMemo(
    () =>
      ALL_ROWS
        .filter((row) => row.risk === riskTab)
        .filter((row) => row.name.includes(searchTerm)),
    [riskTab, searchTerm]
  );

  /* 🔹 Ag-Grid 컬럼 정의 + 기본 옵션 */
  const columnDefs = useMemo(
    () => [
      { headerName: '이름', field: 'name', sortable: true, filter: 'agTextColumnFilter' },
       {
    field: 'risk',
    headerName: '위험 등급',
    sortable: true,
    filter: true,
    cellRenderer: (p) => riskBadge(p.value),
  },
      { headerName: '최근 사용 금액', field: 'amount', sortable: true, valueFormatter: currencyFormatter },
      { headerName: '월 평균 결제액', field: 'avgSpend', sortable: true, valueFormatter: currencyFormatter },
      { headerName: '방문 횟수', field: 'visitCount', sortable: true, filter: 'agNumberColumnFilter' },
      { headerName: 'VIP 점수', field: 'vipScore', sortable: true, filter: 'agNumberColumnFilter' },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      resizable: true,
    }),
    []
  );

  /* 🔹 렌더 ---------------------------------------------------------------- */
  return (
    <div className="leaver-page">
      {/* 상단 탭 + 검색 */}
      <div className="risk-tabs">
        {RISK_TABS.map((tab) => (
          <button
            key={tab}
            className={riskTab === tab ? 'tab active' : 'tab'}
            onClick={() => setRiskTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="top-bar">



      </div>

      {/* 📊 차트 영역 ------------------------------------------------------ */}
      <div className="chart-section">
        {/* 왼쪽 Line / Bar */}
        <div className="chart-group left" style={{ flex: 2 }}>
          <div className="chart-tabs">
            {['line', 'bar'].map((tab) => (
              <button
                key={tab}
                className={lineBarTab === tab ? 'tab active' : 'tab'}
                onClick={() => setLineBarTab(tab)}
              >
                {tab === 'line' ? '📈 라인 차트' : '📊 바 차트'}
              </button>
            ))}
          </div>

          <div className="chart-box" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {lineBarTab === 'line' ? (
                <LineChart
                  data={lineBarData}
                  margin={{ top: 10, right: 40, bottom: 10, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${v}명`} />
                  <Legend />
                  <Line type="monotone" dataKey="male" stroke="#007bff" name="남성" strokeWidth={2} />
                  <Line type="monotone" dataKey="female" stroke="#ff4d4f" name="여성" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={lineBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${v}명`} />
                  <Legend />
                  <Bar dataKey="male" fill="#007bff" name="남성" barSize={18} />
                  <Bar dataKey="female" fill="#ff4d4f" name="여성" barSize={18} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 오른쪽 Pie / Radar */}
        <div className="chart-group right" style={{ flex: 1 }}>
          <div className="chart-tabs">
            {['pie', 'radar'].map((tab) => (
              <button
                key={tab}
                className={pieRadarTab === tab ? 'tab active' : 'tab'}
                onClick={() => setPieRadarTab(tab)}
              >
                {tab === 'pie' ? '🥧 파이 차트' : '🕸 레이다 차트'}
              </button>
            ))}
          </div>

          <div className="chart-box" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {pieRadarTab === 'pie' ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toLocaleString()}원`} />
                  <Legend verticalAlign="bottom" height={24} />
                </PieChart>
              ) : (
                <RadarChart cx="50%" cy="50%" outerRadius={85} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar name="남성" dataKey="A" stroke="#007bff" fill="#007bff" fillOpacity={0.6} />
                  <Radar name="여성" dataKey="B" stroke="#ff4d4f" fill="#ff4d4f" fillOpacity={0.6} />
                  <Legend verticalAlign="bottom" height={24} />
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🗒 그리드 -------------------------------------------------------- */}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input
          className="search-input"
          placeholder="고객명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            height: '32px',
            fontSize: '14px',
            padding: '4px 10px',
            width: '40%',
          }}
        />
      </div>


      <div className="ag-theme-alpine ag-grid-box" style={{ height: 320, marginTop: 24 }}>
        <AgGridReact
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSizeSelector={[10, 20, 50, 100]} // ✅ 10 포함
          onRowClicked={(e) => navigate(`/customer/${encodeURIComponent(e.data.name)}`)}
        />
      </div>
    </div>
  );
};

export default LeaverListPage;
