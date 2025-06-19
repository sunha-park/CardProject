import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardToggle from '../../components/DashboardToggle';
import axios from 'axios';
import RiskLineChart from '../../components/RiskLineChart'; // ← 추가

// ✅ 공통 백엔드 주소 설정 (추후 axiosInstance로 분리 추천)
const API_BASE_URL = 'http://34.47.73.162:7100';

const CollectionDashboardPage = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('정상군');
  const [summaryData, setSummaryData] = useState(null);
  const tabRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const tabs = ['정상군', '관찰군', '준위험군', '위험군'];

  // ✅ 1. 백엔드에서 기간별 요약 데이터 가져오기
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/risk-summary`);
        console.log('✅ summaryData:', res.data);
        setSummaryData(res.data);
      } catch (err) {
        console.error('❌ 데이터 불러오기 실패:', err);
      }
    };
    fetchSummary();
  }, []);  // ✅ 최초 1번만 호출

  // ✅ 2. 선택된 탭의 위치를 기준으로 underline 위치 지정
  useEffect(() => {
    const selectedTab = tabRefs.current[selectedPeriod];
    if (selectedTab) {
      const { offsetLeft, offsetWidth } = selectedTab;
      setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [selectedPeriod]);

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      {/* 우측 상단 토글 */}
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <DashboardToggle />
      </div>

      <h1>📊 추심관리 대시보드</h1>

      {/* 상단 탭 + 언더라인 */}
      <div style={{ position: 'relative', marginBottom: '40px', borderBottom: '1px solid #ccc' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
            {tabs.map((label) => (
              <div
                key={label}
                ref={(el) => (tabRefs.current[label] = el)}
                onClick={() => setSelectedPeriod(label)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: selectedPeriod === label ? 'bold' : 'normal',
                  color: selectedPeriod === label ? '#1e3a8a' : '#333',
                  transition: 'color 0.2s ease',
                }}
              >
                {label}
              </div>
            ))}
        </div>

        {/* 슬라이딩 언더라인 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            height: '3px',
            backgroundColor: '#1e3a8a',
            transition: 'left 0.3s ease, width 0.3s ease',
            left: underlineStyle.left,
            width: underlineStyle.width,
          }}
        />
      </div>

      {/* 요약 박스 3개 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div
          onClick={() => navigate('/collections/delinquents')}
          style={{
            backgroundColor: '#4a90e2',
            color: '#fff',
            padding: '20px',
            flex: 1,
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <h3>연체 고객 관리</h3>
          <p>{summaryData?.[selectedPeriod] ?? '-'}명</p>
        </div>

        <div
          style={{
            backgroundColor: '#4a90e2',
            color: '#fff',
            padding: '20px',
            flex: 1,
            borderRadius: '8px',
          }}
        >
          <h3>체크리스트 총 진행률</h3>
          <p>{summaryData?.checklistProgress ?? '-'}%</p>
        </div>

        <div
          onClick={() => navigate('/collections/handover')}
          style={{
            backgroundColor: '#4a90e2',
            color: '#fff',
            padding: '20px',
            flex: 1,
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <h3>추심 대상 관리</h3>
          <p>{summaryData?.handoverCount ?? '-'}건</p>
        </div>
      </div>

      <RiskLineChart selectedGroup={selectedPeriod} />

      {/* <div style={{ fontStyle: 'italic', color: '#666' }}>
        ※ {selectedPeriod}일 연체 고객군에 대한 데이터입니다.
      </div> */}
    </div>
  );
};

export default CollectionDashboardPage;
