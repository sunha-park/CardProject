import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './DelinquentTargetPage.css';
import RiskGroupDisplay from './RiskGroupDisplay';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function DelinquentTargetPage() {
  const [activeTab, setActiveTab] = useState('60_90');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    axios
      .get(`http://34.47.73.162:7000/api/delinquent/target-list?term=${activeTab}`)
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error(err));
  }, [activeTab]);

  const handleSelectCustomer = (row) => {
    setSelectedCustomer(row);
  };

  const handlePdfDownload = () => {
    const target = document.getElementById('pdf-target');
    if (!target) return;

    html2canvas(target, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`연체고객_${selectedCustomer?.member_id || '정보'}.pdf`);
    });
  };

  return (
    <div className="delinquent-page" style={{ padding: '24px' }}>
      <h2 className="page-title">연체 추심관리대상</h2>

      {/* ✅ PDF 캡처 대상 영역 */}
      <div id="pdf-target">
        {/* 예측 결과 */}
        <div style={{ marginBottom: 30 }}>
          <RiskGroupDisplay memberId={selectedCustomer?.member_id} />
        </div>

        {/* 고객 정보 */}
        <div className="info-section" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          <div className="info-box">
            <h4>고객 기본정보</h4>
            {selectedCustomer ? (
              <>
                <p>이름: {selectedCustomer.name}</p>
                <p>회원번호: {selectedCustomer.member_id}</p>
                <p>성별: {selectedCustomer.gender}</p>
                <p>나이: {selectedCustomer.age}</p>
                <p>연락처: {selectedCustomer.phone_number}</p>
                <p>주소: {selectedCustomer.address}</p>
              </>
            ) : <p>고객을 선택하세요</p>}
          </div>

          <div className="info-box">
            <h4>연체 정보</h4>
            {selectedCustomer ? (
              <>
                <p>연체 년월: {selectedCustomer.base_month}</p>
                <p>연체 금액: {Number(selectedCustomer.overdue_principal_recent).toLocaleString()}원</p>
                <p>연체 일수: {selectedCustomer.overdue_days_recent}일</p>
                <p>회수 금액: {Number(selectedCustomer.recovered_amount || 0).toLocaleString()}원</p>
                <p>회수율: {selectedCustomer.recovery_rate || '-'}%</p>
                <p>연체율: {selectedCustomer.delinquency_rate || '-'}%</p>
              </>
            ) : <p>고객을 선택하세요</p>}
          </div>
        </div>

        {/* 추심 이력 / 체크리스트 */}
        <div className="detail-section">
          <div className="log-box">
            <h4>추심 이력</h4>
            {selectedCustomer ? (
              <ul>
                <li>최근 추심: 전화 상담</li>
                <li>2025-05-01 문자 발송</li>
              </ul>
            ) : <p>고객을 선택하세요</p>}
          </div>

          <div className="checklist-box">
            <h4>체크리스트</h4>
            {selectedCustomer ? (
              <ul>
                <li>SMS 완료</li>
                <li>콜 시도 중</li>
              </ul>
            ) : <p>고객을 선택하세요</p>}
          </div>
        </div>
      </div>

      {/* 파일 업로드 및 PDF 버튼 */}
      <div className="file-section">
        <h4>파일 업로드 / PDF 다운로드</h4>
        <button disabled={!selectedCustomer}>파일 업로드</button>
        <button onClick={handlePdfDownload} disabled={!selectedCustomer}>PDF 다운로드</button>
      </div>

      {/* 언더라인 탭 */}
      <div className="tab-bar" style={{
        marginTop: 30, marginBottom: 10, display: 'flex', gap: 12, borderBottom: '2px solid #dee2e6'
      }}>
        {[
          { key: '60_90', label: '60~90일' },
          { key: '90_plus', label: '90일 이상' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #364fc7' : 'none',
              color: activeTab === tab.key ? '#364fc7' : '#495057',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 검색창 */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="이름, 회원번호, 주소, 연락처 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            fontSize: 14
          }}
        />
      </div>

      {/* AG Grid */}
      <div className="ag-theme-alpine ag-grid" style={{ height: 320, width: '100%' }}>
        <AgGridReact
          rowData={customers}
          columnDefs={[
            { headerName: '회원번호', field: 'member_id' },
            { headerName: '이름', field: 'name' },
            { headerName: '성별', field: 'gender' },
            { headerName: '나이', field: 'age' },
            { headerName: '연락처', field: 'phone_number' },
            { headerName: '주소', field: 'address' },
            { headerName: '연체 일수', field: 'overdue_days_recent' },
          ]}
          onRowClicked={(e) => handleSelectCustomer(e.data)}
          quickFilterText={searchText}
        />
      </div>
    </div>
  );
}

export default DelinquentTargetPage;
