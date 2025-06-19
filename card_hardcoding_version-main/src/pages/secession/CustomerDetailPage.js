// src/pages/customer/CustomerDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { rowData, getChartDataByRisk } from '../../pages/leaver/mockLeaverData';
import './components/CustomerDetailPage.css'; // 👉 스타일은 아래 별도 제공

const CustomerDetailPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const decodedName = decodeURIComponent(name);
    const target = rowData.find((c) => c.name.trim() === decodedName.trim());

    if (!target) {
      console.warn(`❌ 고객 ${decodedName} 을 찾을 수 없습니다.`);
      return;
    }

    const riskData = getChartDataByRisk(target.risk);

    const enrichedCustomer = {
      ...target,
      phone: '010-1234-5678',
      birth: '1990-01-01',
      joined: '2022-01-01',
      vip_grade: target.risk === 'VIP예정' ? '예정' : '일반',
      card_grade: 'GOLD',
      last_used_date: '2025-05-30',
      monthlySpending: riskData.lineBarData.map((d) => ({
        month: d.category,
        amount: (d.male + d.female) * 10000,
      })),
      categorySpending: Object.fromEntries(
        riskData.pieData.map(({ name, value }) => [name, value * 1000])
      ),
    };

    setCustomer(enrichedCustomer);
  }, [name]);

  if (!customer) return <div style={{ padding: 40 }}>고객 정보를 불러오는 중...</div>;

  const categoryIcons = {
    쇼핑: '/icons/shopping.png',
    외식: '/icons/food.png',
    공과금: '/icons/bills.png',
    기타: '/icons/etc.png',
  };

  const getIconSize = (amount) => {
    const max = 300000;
    const minSize = 28;
    const maxSize = 64;
    return Math.min(maxSize, Math.max(minSize, (amount / max) * maxSize));
  };

  return (
    <div className="customer-panel">
      <div className="panel-header">
        <h2>📌 고객 상세 정보</h2>
        <button onClick={() => navigate(-1)} className="close-btn">✖</button>
      </div>

      <div className="info-cards">
        {[
          { label: '이름', value: customer.name },
          { label: '연락처', value: customer.phone },
          { label: '생년월일', value: customer.birth },
          { label: '가입일자', value: customer.joined },
          { label: 'VIP 등급', value: customer.vip_grade },
          { label: '카드 등급', value: customer.card_grade },
          { label: '최근 사용일', value: customer.last_used_date },
        ].map((item, idx) => (
          <div className="info-card" key={idx}>
            <span className="label">{item.label}</span>
            <span className="value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="chart-box">
        <h4>📊 월별 이용금액 추이</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={customer.monthlySpending}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#007bff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="category-box">
        <h4>🧾 분야별 소비 분포</h4>
        <div className="category-grid">
          {Object.entries(customer.categorySpending).map(([key, value]) => (
            <div className="category-item" key={key}>
              <img
                src={categoryIcons[key] || '/icons/default.png'}
                alt={key}
                className="category-img"
                style={{ width: getIconSize(value) }}
              />
              <div className="category-label">{key}<br />({value.toLocaleString()}원)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
