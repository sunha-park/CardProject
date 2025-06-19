import React from 'react';
import './Modal.css';

const pastelColors = {
  '카드론': '#A7D0CD',
  '일시불': '#FFE8A3',
  '할부': '#FFB6B9',
  '리볼빙': '#D3C0F9',
  '대출': '#C0E1FF',
  '회수율': '#D9EDF7',
  '회수금액': '#DFF0D8',
  '연체금액': '#F2DEDE',
  '연체율': '#FBE3E3', // 필요 시 추가
};

const DelinquentDetailModal = ({ visible, onClose, period, details }) => {
  if (!visible) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{period} 상세 내역</h2>
          <button className="close-button" onClick={onClose}>✖</button>
        </div>

        <div className="modal-content">
          <ul>
            {Object.entries(details).map(([key, value]) => (
              <li
                key={key}
                style={{
                  backgroundColor: pastelColors[key] || '#f4f4f4',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '15px'
                }}
              >
                <span className="detail-key">{key}</span>
                <span className="detail-value">
                  {key.includes('율')
                    ? `${parseFloat(value).toFixed(1)}%`
                    : `₩ ${Math.round(Number(value)).toLocaleString('ko-KR')} 원`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DelinquentDetailModal;
