import React, { useState } from 'react';

export default function CollectionActionForm({ memberId, riskGroup }) {
  const [memo, setMemo]   = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    /* ▶ 서버 호출 대신 즉시 성공 flag */
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setMemo('');
  };

  return (
    <form onSubmit={handleSubmit}
          style={{ background: '#fff', padding: 20, borderRadius: 10 }}>
      <h4>📝 조치 입력 (Mock)</h4>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>고객 ID:</label>
        {memberId}
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>위험군:</label>
        {riskGroup || '-'}
      </div>

      <textarea
        value={memo}
        onChange={e => setMemo(e.target.value)}
        placeholder="조치 내용을 입력하세요"
        style={{
          width: '100%', height: 90, padding: 10, border: '1px solid #ced4da',
          borderRadius: 6, resize: 'vertical'
        }}
      />

      <button type="submit"
              style={{
                marginTop: 12, padding: '8px 18px', border: 'none',
                background: '#364fc7', color: '#fff', borderRadius: 6,
                cursor: 'pointer'
              }}>
        저장
      </button>

      {saved && (
        <div style={{ marginTop: 10, color: '#51cf66', fontWeight: 600 }}>
          저장되었습니다!
        </div>
      )}
    </form>
  );
}
