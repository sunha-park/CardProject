import React, { useState } from 'react';
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

const COLORS = ['#007bff', '#ff4d4f', '#ffc107', '#28a745'];

// 🔹 위험군별 차트 데이터 분기 함수
const getChartDataByRisk = (riskTab) => {
  switch (riskTab) {
    case '고위험군':
      return {
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
        ]
      };
    case '관리군':
      return {
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
        ]
      };
    case '저위험군':
    default:
      return {
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
        ]
      };
  }
};

const LeaverListPage = () => {
  const navigate = useNavigate();
  const [riskTab, setRiskTab] = useState('저위험군');
  const [lineBarTab, setLineBarTab] = useState('line');
  const [pieRadarTab, setPieRadarTab] = useState('pie');
  const [searchTerm, setSearchTerm] = useState('');

  const { lineBarData, pieData, radarData } = getChartDataByRisk(riskTab);

  const rowData = [
    { name: '김철수', risk: '고위험군', amount: 126500 },
    { name: '이영희', risk: '관리군', amount: 92000 },
    { name: '박민수', risk: '저위험군', amount: 50000 },
    { name: '최수연', risk: '관리군', amount: 70000 },
    { name: '한지민', risk: '고위험군', amount: 118000 },
    { name: '김지연', risk: '저위험군', amount: 130000},
    { name: '이한영', risk: '저위험군', amount: 80000},
    { name: '김대일', risk: '저위험군', amount: 62000},
    { name: '박성만', risk: '고위험군', amount: 200000},
    { name: '김경숙', risk: '관리군', amount: 30000},
    { name: '김대진', risk: '고위험군', amount: 77100},
    { name: '김일수', risk: '저위험군', amount: 21000},
    { name: '김창기', risk: '저위험군', amount: 251000},
    { name: '김진엽', risk: '고위험군', amount: 34000},
    { name: '남영숙', risk: '관리군', amount: 60000},
    { name: '노성환', risk: '저위험군', amount: 80000},
    { name: '도기욱', risk: '고위험군', amount: 40000}
  ];

  const filteredData = rowData
    .filter((row) => row.risk === riskTab)
    .filter((row) => row.name.includes(searchTerm));

  const columnDefs = [
    { headerName: '이름', field: 'name' },
    { headerName: '위험 등급', field: 'risk' },
    { headerName: '최근 사용 금액', field: 'amount' },
  ];

  return (
    <div className="leaver-page">
      {/* 상단 탭 + 검색바 */}
      <div className="top-bar">
        <div className="risk-tabs">
          {['저위험군', '관리군', '고위험군'].map((tab) => (
            <button
              key={tab}
              className={riskTab === tab ? 'tab active' : 'tab'}
              onClick={() => setRiskTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="고객명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 시각화 영역 */}
      <div className="chart-section">
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
          <div className="chart-box" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              {lineBarTab === 'line' ? (
                <LineChart data={lineBarData} margin={{ top: 10, bottom: 10, left: 0, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="male" stroke="#007bff" name="남성" strokeWidth={2} />
                  <Line type="monotone" dataKey="female" stroke="#ff4d4f" name="여성" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={lineBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" fill="#007bff" name="남성" barSize={18} />
                  <Bar dataKey="female" fill="#ff4d4f" name="여성" barSize={18} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

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
          <div className="chart-box" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              {pieRadarTab === 'pie' ? (
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={70} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={24} />
                </PieChart>
              ) : (
                <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarData}>
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

      {/* 리스트 영역 */}
      <div className="ag-theme-alpine ag-grid-box" style={{ height: 300, marginTop: 20 }}>
        <AgGridReact
          rowData={filteredData}
          columnDefs={columnDefs}
          pagination={true}
          onRowClicked={(e) => navigate(`/customer/${encodeURIComponent(e.data.name)}`)}
        />
      </div>
    </div>
  );
};

export default LeaverListPage;
