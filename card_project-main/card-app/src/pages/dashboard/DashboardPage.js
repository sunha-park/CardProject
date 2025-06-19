import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 통합 대시보드</h1>
      <p>전체 이탈 및 연체 현황을 종합적으로 요약한 메인 대시보드입니다.</p>

      <div style={{ marginTop: '30px' }}>
        <ul>
          <li>이탈 위험 고객 수: 125명</li>
          <li>연체 고객 수: 98명</li>
          <li>캠페인 응답률: 18.4%</li>
          <li>추심 성공률: 45.2%</li>
        </ul>
      </div>

      <div style={{ marginTop: '40px' }}>
        <button
          onClick={() => navigate('/dashboard/leaver')}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          👉 이탈 방지 대시보드 보기
        </button>
        <button
          onClick={() => navigate('/dashboard/collection')}
          style={{ padding: '10px 20px' }}
        >
          👉 추심관리 대시보드 보기
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
