import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;