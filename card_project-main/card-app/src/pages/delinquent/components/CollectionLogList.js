import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../CollectionHandoverPage.module.css';

function CollectionLogList({ memberId }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!memberId) return;
    axios.get(`http://34.47.73.162:7101/api/collection-log/${memberId}`)
      .then(res => setLogs(res.data));
  }, [memberId]);

// 첨부파일 경로 변환 (반드시 Flask 백엔드로!)
const getDownloadUrl = (fileUrl) => {
  if (!fileUrl) return null;
  // fileUrl이 'uploads/action_files/xxx' 포함하면 파일명 추출
  const idx = fileUrl.indexOf('uploads/action_files/');
  let filename;
  if (idx >= 0) {
    filename = fileUrl.slice(idx + 'uploads/action_files/'.length);
  } else {
    // 혹시 파일명이 바로 들어오는 경우 (예외처리)
    filename = fileUrl;
  }
  // 백엔드 포트로 맞춰서 절대경로로 반환
  return `http://34.47.73.162:7101/uploads/action_files/${filename}`;
};

  return (
    <div className={styles.cardBox}>
      <h4 className={styles.cardTitle}>조치 이력</h4>
      {logs.length === 0 ? (
        <div className={styles.emptyMsg}>등록된 조치 이력이 없습니다.</div>
      ) : (
        <table className={styles.infoTable}>
          <thead>
            <tr>
              <th>일시</th>
              <th>조치유형</th>
              <th>내용</th>
              <th>담당자</th>
              <th>채널</th>
              <th>첨부</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.action_date?.slice(0, 16).replace('T', ' ')}</td>
                <td>{log.action_type}</td>
                <td>{log.action_detail}</td>
                <td>{log.action_by}</td>
                <td>{log.action_channel}</td>
                <td>
                  {/* 첨부파일이 있을 때만 링크/버튼 표시 */}
                  {log.action_file_name && log.action_file_url ? (
                    <a
                      href={getDownloadUrl(log.action_file_url)}
                      download={log.action_file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.downloadBtn}
                    >
                      {log.action_file_name}
                    </a>
                  ) : (
                    <span style={{ color: "#bbb", fontSize: "0.95em" }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CollectionLogList;
