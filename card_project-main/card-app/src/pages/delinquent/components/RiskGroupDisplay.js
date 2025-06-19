import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RiskGroupDisplay({ memberId, onPredicted }) {
  const [riskGroup, setRiskGroup] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (memberId) {
      setLoading(true);
      axios.get(`http://34.47.73.162:7101/api/predict-risk-group/${memberId}`)
        .then(res => {
          setRiskGroup(res.data.risk_group);
          setConfidence(res.data.confidence);
          if (onPredicted) onPredicted(res.data.risk_group);
        })
        .catch(() => {
          setRiskGroup('예측실패');
          setConfidence(null);
          if (onPredicted) onPredicted(null);
        })
        .finally(() => setLoading(false));
    }
  }, [memberId, onPredicted]);

  const colorMap = {
    '위험군': '#d32f2f',
    '준위험군': '#f57c00',
    '관리군': '#1976d2',
    '정상군': '#388e3c',
    '예측실패': '#6c757d'
  };

  const getAdvisoryMessage = (group) => {
    switch (group) {
      case '위험군':
        return (
          <>
            <b>주의:</b> 해당 고객은 <b>법적 조치 및 강력한 추심</b>이 필요한 고위험 대상입니다.<br />
            관련 <b>법률 서류 준비, 문자 발송, 통화기록 보관</b>이 필수이며,<br />
            <b>체크리스트 기반의 일자별 정밀 관리</b>를 즉시 시행하시기 바랍니다.
          </>
        );
     
      case '준위험군':
      case '관리군':
        return (
          <>
            <b>관리 필요:</b> 해당 고객은 <b>지속적인 모니터링 및 회수 활동</b>이 필요한 관리 대상입니다.<br />
            <b>체크리스트</b>를 기반으로 <b>정기적인 연락 및 연체금 회수 프로세스</b>를 추진하세요.
          </>
        );
      case '정상군':
        return (
          <>
            <b>안정:</b> 현재 고객은 <b>연체 회수 가능성이 높은</b> 저위험군입니다.<br />
            기본적인 관리 수준을 유지하되, <b>지속적인 신용 유지 관리</b>를 권장합니다.
          </>
        );
      default:
        return <>예측된 고객 등급 정보가 없습니다.</>;
    }
  };

  return (
    <div style={{
      width: '100%',
      background: '#ffffff',
      border: '1px solid #d5dbe0',
      borderRadius: 12,
      padding: '20px 24px',
      fontSize: 15,
      color: '#1e2b4f',
      fontFamily: `'Segoe UI', Roboto, 'Apple SD Gothic Neo', sans-serif`,
      boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 20,
      flexWrap: 'wrap'
    }}>
      {/* 좌측: 예측 결과 요약 */}
      <div style={{ flex: '1 1 260px' }}>
        <div style={{
          marginBottom: 12,
          fontWeight: 600,
          fontSize: 16,
          color: '#1e2b4f',
          borderBottom: '1px solid #e0e6eb',
          paddingBottom: 6
        }}>
          🚨 위험군 예측 결과
        </div>

        <div style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 500 }}>위험군:</span>{' '}
          <span style={{
            fontWeight: 700,
            color: colorMap[riskGroup] || '#555',
            fontSize: 16
          }}>
            {loading ? '예측 중...' : riskGroup}
          </span>
        </div>

        {confidence !== null && (
          <div style={{
            fontSize: 13,
            color: '#4b87ca',
            fontWeight: 500
          }}>
            신뢰도: {(confidence * 100).toFixed(1)}%
          </div>
        )}
      </div>

      {/* 우측: 안내 메시지 */}
      <div style={{
        flex: '2 1 360px',
        background: '#f8f9fc',
        borderLeft: `4px solid ${colorMap[riskGroup] || '#ccc'}`,
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 14,
        lineHeight: 1.6,
        color: '#2f3e5c'
      }}>
        {loading ? '📡 예측 중입니다...' : getAdvisoryMessage(riskGroup)}
      </div>
    </div>
  );
}

export default RiskGroupDisplay;
