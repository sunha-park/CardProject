import React, { useEffect } from 'react';

const COLORS = { LOW: '#51cf66', MID: '#fab005', HIGH: '#ff6b6b' };

export default function RiskGroupDisplay({ memberId, onPredicted }) {
  /* ▶ 의사-랜덤으로 LOW/MID/HIGH 반환 */
  useEffect(() => {
    const groups = ['LOW', 'MID', 'HIGH'];
    const idx = Math.abs(hashCode(memberId)) % 3;
    onPredicted && onPredicted(groups[idx]);
  }, [memberId, onPredicted]);

  const group = ['LOW', 'MID', 'HIGH']
    [Math.abs(hashCode(memberId)) % 3];

  return (
    <div style={{
      background: '#fff', padding: 30, borderRadius: 12, textAlign: 'center',
      color: COLORS[group], fontSize: 28, fontWeight: 700,
      boxShadow: '0 4px 12px rgba(0,0,0,.06)'
    }}>
      🚨 예측 위험군 : {group}
    </div>
  );
}

/* 간단 해시 → 항시 동일 난수 */
function hashCode(str = '') {
  return [...str].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
}
