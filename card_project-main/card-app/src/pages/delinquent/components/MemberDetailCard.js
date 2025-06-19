import React from 'react';
import styles from '../CollectionHandoverPage.module.css';

function MemberDetailCard({ member }) {
  if (!member) return null;

  const mainFields = [
    ['회원번호', member.member_id],
    ['이름', member.name],
    ['기준월', member.base_month],
    ['나이', member.age],
    ['성별', member.gender],
    ['전화번호', member.phone_number],
    ['주소', member.address],
  ];

  return (
    <div className={styles.cardBox}>
      <h4 className={styles.cardTitle}>상세정보</h4>
      <div className={styles.memberInfoGrid}>
        {mainFields.map(([label, value]) => (
          <div key={label} className={styles.infoItem}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MemberDetailCard;
