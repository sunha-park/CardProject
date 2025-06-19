import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './components/CardBenefitPage.css'; // 스타일은 기존 것 그대로 사용

function CardBenefitPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [activeTab, setActiveTab] = useState("chart");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ 고객 20명 더미 생성
  const mockCustomers = Array.from({ length: 20 }, (_, i) => ({
    vip_id: `vip_${i + 1}`,
    name: `고객 ${i + 1}`,
    phone: `010-1234-${(1000 + i).toString().slice(-4)}`,
    sms_count: Math.floor(Math.random() * 3),
    last_sms_sent_at: i % 2 === 0 ? new Date(Date.now() - i * 86400000 * 5).toISOString() : null,
  }));

  useEffect(() => {
    setCustomers(mockCustomers);
  }, []);

  // ✅ 카드 추천 더미 생성
  const getMockRecommendations = (vip_id) => ({
  ensemble: Array.from({ length: 5 }, (_, i) => ({
    card_name: `추천카드 ${i + 1} (${vip_id})`,
    score: (0.85 - i * 0.1).toFixed(2),
    image_url: `/cards/card${i + 1}.jpg`,  // ✅ public/cards/card1.png 등 참조
    benefits: ['적립', '할인', '여행 혜택'][i % 3],
    annul_fee_domestic: 10000 + i * 5000,
    annul_fee_foreign: 20000 + i * 6000,
  }))
});


  const fetchRecommendation = (vip_id) => {
    const data = getMockRecommendations(vip_id);
    setRecommendations(data);
    setActiveTab("chart");
  };

  const sendSMS = (name, phone, cardName) => {
    alert(`📩 ${name} 고객님에게 "${cardName}" 카드 추천 메시지를 발송했습니다.`);
    setCustomers((prev) =>
      prev.map((c) =>
        c.name === name
          ? { ...c, sms_count: c.sms_count + 1, last_sms_sent_at: new Date().toISOString() }
          : c
      )
    );
  };

  const columnDefs = [
    { headerName: '고객명', field: 'name', maxWidth: 100 },
    { headerName: '연락처', field: 'phone', maxWidth: 140 },
    { headerName: '문자 수', field: 'sms_count', maxWidth: 80 },
    {
      headerName: '최근 발송일',
      field: 'last_sms_sent_at',
      valueFormatter: ({ value }) =>
        value ? new Date(value).toLocaleString() : '-',
      maxWidth: 180,
    },
  ];

  const getFilteredCustomers = () => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.trim().toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  };

  const getColor = (index, total) => {
    const opacity = 1 - (index / (total - 1)) * 0.6;
    return `rgba(136, 132, 216, ${opacity})`;
  };

  const renderChart = (title, data) => {
    const parsed = data.map(d => ({ ...d, score: parseFloat(d.score) }));
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={parsed}>
          <XAxis dataKey="card_name" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="score">
            {parsed.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={getColor(i, parsed.length)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="card-benefit-page">
      <h2 className="page-title">📊 카드 추천 및 문자 발송</h2>
      <main className="content-section">
        <section className="left-panel">
          <div className="toolbar">
            <input
              type="text"
              placeholder="고객 이름 또는 연락처 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="ag-theme-alpine ag-grid-box">
            <AgGridReact
              rowData={getFilteredCustomers()}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              onRowClicked={({ data }) => {
                setSelectedCustomer(data);
                fetchRecommendation(data.vip_id);
              }}
            />
          </div>
        </section>
        <section className="right-panel">
          <div className="tab-header">
            <button
              className={`tab ${activeTab === "chart" ? "active" : ""}`}
              onClick={() => setActiveTab("chart")}
            >
              차트 보기
            </button>
            <button
              className={`tab ${activeTab === "cards" ? "active" : ""}`}
              onClick={() => setActiveTab("cards")}
            >
              카드 보기
            </button>
          </div>

          {recommendations ? (
            <>
              <h3 className="chart-title">{selectedCustomer.name}님 추천 카드</h3>
              {activeTab === "chart" && renderChart('', recommendations.ensemble)}
              {activeTab === "cards" && (
                <div className="card-selection-container">
                  {recommendations.ensemble.map(card => (
                    <div
                      key={card.card_name}
                      className="card-item"
                      onMouseEnter={() => setHoveredCard(card.card_name)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <img src={card.image_url} alt={card.card_name} className="card-img" />
                      <div className="card-content">
                        <h4>{card.card_name}</h4>
                        <p>⭐ 점수: {card.score}</p>
                        <p>💡 혜택: {card.benefits}</p>
                        <p>💳 국내 연회비: {card.annul_fee_domestic.toLocaleString()}원</p>
                        <p>🌐 해외 연회비: {card.annul_fee_foreign.toLocaleString()}원</p>
                        {hoveredCard === card.card_name && (
                          <button
                            className="sms-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendSMS(selectedCustomer.name, selectedCustomer.phone, card.card_name);
                            }}
                          >
                            문자 발송
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="chart-placeholder">👈 왼쪽에서 고객을 선택하세요.</div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CardBenefitPage;
