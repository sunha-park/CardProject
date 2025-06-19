import React, { useState } from 'react';
import axios from 'axios';
import styles from '../CollectionHandoverPage.module.css';

const actionTypeOptions = {
  '정상군': ['안내문자', '정보제공', '기타'],
  '관찰군': ['안내전화', '이용유도', '실적점검', '기타'],
  '준위험군': ['적극적 연락', '상환 안내', '방문', '기타'],
  '위험군': ['집중관리', '채권회수', '방문', '법적절차', '기타']
};
const getActionTypeOptions = (group) =>
  actionTypeOptions[group] || ['기타'];

function CollectionActionForm({ memberId, riskGroup, onSaved }) {
  const [form, setForm] = useState({
    action_type: '', action_detail: '', action_by: '', action_channel: ''
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // 파일 선택 핸들러
  const handleFileChange = e => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);

    // FormData를 사용하여 파일 포함 전송
    const formData = new FormData();
    formData.append('member_id', memberId);
    formData.append('risk_group', riskGroup || '');
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append('action_file', file);

    await axios.post('http://34.47.73.162:7101/api/collection-action', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    setSaving(false);
    setForm({ action_type: '', action_detail: '', action_by: '', action_channel: '' });
    setFile(null);
    if (onSaved) onSaved();
  };

  return (
    <div className={styles.cardBox}>
      <h4 className={styles.cardTitle}>조치 입력</h4>
      {riskGroup && (
        <div style={{ color: "#633cbb", fontSize: 15, marginBottom: 8 }}>
          {riskGroup} 권장조치: {getActionTypeOptions(riskGroup).join(", ")}
        </div>
      )}
      <form className={styles.actionForm} onSubmit={handleSubmit}>
        <select name="action_type" value={form.action_type} onChange={handleChange} required>
          <option value="">조치 유형 선택</option>
          {(getActionTypeOptions(riskGroup || '기타')).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <input
          name="action_detail"
          value={form.action_detail}
          onChange={handleChange}
          placeholder="조치 내용"
          required
        />
        <input
          name="action_by"
          value={form.action_by}
          onChange={handleChange}
          placeholder="담당자"
        />
        <input
          name="action_channel"
          value={form.action_channel}
          onChange={handleChange}
          placeholder="채널(예: 전화/문자/앱 등)"
        />
        {/* 파일 업로드 UI 추가 */}
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx,.mp3,.wav,.gif"
          onChange={handleFileChange}
          style={{ marginTop: 10, marginBottom: 10 }}
        />
        <button type="submit" disabled={saving}>
          {saving ? "저장 중..." : "조치 저장"}
        </button>
      </form>
      {/* 파일명 미리보기 */}
      {file && <div style={{ fontSize: 13, color: "#666" }}>첨부파일: {file.name}</div>}
    </div>
  );
}
export default CollectionActionForm;
