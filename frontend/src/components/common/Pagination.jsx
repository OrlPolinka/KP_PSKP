import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Количество отображаемых страниц

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Всегда показываем первую страницу
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Показываем страницы вокруг текущей
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Всегда показываем последнюю страницу
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="pagination" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '24px',
      padding: '16px'
    }}>
      <button
        className="pagination-btn"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: currentPage === 1 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(255, 255, 255, 0.1)',
          color: currentPage === 1 ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        ←
      </button>

      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} style={{
            color: 'rgba(255, 255, 255, 0.5)',
            padding: '0 8px'
          }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            className="pagination-btn"
            onClick={() => handlePageChange(page)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: currentPage === page 
                ? '1px solid #A78BFA' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              background: currentPage === page 
                ? 'rgba(167, 139, 250, 0.2)' 
                : 'rgba(255, 255, 255, 0.1)',
              color: currentPage === page ? '#A78BFA' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: currentPage === page ? '600' : '400'
            }}
          >
            {page}
          </button>
        )
      ))}

      <button
        className="pagination-btn"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: currentPage === totalPages 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(255, 255, 255, 0.1)',
          color: currentPage === totalPages ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        →
      </button>
    </div>
  );
};

export default Pagination;
