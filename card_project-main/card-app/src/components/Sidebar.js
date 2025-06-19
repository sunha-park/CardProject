import React from 'react';
import { Link } from 'react-router-dom';
import logo from './card_1092_2.jpg'; // 카드사 로고 이미지 경로

const Sidebar = () => {
  const style = {
    width: '200px',
    height: '100vh',
    backgroundColor: 'white',
    padding: '20px',
    borderRight: '1px solid #ddd',
    boxSizing: 'border-box',
    
  };

  const linkStyle = {
    display: 'block',
    marginBottom: '10px',
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
  };

  const logoStyle = {
    width: '150px',
    marginBottom: '30px',
  };

 

  return (
    <div style={style}>
      <img src={logo} alt="Card Company" style={logoStyle} />

      <h3>추심 관리</h3>
      <Link to="/" style={linkStyle}>📂 연체 고객 리스트</Link>
      <Link to="/collections/handover" style={linkStyle}>📤 추심 이관관리</Link>
      <h3>이탈 방지</h3>
      <Link to="/leavers" style={linkStyle}>📄 이탈예측 고객</Link>
      <Link to="/marketing/card-benefits" style={linkStyle}>📍 카드 혜택 추천</Link>
      {/* <Link to="/marketing/retention-event" style={linkStyle}>🎁 이탈방지 이벤트</Link> */}
      {/* <Link to="/collections/delinquentmanage" style={linkStyle}>📤 추심 위험군 예측</Link> */}
    </div>
  );
};

export default Sidebar;
