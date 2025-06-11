import React from 'react';
import WalletButton from './WalletButton';

function Navbar({ activeSection, setActiveSection }) {
  const navItems = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'my-nfts', label: 'My NFTs' },
    { id: 'trending', label: 'Xu hướng' },
    { id: 'about', label: 'Giới thiệu' }
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo/Brand (optional) */}
        <div className="nav-brand">
          <span className="brand-icon">✨</span>
          <span className="brand-text">HairStyleAI</span>
        </div>
        
        {/* Navigation Links */}
        <div className="nav-links">
          {navItems.map((item) => (
            <button 
              key={item.id}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        {/* Wallet Button */}
        <div className="nav-wallet">
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;