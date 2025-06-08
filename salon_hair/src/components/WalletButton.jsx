import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

function WalletButton() {
  const { 
    account, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    balance, 
    loading,
    contracts 
  } = useWeb3();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0.0000';
    return parseFloat(balance).toFixed(4);
  };

  if (!isConnected) {
    return (
      <button 
        className="wallet-button connect-button"
        onClick={connectWallet}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="wallet-spinner"></div>
            <span>Đang kết nối...</span>
          </>
        ) : (
          <>
            <span className="wallet-icon">🦊</span>
            <span>Kết nối ví</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="wallet-connected">
      <div className="wallet-info">
        <div className="wallet-address">
          <span className="address-icon">👤</span>
          <span>{formatAddress(account)}</span>
        </div>
        
      </div>
      
      <div className="wallet-status">
        <div className="wallet-balance">
          <span className="balance-icon">💰</span>
          <span>{formatBalance(balance)} ETH</span>
        </div>
      </div>
      
      <button 
        className="wallet-button disconnect-button"
        onClick={disconnectWallet}
        title="Ngắt kết nối ví"
      >
        <span>🔌</span>
      </button>
    </div>
  );
}

export default WalletButton;