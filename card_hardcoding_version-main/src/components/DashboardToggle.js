import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardToggle = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLeaver = location.pathname.includes('/dashboard/leaver');

  const handleToggle = () => {
    if (isLeaver) {
      navigate('/dashboard/collection');
    } else {
      navigate('/dashboard/leaver');
    }
  };

  return (
    <div
      onClick={handleToggle}
      style={{
        width: '60px',
        height: '30px',
        backgroundColor: '#ddd',
        borderRadius: '15px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        border: '1px solid #aaa',
      }}
    >
      <div
        style={{
          width: '26px',
          height: '26px',
          backgroundColor: '#1e3a8a',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: isLeaver ? '2px' : '32px',
          transition: 'left 0.3s',
        }}
      ></div>
    </div>
  );
};

export default DashboardToggle;
