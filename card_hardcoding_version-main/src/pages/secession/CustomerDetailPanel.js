import React from 'react';
import './components/CustomerDetailPanel.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomerDetailPanel = ({ customer, onClose }) => {
  if (!customer) return null;

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
      {/* 🔺 헤더 */}
      <div className="panel-header">
        <h3>📌 고객 상세 정보</h3>
        <button onClick={onClose} className="close-btn">✖</button>
      </div>

      {/* 🧑 기본 정보 */}
      <div className="info-grid">
        <div><strong>이름</strong><span>{customer.name}</span></div>
        <div><strong>연락처</strong><span>{customer.phone}</span></div>
        <div><strong>생년월일</strong><span>{customer.birth}</span></div>
        <div><strong>가입일자</strong><span>{customer.joined}</span></div>
        <div><strong>VIP 등급</strong><span>{customer.vip_grade}</span></div>
        <div><strong>카드 등급</strong><span>{customer.card_grade}</span></div>
        <div><strong>최근 사용일</strong><span>{customer.last_used_date}</span></div>
      </div>

      {/* 📈 월별 소비 추이 */}
      <div className="chart-box">
        <h4>📅 월별 이용금액 추이</h4>
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

      {/* 💳 분야별 소비 분포 */}
      <div className="category-box">
        <h4>🧾 분야별 소비 분포</h4>
        <div className="category-grid">
          {Object.entries(customer.categorySpending).map(([key, value]) => (
            <div key={key} className="category-item">
              <img src={categoryIcons[key]} alt={key} style={{ width: getIconSize(value) }} />
              <div className="category-label">{key}<br />({value.toLocaleString()}원)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPanel;
