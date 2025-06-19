import React, { useEffect, useState } from 'react';

export default function CollectionLogList({ memberId }) {
  const [logs, setLogs] = useState([]);

  /* ▶ 더미 데이터 주입 – 서버 호출 없음 */
  useEffect(() => {
    const dummy = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      date: `2025-0${i + 1}-15`,
      action: ['유선 독촉', '문자 발송', '내용증명'][i % 3],
      memo: `샘플 메모 ${i + 1}`,
    }));
    setLogs(dummy);
  }, [memberId]);

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 10 }}>
      <h4>📑 조치 이력 (Mock)</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#e7eaf6' }}>
            <th style={{ padding: 6 }}>일자</th>
            <th>조치</th>
            <th>메모</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ textAlign: 'center' }}>
              <td style={{ padding: 6 }}>{log.date}</td>
              <td>{log.action}</td>
              <td>{log.memo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
