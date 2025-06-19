import React, { useState, useEffect } from 'react';
import './components/LeaverListPage.css';
import { AgGridReact } from 'ag-grid-react';
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';

const BASE_URL = 'http://34.47.73.162:7000'; // ✅ 전역 API 주소

const COLORS = ['#007bff', '#ff4d4f', '#ffc107', '#28a745'];

const LeaverListPage = () => {
  const [riskTab, setRiskTab] = useState('저위험군');
  const [lineBarTab, setLineBarTab] = useState('line');
  const [pieRadarTab, setPieRadarTab] = useState('pie');
  const [searchTerm, setSearchTerm] = useState('');

  const [lineBarData, setLineBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const navigate = useNavigate();

  // 🔄 위험군별 데이터 불러오기
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/leaver/charts`, {
          params: { riskGroup: riskTab }
        });
        setLineBarData(res.data.lineBarData || []);
        setPieData(res.data.pieData || []);
        setRadarData(res.data.radarData || []);
      } catch (err) {
        console.error('차트 데이터 불러오기 실패:', err);
      }
    };

    const fetchTableData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/leaver/list`, {
          params: { riskGroup: riskTab }
        });
        setTableData(res.data || []);
      } catch (err) {
        console.error('리스트 데이터 불러오기 실패:', err);
      }
    };

    fetchChartData();
    fetchTableData();
  }, [riskTab]);

  const filteredData = tableData.filter((row) =>
    row.name.includes(searchTerm)
  );

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
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    dataKey="value"
                  >
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
            onRowClicked={(e) => navigate(`/customer/${e.data.id}`)} // ✅ 클릭 시 ID 기반 이동
        />
      </div>
    </div>
  );
};

export default LeaverListPage;
