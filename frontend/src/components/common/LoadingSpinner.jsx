import React from 'react';

const LoadingSpinner = ({ text = 'Загрузка...' }) => {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
};

export default LoadingSpinner;
