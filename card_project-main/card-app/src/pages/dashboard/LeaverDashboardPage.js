import React, { useState, useEffect, useRef } from 'react';
//import { useNavigate } from 'react-router-dom';
import DashboardToggle from '../../components/DashboardToggle';

const LeaverDashboardPage = () => {
  //const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('leaver'); // leaver, marketing, vip
  const tabRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const tabs = [
    { label: '이탈방지', value: 'leaver' },
    { label: '마케팅', value: 'marketing' },
    { label: 'VIP상향 대상고객', value: 'vip' },
  ];

  // ✅ underline 위치 업데이트
  useEffect(() => {
    const tab = tabRefs.current[selectedTab];
    if (tab) {
      const { offsetLeft, offsetWidth } = tab;
      setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [selectedTab]);

  // ✅ 탭별 콘텐츠 반환 함수
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'leaver':
        return (
          <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
            <div
              style={{
                backgroundColor: '#4a90e2',
                color: '#fff',
                padding: '20px',
                flex: 1,
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <h3>이탈 예상 고객</h3>
            </div>
            <div
              style={{
                backgroundColor: '#4a90e2',
                color: '#fff',
                padding: '20px',
                flex: 1,
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <h3>추천 혜택</h3>
            </div>
            <div
              style={{
                backgroundColor: '#4a90e2',
                color: '#fff',
                padding: '20px',
                flex: 1,
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <h3>이탈 추적 관리</h3>
            </div>
          </div>
        );
      case 'marketing':
        return <p style={{ marginTop: '30px' }}>📢 마케팅 전략 및 캠페인 성과 요약 예정</p>;
      case 'vip':
        return <p style={{ marginTop: '30px' }}>👑 VIP상향 대상 고객 분석 예정</p>;
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      {/* 우측 상단 토글 */}
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <DashboardToggle />
      </div>

      <h1>📊 이탈 방지 대시보드</h1>

      {/* 상단 탭 + underline */}
      <div style={{ position: 'relative', marginBottom: '40px', borderBottom: '1px solid #ccc' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {tabs.map((tab) => (
            <div
              key={tab.value}
              ref={(el) => (tabRefs.current[tab.value] = el)}
              onClick={() => setSelectedTab(tab.value)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: selectedTab === tab.value ? 'bold' : 'normal',
                color: selectedTab === tab.value ? '#1e3a8a' : '#333',
                transition: 'color 0.2s ease',
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* 슬라이딩 underline */}
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

      {/* 탭별 콘텐츠 렌더링 */}
      {renderTabContent()}
    </div>
  );
};

export default LeaverDashboardPage;
