import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './components/CardBenefitPage.css';

function CardBenefitPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [activeTab, setActiveTab] = useState("chart");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [smsFilter, setSmsFilter] = useState("all");

  const BASE_URL = 'http://34.47.73.162:7001';

  useEffect(() => {
    fetch(`${BASE_URL}/api/secession/customers`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ 고객 데이터:", data);
        setCustomers(data);
      })
      .catch((err) => console.error('고객 데이터 에러', err));
  }, []);

  const fetchRecommendation = (vip_id) => {
    fetch(`${BASE_URL}/api/secession/recommend/${vip_id}`)
      .then(res => res.json())
      .then(data => {
        console.log("🎯 추천 결과:", data);
        setRecommendations(data);
        setActiveTab("chart");
      })
      .catch(err => console.error('추천 데이터 에러', err));
  };

  const refreshCustomerData = (vip_id) => {
  fetch(`${BASE_URL}/api/secession/customers`)
    .then(res => res.json())
    .then(data => {
      setCustomers(data);
      // 선택된 고객이 갱신된 정보로 다시 매핑되도록 보장
      const updated = data.find(c => c.vip_id === vip_id);
      if (updated) setSelectedCustomer(updated);
    });
};

  const columnDefs = [
    { headerName: '고객', field: 'name', maxWidth: 90 },
    { headerName: '연락처', field: 'phone', maxWidth: 120 },
    { headerName: '문자발송', field: 'sms_count', maxWidth: 100 },
    {
      headerName: '최근발송일',
      field: 'last_sms_sent_at',
      valueFormatter: ({ value }) =>
        value ? new Date(value).toLocaleString() : '-',
      maxWidth: 150
    }
  ];

  const getColor = (index, total) => {
    const opacity = 1 - (index / Math.max(total - 1, 1)) * 0.6; // 1 → 0.4까지 감소
    return `rgba(136, 132, 216, ${opacity})`;
  };

  const renderChart = (title, data) => {
    if (!Array.isArray(data)) return null;

    // ✅ score를 숫자로 변환
    const parsedData = data.map(item => ({
      ...item,
      score: parseFloat(item.score),
    }));

    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <ResponsiveContainer width="100%" height={540}>
        <BarChart data={parsedData}>
          <XAxis 
            dataKey="card_name" 
            tick={{ fontSize: 10 }} // X축 라벨 폰트 크기 줄임
          />
          <YAxis 
            domain={[0, 1]} // Y축 0~1 고정
            tick={{ fontSize: 11 }} // Y축 라벨 폰트 크기 줄임
          />
          <Tooltip 
            wrapperStyle={{ fontSize: '11px' }} // 툴팁 폰트 크기 조절
          />
          <Bar dataKey="score">
            {parsedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColor(index, parsedData.length)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    );
  };

  const sendSMS = (name, phone, cardName) => {
    const payload = {
      name,
      phone,
      vip_id: selectedCustomer.vip_id,
      message: `${name} 고객님께 추천드리는 카드: ${cardName}`
    };

    fetch(`${BASE_URL}/api/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        alert("📩 문자 발송 성공!");
        console.log("✅ 문자 발송 결과:", data);
        refreshCustomerData(payload.vip_id); // ✅ 문자 보내고 바로 동기화
      })
      .catch(err => {
        alert("❌ 문자 발송 실패");
        console.error("❌ 문자 API 에러:", err);
      });
  };

  const getFilteredSortedCustomers = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    const twoMonthsAgo = new Date(now);
    const threeMonthsAgo = new Date(now);

    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let filtered = customers;

    // 문자 발송일 기준 필터링
    if (smsFilter === "1m") {
      filtered = filtered.filter(c =>
        c.last_sms_sent_at && new Date(c.last_sms_sent_at) >= oneMonthAgo
      );
    } else if (smsFilter === "2m") {
      filtered = filtered.filter(c => {
        const sent = new Date(c.last_sms_sent_at);
        return sent < oneMonthAgo && sent >= twoMonthsAgo;
      });
    } else if (smsFilter === "3m") {
      filtered = filtered.filter(c => {
        const sent = new Date(c.last_sms_sent_at);
        return sent < twoMonthsAgo && sent >= threeMonthsAgo;
      });
    }

    // ✅ 이름 또는 연락처 검색 필터 추가
    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.sms_count && c.sms_count.toString().includes(query)) ||
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.phone && c.phone.toLowerCase().includes(query))
      );
    }

      return filtered;
    };

  return (
    <div className="card-benefit-page">
      <h2 className="page-title">
        <span className="highlight">카드 추천</span> 및 <span className="highlight-secondary">비교</span>
      </h2>
      <main className="content-section">
        <section className="left-panel">
          <div className="tab-header sms-tab">
            <button
              className={`tab ${smsFilter === "all" ? "active" : ""}`}
              onClick={() => setSmsFilter("all")}
            >
              전체 현황
            </button>
            <button
              className={`tab ${smsFilter === "1m" ? "active" : ""}`}
              onClick={() => setSmsFilter("1m")}
            >
              최근 1개월
            </button>
            <button
              className={`tab ${smsFilter === "2m" ? "active" : ""}`}
              onClick={() => setSmsFilter("2m")}
            >
              최근 2개월
            </button>
            <button
              className={`tab ${smsFilter === "3m" ? "active" : ""}`}
              onClick={() => setSmsFilter("3m")}
            >
              최근 3개월
            </button>
          </div>
          <div className="toolbar">
            <div className="search-container">
              <input
                type="text"
                placeholder="고객 이름 또는 연락처 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="ag-theme-alpine ag-grid-box">
            <AgGridReact
              rowData={getFilteredSortedCustomers()}
              columnDefs={columnDefs}
              pagination={true}
              onRowClicked={({ data }) => {
                setSelectedCustomer(data);
                fetchRecommendation(data.vip_id);
              }}
            />
          </div>
        </section>
        <section className="right-panel">
          {/* ✅ 탭 선택 영역 */}
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
              <div className="chart-title">
                <span className="customer-name">{selectedCustomer.name} 고객님</span>{' '}
                <span className="highlight-blue">혜택 중심 추천 카드</span>
              </div>
              {activeTab === "chart" && renderChart('', recommendations.ensemble)}
              {activeTab === "cards" && (
                <div className="card-selection-container">
                  {(recommendations.ensemble || []).map((card) => {
                    const isSelected = selectedCards.some((c) => c.card_name === card.card_name);
                    return (
                      <div
                        key={card.card_name}
                        className={`card-item ${isSelected ? "selected" : ""}`}
                        onMouseEnter={() => setHoveredCard(card.card_name)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <img src={card.image_url} alt={card.card_name} className="card-img" />
                        <div className="card-content">
                          <h4 className="card-title">{card.card_name}</h4>
                          <p className="card-score">⭐ 점수: {card.score}</p>
                          <p className="card-benefit">💡 혜택: {card.benefits || "정보 없음"}</p>
                          <p className="card-fee">💳 국내 연회비: {card.annul_fee_domestic?.toLocaleString() || "정보 없음"}원</p>
                          <p className="card-fee">🌐 해외 연회비: {card.annul_fee_foreign?.toLocaleString() || "정보 없음"}원</p>
                          {/* ✅ 문자 발송 버튼 */}
                          {hoveredCard === card.card_name && (
                            <button
                              className="sms-button"
                              onClick={(e) => {
                                e.stopPropagation(); // 카드 선택 이벤트 차단
                                sendSMS(selectedCustomer.name, selectedCustomer.phone, card.card_name);
                              }}
                            >
                              카드 추천
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="chart-placeholder">왼쪽에서 고객을 선택하세요.</div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CardBenefitPage;
