import React, { useState } from 'react';
import styles from './DelinquentManagePage.module.css';

import MemberList from './components/MemberList';
import MemberDetailCard from './components/MemberDetailCard';
import RiskGroupDisplay from './components/RiskGroupDisplay';
import CollectionLogList from './components/CollectionLogList';
import CollectionActionForm from './components/CollectionActionForm';


function DelinquentManagePage() {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('risk');
  const [refresh, setRefresh] = useState(0);
  const [riskGroup, setRiskGroup] = useState(null);

  return (
    <div className={styles.container}>
      <div className={styles.topContent}>
        {selected ? (
          <>
            <h2 style={{ marginBottom: 6 }}>
              회원: {selected.name} ({selected.member_id})
            </h2>

            {/* ✅ 탭 버튼 추가 */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tabButton} ${tab === 'risk' ? styles.active : ''}`}
                onClick={() => setTab('risk')}
              >위험군 예측</button>
              <button
                className={`${styles.tabButton} ${tab === 'info' ? styles.active : ''}`}
                onClick={() => setTab('info')}
              >상세정보</button>
              <button
                className={`${styles.tabButton} ${tab === 'log' ? styles.active : ''}`}
                onClick={() => setTab('log')}
              >조치 이력</button>
              <button
                className={`${styles.tabButton} ${tab === 'action' ? styles.active : ''}`}
                onClick={() => setTab('action')}
              >조치 입력</button>
              
            </div>

            {/* ✅ 탭 내용 표시 */}
            {tab === 'info' && <MemberDetailCard member={selected} />}
            {tab === 'risk' && (
              <div className={styles.cardBox}>
                <h4 className={styles.cardTitle}>위험군 예측</h4>
                <RiskGroupDisplay memberId={selected.member_id} onPredicted={setRiskGroup} />
              </div>
            )}
            {tab === 'log' && <CollectionLogList memberId={selected.member_id} key={refresh} />}
            {tab === 'action' && (
              <CollectionActionForm
                memberId={selected.member_id}
                riskGroup={riskGroup}
                onSaved={() => setRefresh((r) => r + 1)}
              />
            )}
            
          </>
        ) : (
          <div className={styles.detailBox}>회원을 선택하세요.</div>
        )}
      </div>

      {/* ✅ 하단: AG Grid */}
      <div className={styles.bottomList}>
        <MemberList onSelect={setSelected} />
      </div>
    </div>
  );
}

export default DelinquentManagePage;
