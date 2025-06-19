import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import CollectionLogList from './CollectionLogList';
import RiskGroupDisplay from './RiskGroupDisplay';
import CollectionActionForm from './CollectionActionForm';
import axios from 'axios';


// ✅ 전역 IP/PORT 설정
const BASE_URL = 'http://34.47.73.162:7000';

// ✅ Gauge 차트
const GaugeChart = ({ percent }) => {
  const radius = 90;
  const strokeWidth = 15;
  const circumference = Math.PI * radius;
  const progress = (percent / 100) * circumference;

  return (
    <svg width="230" height="150" viewBox="0 0 200 120">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="#eee" strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`} transform="rotate(-180 100 100)" />
      <circle cx="100" cy="100" r={radius} fill="none" stroke="#007bff" strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${circumference - progress}`} transform="rotate(-180 100 100)" strokeLinecap="round" />
      <text x="100" y="105" textAnchor="middle" fontSize="16">{percent}%</text>
      <text x="100" y="118" textAnchor="middle" fontSize="11" fill="#888">회수율</text>
    </svg>
  );
};

const InfoItem = ({ label, value }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', padding: '6px 12px',
    borderBottom: '1px solid #eee', fontSize: 14,
  }}>
    <span style={{ color: '#666', fontWeight: 500 }}>{label}</span>
    <span style={{ color: '#222' }}>{value}</span>
  </div>
);

const ChecklistItem = ({ 항목, 완료, onToggle }) => (
  <div onClick={onToggle} style={{
    display: 'flex', alignItems: 'center', padding: '6px 10px',
    cursor: 'pointer', background: 완료 ? '#e6f4ff' : 'transparent',
    borderRadius: 6, marginBottom: 6
  }}>
    <input type="checkbox" checked={완료} onChange={onToggle} style={{ marginRight: 10 }} />
    <span>{항목}</span>
  </div>
);

const COLORS = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'];
// ✅ 금액 포맷 (예: 120000 → "120,000원")
const formatCurrency = (value) => {
  if (isNaN(value)) return '-';
  return `${Number(value).toLocaleString()}원`;
};

// ✅ 비율 포맷 (예: 35.7 → "35.7%")
const formatPercent = (value) => {
  if (isNaN(value)) return '-';
  return `${parseFloat(value).toFixed(1)}%`;
};


const DelinquentDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.rowData;
  console.log("📦 전달받은 member_id:", location.state?.member_id); // ✅ 여기에 추가

  const [chartData, setChartData] = useState([]);
  const [previousOverdues, setPreviousOverdues] = useState([]);
  const [summary, setSummary] = useState(null);
  //체크리스트
  const [checklist, setChecklist] = useState([]);
  const [overdueDays, setOverdueDays] = useState(0); // ✅ 여기 추가

  //예측 -> 조치입력
  const [riskGroup, setRiskGroup] = useState(null);

  const [chartTab, setChartTab] = useState('gauge');
  const [RadarChartData, setRadarChartData] = useState([]);



  //아코디언 상세연체회수내역  
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleRows = isExpanded ? previousOverdues : previousOverdues.slice(0, 1);

  //상세연체회수내역 집계
  const totalAmount = previousOverdues.reduce((sum, item) => sum + (item.amount || 0), 0);
  const recoveredCount = previousOverdues.reduce((sum, item) =>
    item.recovered === '회수 완료' ? sum + 1 : sum, 0);
  const recoveryRate = previousOverdues.length > 0
    ? Math.round((recoveredCount / previousOverdues.length) * 100)
    : 0;

  const [activeTab, setActiveTab] = useState('history');




  useEffect(() => {
    const id = location.state?.member_id;
    const baseMonth = data?.기준월?.replace(/[^0-9]/g, '');  // YYYYMM

    if (id && baseMonth) {
      axios.get(`${BASE_URL}/api/delinquent/chart-data?customer_id=${id}&base_month=${baseMonth}`)
        .then(res => {
          setChartData(res.data.chart_data);
          setSummary(res.data.summary);

          const radarData = [
            { name: '카드론', 연체금액: 0, 회수금액: 0, 회수횟수: 0 },
            { name: '일시불', 연체금액: 0, 회수금액: 0, 회수횟수: 0 },
            { name: '할부', 연체금액: 0, 회수금액: 0, 회수횟수: 0 },
            { name: '리볼빙', 연체금액: 0, 회수금액: 0, 회수횟수: 0 },
            { name: '현금서비스', 연체금액: 0, 회수금액: 0, 회수횟수: 0 },
          ];

          res.data.chart_data.forEach(entry => {
            radarData.forEach(item => {
              const overdueAmount = entry[item.name] || 0;
              const recovered = entry['회수금액'] || 0;

              // 연체금액 집계
              if (overdueAmount > 0) {
                item.연체금액 += overdueAmount;
              }

              // 회수금액 및 회수횟수 집계
              if (recovered > 0 && overdueAmount > 0) {
                item.회수금액 += recovered;
                item.회수횟수 += 1;
              }
            });
          });

          setRadarChartData(radarData);
        })
        .catch(console.error);

      axios.get(`${BASE_URL}/api/delinquent/history`, {
        params: { customer_id: id, base_month: baseMonth }
      })
        .then(res => {
          setPreviousOverdues(res.data.history);
          const latestOverdueDays = res.data.history?.[0]?.연체일수 ?? 0;

          axios.get(`${BASE_URL}/api/delinquent/checklist`, {
            params: { customer_id: id, overdue_days: latestOverdueDays }
          })
            .then(res => {
              setChecklist(res.data.checklist);
              setOverdueDays(res.data.overdue_days);

            })
            .catch(console.error);
        })
        .catch(console.error);
    }
  }, [location.state, data]);



  const toggleChecklist = (index) => {
    const updated = [...checklist];
    updated[index].완료 = !updated[index].완료;
    setChecklist(updated);

    axios.patch(`${BASE_URL}/api/delinquent/checklist?customer_id=${location.state?.member_id}`, { checklist: updated });
  };

  if (!data) return <div>잘못된 접근입니다.</div>;

  const 회수율 = parseFloat(data?.회수율 || 0);
  const progress = Math.round((checklist.filter(i => i.완료).length / checklist.length) * 100);

  const pieData = [
    { name: '카드론', value: chartData.reduce((sum, d) => sum + (d.카드론 || 0), 0) },
    { name: '일시불', value: chartData.reduce((sum, d) => sum + (d.일시불 || 0), 0) },
    { name: '할부', value: chartData.reduce((sum, d) => sum + (d.할부 || 0), 0) },
    { name: '리볼빙', value: chartData.reduce((sum, d) => sum + (d.리볼빙 || 0), 0) },
    { name: '현금서비스', value: chartData.reduce((sum, d) => sum + (d.현금서비스 || 0), 0) },
  ];

  return (
    <div style={{ padding: 30, backgroundColor: '#f8f9fa' }}>
      <div onClick={() => navigate(-1)} style={{
        marginBottom: 20, fontSize: 16, color: '#007bff', cursor: 'pointer'
      }}>← 뒤로가기</div>

      {/* 상단 차트 */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 10, marginBottom: 30, height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="월" />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => value.toLocaleString()} // 👈 금액에 쉼표 추가
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value}%`} // 👈 퍼센트 형식
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (typeof value !== 'number') return [value, name];

                // 회수율, 연체율 → 퍼센트
                if (name.includes('율')) return [formatPercent(value), name];

                // 금액 데이터 → 원
                return [formatCurrency(value), name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="카드론" fill="#4e79a7" />
            <Bar yAxisId="left" dataKey="일시불" fill="#f28e2b" />
            <Bar yAxisId="left" dataKey="할부" fill="#e15759" />
            <Bar yAxisId="left" dataKey="리볼빙" fill="#76b7b2" />
            <Bar yAxisId="left" dataKey="현금서비스" fill="#59a14f" />

            <Line yAxisId="left" type="monotone" dataKey="연체금액" stroke="#339af0" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="회수금액" stroke="#82c91e" strokeWidth={2} />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="회수율"
              stroke="#5c6f85"
              strokeWidth={2}
              strokeDasharray="4 2"
              strokeOpacity={0.9}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="연체율"
              stroke="#ff6b6b"
              strokeWidth={2}
              strokeDasharray="4 2"
              strokeOpacity={0.6}
            />


          </ComposedChart>
        </ResponsiveContainer>

      </div>

      {/* 고객 정보 + 이력 + 회수율 차트 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 16 }}>
          <h4>👤 고객 정보</h4>
          <InfoItem label="고객명" value={data.고객명} />
          <InfoItem label="성별" value={data.성별} />
          <InfoItem label="연령" value={data.연령} />
          <InfoItem label="연락처" value={data.연락처} />
          <InfoItem label="주소" value={data.주소} />
          <InfoItem label="기준 월" value={data.기준월} />
        </div>

        <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 16 }}>
          <h4>📌 연체 및 회수 이력</h4>
          <InfoItem label="기준 년월" value={summary?.base_month || data.기준월} />
          <InfoItem label="연체기간" value={data.연체기간} />
          <InfoItem label="연체금액" value={formatCurrency(data.연체금액)} />
          <InfoItem label="회수금액" value={formatCurrency(data.회수금액)} />
          <InfoItem label="회수율" value={formatPercent(회수율)} />
        </div>


        <div style={{ flex: 1 }}>
          {/* 탭 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, borderBottom: '1px solid #ccc', marginBottom: 10 }}>
            {['gauge', 'pie', 'radar'].map(t => (
              <div key={t} onClick={() => setChartTab(t)} style={{
                padding: 8, cursor: 'pointer', fontWeight: chartTab === t ? 'bold' : 'normal',
                borderBottom: chartTab === t ? '3px solid #007bff' : 'none', color: chartTab === t ? '#007bff' : '#888'
              }}>
                {t === 'gauge' ? '회수율' : t === 'pie' ? 'Pie 차트' : 'Radar 차트'}
              </div>
            ))}
          </div>

          <div style={{
            background: '#fff', padding: 10, borderRadius: 10, border: '1px solid #ccc', textAlign: 'center'
          }}>
            {chartTab === 'gauge' && <GaugeChart percent={회수율} />}
            {chartTab === 'pie' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  padding: 0,
                  minHeight: 200,      // ✅ 너무 커지지 않도록 높이 제한
                  height: 220,         // ✅ 전체 탭 높이 맞춤
                }}
              >
                {/* Pie Chart */}
                <PieChart width={180} height={180}>  {/* ✅ 크기 조정 */}
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>

                {/* 범례 */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  fontSize: 12,
                }}>
                  {pieData.map((entry, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 6,
                      whiteSpace: 'nowrap',
                    }}>
                      <div style={{
                        width: 10,
                        height: 10,
                        backgroundColor: COLORS[i % COLORS.length],
                        marginRight: 8,
                        borderRadius: 2,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12 }}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {chartTab === 'radar' && (
              <>
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  width={300}
                  height={200}
                  data={RadarChartData}
                >
                  <PolarGrid stroke="#dee2e6" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={65} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v, n) => {
                      if (n === '연체금액' || n === '회수금액') return [formatCurrency(v), n];
                      if (n === '회수횟수') return [`${v}회`, n];
                      return [v, n];
                    }}
                    contentStyle={{ fontSize: 12 }}
                  />

                  {/* 연체금액 - 기본 */}
                  <Radar
                    name="연체금액"
                    dataKey="연체금액"
                    stroke="#339af0"
                    fill="#339af0"
                    fillOpacity={0.25}
                    strokeWidth={1.5}
                  />

                  {/* 회수금액 - 강조 (두꺼운 테두리 + 흐린 채움) */}
                  <Radar
                    name="회수금액"
                    dataKey="회수금액"
                    stroke="#82c91e"         // 진한 빨간색
                    fill="#ff4d6d"
                    fillOpacity={0.15}       // 매우 연하게
                    strokeWidth={3}          // 강조된 테두리
                  />

                  {/* 회수횟수 - 얇고 연하게 */}
                  <Radar
                    name="회수횟수"
                    dataKey="회수횟수"
                    stroke="#f06595"
                    fill="#f06595"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                </RadarChart>


                {/* ✅ 범례 개선 */}
                <div style={{
                  fontSize: 12,
                  marginTop: 12,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      backgroundColor: '#339af0',
                      borderRadius: 2
                    }}></span>
                    <span>연체금액</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      backgroundColor: '#82c91e',
                      borderRadius: 2
                    }}></span>
                    <span>회수금액</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      backgroundColor: '#f06595',
                      borderRadius: 2
                    }}></span>
                    <span>회수횟수</span>
                  </div>
                </div>
              </>
            )}


          </div>
        </div>
      </div>
      {/* ✅ 좌우 배치할 박스들을 감싸는 flex 컨테이너 */}
      <div style={{ marginBottom: 30 }}>
        {/* 언더라인 탭 */}
        <div style={{ display: 'flex', borderBottom: '2px solid #dee2e6', marginBottom: 16 }}>
          {[
            { key: 'history', label: '📄 상세 연체/회수 내역' },
            { key: 'log', label: '📑 조치 이력' },
            { key: 'risk', label: '🚨 위험군 예측' },
            { key: 'checklist', label: '✅ 추심 체크리스트' },
            { key: 'action', label: '📝 조치 입력' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #364fc7' : 'none',
                background: 'transparent',
                fontWeight: 'bold',
                color: activeTab === tab.key ? '#364fc7' : '#495057',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {/* 탭 내용 */}
        {activeTab === 'history' && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(66, 36, 36, 0.08)',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: 15, color: '#343a40', margin: 0 }}>📄 상세 연체/회수 내역</h4>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  fontSize: 12,
                  background: '#edf2ff',
                  border: '1px solid #91a7ff',
                  color: '#364fc7',
                  borderRadius: 5,
                  cursor: 'pointer',
                  padding: '4px 10px',
                  transition: 'all 0.2s ease',
                }}
              >
                {isExpanded ? '▲ 닫기' : '▼ 전체 보기'}
              </button>
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 10,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <thead>
                <tr style={{
                  background: '#364fc7',
                  color: '#fff',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  <th style={{ padding: '8px' }}>년/월</th>
                  <th style={{ padding: '8px' }}>연체 기간</th>
                  <th style={{ padding: '8px' }}>연체 금액</th>
                  <th style={{ padding: '8px' }}>회수 금액</th>
                  <th style={{ padding: '8px' }}>회수 상태</th>
                  <th style={{ padding: '8px' }}>회수 율</th>
                  <th style={{ padding: '8px' }}>한도 회복 여부</th>
                </tr>
              </thead>
              <tbody>
                {!isExpanded ? (
                  <tr style={{ backgroundColor: '#fff', textAlign: 'center' }}>
                    <td colSpan={7} style={{ padding: '10px', fontWeight: 500 }}>
                      총 연체 금액: {(summary?.total_overdue || 0).toLocaleString()}원 / 총 회수 금액: {(summary?.total_recovered || 0).toLocaleString()}원 / 회수율: {summary?.recovery_rate || 0}%
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((h, i) => {
                    const amount = parseInt((h["연체 금액"] || "0").replace(/[^0-9]/g, ""));
                    const recoveredAmount = parseInt((h["회수 금액"] || "0").replace(/[^0-9]/g, ""));
                    const rate = parseInt((h["회수율"] || "0").replace(/[^0-9]/g, ""));
                    const overdueDays = h["연체일수"] ?? "-";
                    const limitStatus = h["한도 회복 여부"] || "변동 없음";

                    return (
                      <tr
                        key={i}
                        style={{
                          backgroundColor: i % 2 === 0 ? '#f8f9fa' : '#fff',
                          textAlign: 'center',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e7f5ff'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#f8f9fa' : '#fff'}
                      >
                        <td style={{ padding: '8px' }}>{h.month}</td>
                        <td>{overdueDays}일</td>
                        <td style={{ padding: '8px' }}>{amount.toLocaleString()}원</td>
                        <td style={{ padding: '8px' }}>{recoveredAmount.toLocaleString()}원</td>
                        <td style={{ padding: '8px' }}>{h["회수 상태"] || '-'}</td>
                        <td style={{ padding: '8px' }}>{rate}%</td>
                        <td style={{ padding: '8px' }}>{limitStatus}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ✅ 추심 체크리스트 */}
        {activeTab === 'checklist' && (
          <div style={{
            background: '#fff',
            padding: 5,
            borderRadius: 10,
            fontSize: 13,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              fontSize: 14,
              color: '#495057',
              marginBottom: 10,
              padding: '6px 12px',
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #dee2e6'
            }}>
              <span>⏱ 연체 기간 / Delinquent Day : <strong>{overdueDays}일</strong></span>
            </div>

            {(overdueDays <= 0 || overdueDays === -99999999) ? (
              <div style={{
                padding: '16px',
                background: '#f1f3f5',
                color: '#868e96',
                textAlign: 'center',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
              }}>
                ✅ 현재 연체 정보가 없습니다.
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: 12,
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#0f172a',
                    display: 'inline-block',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  진행률: <span style={{ color: '#3b82f6' }}>{progress}%</span>
                </div>

                <div
                  style={{
                    height: 7,
                    width: '100%',
                    background: '#e2e8f0',
                    borderRadius: 5,
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                      transition: 'width 0.6s ease-in-out',
                    }}
                  />
                </div>

                {checklist.map((item, i) => (
                  <ChecklistItem key={i} 항목={item.항목} 완료={item.완료} onToggle={() => toggleChecklist(i)} />
                ))}
              </>
            )}
          </div>
        )}

        {/* 📑 조치 이력 */}
        {activeTab === 'log' && (
          <div>
            <CollectionLogList memberId={data.member_id} />
          </div>
        )}


        <>
          {/* 🚨 위험군 예측 */}
          {activeTab === 'risk' && (
            <div>
              <RiskGroupDisplay
                memberId={data.member_id}
                onPredicted={setRiskGroup}
              />
            </div>
          )}

          {/* 📝 조치 입력 */}
          {activeTab === 'action' && (
            <div>
              <CollectionActionForm
                memberId={data.member_id}
                riskGroup={riskGroup}
              />
            </div>
          )}
        </>
      </div>
    </div>

  );
};

export default DelinquentDetailPage;
