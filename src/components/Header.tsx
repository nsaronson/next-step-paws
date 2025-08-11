import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="poodle-icon">🐕</span>
          <h1>Next Step Paws</h1>
          <span className="poodle-icon">🐕</span>
        </div>
        <p className="tagline">Professional dog training with personalized care</p>
      </div>
    </header>
  );
};

export default Header;
