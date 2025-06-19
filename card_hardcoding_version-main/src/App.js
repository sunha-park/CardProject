// ✅ App.js - 라우팅 + 공통 사이드바 적용
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LeaverListPage from './pages/secession/LeaverListPage';
import CardBenefitPage from './pages/secession/CardBenefitPage';
import RetentionEventPage from './pages/secession/RetentionEventPage';

import DelinquentListPage from './pages/delinquent/DelinquentListPage';
import DelinquentManagePage from './pages/delinquent/DelinquentManagePage';
import CollectionHandoverPage from './pages/delinquent/CollectionHandoverPage';
import LeaverDashboardPage from './pages/dashboard/LeaverDashboardPage';
import CollectionDashboardPage from './pages/dashboard/CollectionDashboardPage';
import DelinquentDetailPage from './pages/delinquent/components/DelinquentDetailPage';
import DelinquentDetailTargetPage from './pages/delinquent/components/DelinquentDetailTarget';
import Sidebar from './components/Sidebar';
import CustomerDetailPage from './pages/secession/CustomerDetailPage';
function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '20px' }}>
          <Routes>
            
            <Route path="/" element={<DelinquentListPage />} />
            <Route path="/dashboard/leaver" element={<LeaverDashboardPage />} />
            <Route path="/dashboard/collection" element={<CollectionDashboardPage />} />
            <Route path="/leavers" element={<LeaverListPage />} />
      
            <Route path="/marketing/card-benefits" element={<CardBenefitPage />} />
            <Route path="/marketing/retention-event" element={<RetentionEventPage />} />
            <Route path="/collections/handover" element={<CollectionHandoverPage />} />
            <Route path="/collections/delinquentmanage" element={<DelinquentManagePage />} />
            <Route path="/delinquent/detail" element={<DelinquentDetailPage />} />
            <Route path="/delinquent/DelinquentDetailTarget" element={<DelinquentDetailTargetPage />} />
            <Route path="/customer/:name" element={<CustomerDetailPage />} />
    

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;