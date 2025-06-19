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
    const minSize = 30;
    const maxSize = 80;
    return Math.max(minSize, (amount / max) * maxSize);
  };

  return (
    <div className="customer-detail-panel">
      <div className="header">
        <h3>📌 고객 상세 정보</h3>
        <button onClick={onClose}>닫기</button>
      </div>
      <div className="info-section">
        <p><strong>이름:</strong> {customer.name}</p>
        <p><strong>연락처:</strong> {customer.phone}</p>
        <p><strong>생년월일:</strong> {customer.birth}</p>
        <p><strong>가입일자:</strong> {customer.joined}</p>
        <p><strong>VIP 등급:</strong> {customer.vip_grade}</p>
        <p><strong>카드 등급:</strong> {customer.card_grade}</p>
        <p><strong>최근 사용일:</strong> {customer.last_used_date}</p>
      </div>

      <div className="chart-section">
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

      <div className="category-section">
        <h4>🧾 분야별 소비 분포</h4>
        <div className="category-icons">
          {Object.entries(customer.categorySpending).map(([key, value]) => (
            <div key={key} className="category-icon-box">
              <img
                src={categoryIcons[key]}
                alt={key}
                style={{ width: getIconSize(value) }}
              />
              <span>{key} ({value.toLocaleString()}원)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPanel;
