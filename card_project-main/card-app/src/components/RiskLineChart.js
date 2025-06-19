import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const API_BASE_URL = 'http://34.47.73.162:7100';

const RiskLineChart = ({ selectedGroup }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/risk-monthly`);
        // ✅ 선택된 그룹만 필터링
        const filtered = res.data
          .filter(row => row.predicted_risk_group === selectedGroup)
          .map(row => ({
            month: row.month,
            count: row.count
          }))
          .sort((a, b) => a.month - b.month)

        setChartData(filtered);
      } catch (err) {
        console.error('❌ 월별 데이터 불러오기 실패:', err);
      }
    };

    if (selectedGroup) fetchMonthlyData();
  }, [selectedGroup]);

  return (
    <div style={{ width: '100%', height: 320 }}>
      <h3 style={{ marginBottom: '10px' }}>{selectedGroup} 월별 인원 추이</h3>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#ff4d4f" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskLineChart;
