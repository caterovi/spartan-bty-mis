import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizes = {
    small: { width: '20px', height: '20px', fontSize: '12px' },
    medium: { width: '32px', height: '32px', fontSize: '14px' },
    large: { width: '48px', height: '48px', fontSize: '16px' }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      gap: '16px'
    }}>
      <div
        style={{
          width: currentSize.width,
          height: currentSize.height,
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #c4607a',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <p style={{
        fontSize: currentSize.fontSize,
        color: '#666',
        margin: 0,
        fontWeight: '500'
      }}>
        {text}
      </p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
