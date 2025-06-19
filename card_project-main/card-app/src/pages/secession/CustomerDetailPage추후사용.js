import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CustomerDetailPanel from './CustomerDetailPanel'; // 기존 디테일 UI 재사용

const BASE_URL = 'http://34.47.73.162:7000';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/leaver/detail`, {
          params: { id }
        });
        setCustomer(res.data);
      } catch (err) {
        console.error('고객 상세 정보 로딩 실패:', err);
      }
    };

    fetchCustomer();
  }, [id]);

  return (
    <div style={{ padding: '20px' }}>
      {customer ? (
        <CustomerDetailPanel customer={customer} />
      ) : (
        <p>⏳ 고객 정보를 불러오는 중입니다...</p>
      )}
    </div>
  );
};

export default CustomerDetailPage;
