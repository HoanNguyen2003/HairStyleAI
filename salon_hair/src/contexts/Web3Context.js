import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [contracts, setContracts] = useState({
    hairStyleNFT: null,
    marketplace: null
  });
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask không được cài đặt! Vui lòng cài đặt MetaMask extension.');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Đang kết nối ví...');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('Không có tài khoản nào được chọn');
      }

      const selectedAccount = accounts[0];
      console.log('✅ Đã kết nối với tài khoản:', selectedAccount);

      // Create provider
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      // Get balance
      const accountBalance = await web3Provider.getBalance(selectedAccount);
      const balanceInEth = ethers.utils.formatEther(accountBalance);

      // Load contracts
      await loadContracts(web3Provider);

      // Update state
      setAccount(selectedAccount);
      setBalance(balanceInEth);
      setIsConnected(true);

      // Save connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('connectedAccount', selectedAccount);

      console.log('🎉 Wallet connected successfully!');

    } catch (error) {
      console.error('❌ Lỗi kết nối ví:', error);
      
      // Clear any partial state
      handleDisconnect();
      
      if (error.code === 4001) {
        alert('❌ Bạn đã từ chối kết nối ví');
      } else if (error.code === -32002) {
        alert('⏳ Vui lòng kiểm tra MetaMask - có thể đã có yêu cầu kết nối đang chờ');
      } else {
        alert(`❌ Lỗi kết nối: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      
      // Method 1: Request permission reset (if supported)
      if (window.ethereum?.request) {
        try {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          });
        } catch (permError) {
          console.log('Permission reset not supported or denied:', permError.message);
        }
      }
      
      // Method 2: Clear all application state
      handleDisconnect();
      
      // Method 3: Force MetaMask to forget connection (if supported)
      if (window.ethereum?.removeAllListeners) {
        window.ethereum.removeAllListeners();
      }
      
      console.log('✅ Wallet disconnected successfully');
      
      // Show instruction to user
      alert(`🔌 Ví đã được ngắt kết nối!

📝 Để hoàn toàn ngắt kết nối:
1. Mở MetaMask extension
2. Vào Settings > Connected Sites  
3. Disconnect khỏi trang này

🔄 Hoặc đóng/mở lại trình duyệt`);
      
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
      // Still clear local state even if MetaMask disconnect fails
      handleDisconnect();
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    // Clear all state
    setAccount(null);
    setIsConnected(false);
    setBalance('0');
    setContracts({ hairStyleNFT: null, marketplace: null });
    setProvider(null);
    
    // Clear localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('connectedAccount');
    
    console.log('🧹 Local state cleared');
  }, []);

  const loadContracts = async (web3Provider) => {
    try {
      console.log('📋 Loading smart contracts...');
      
      // Strategy 1: Load from hardcoded addresses (fallback)
      const HARDCODED_ADDRESSES = {
        hairStyleNFT: "0x828977C95f9f6F52F6E023872E6Ac2e3E8A0f1a7",
        marketplace: "0xb5340C6e5443C616bd4773e0FbF625D0A4192a28"
      };

      // Strategy 2: Try to load from multiple sources
      let contractAddresses = null;
      
      // Try loading from public folder
      try {
        console.log('📂 Trying to load from /contractAddresses.json...');
        const response = await fetch('/contractAddresses.json');
        if (response.ok) {
          contractAddresses = await response.json();
          console.log('✅ Loaded addresses from public folder:', contractAddresses);
        }
      } catch (error) {
        console.warn('⚠️ Could not load from public folder:', error.message);
      }

      // Try loading from src/contracts folder if public failed
      if (!contractAddresses) {
        try {
          console.log('📂 Trying to load from src/contracts/addresses.json...');
          const addressesModule = await import('../contracts/addresses.json');
          contractAddresses = addressesModule.default || addressesModule;
          console.log('✅ Loaded addresses from src folder:', contractAddresses);
        } catch (error) {
          console.warn('⚠️ Could not load from src folder:', error.message);
        }
      }

      // Fallback to hardcoded addresses
      if (!contractAddresses) {
        console.log('📋 Using hardcoded contract addresses...');
        contractAddresses = HARDCODED_ADDRESSES;
      }

      // Normalize contract addresses to handle different naming conventions
      const normalizedAddresses = {
        hairStyleNFT: contractAddresses.hairStyleNFT || 
                    contractAddresses.HairStyleNFT || 
                    contractAddresses['hair-style-nft'] ||
                    contractAddresses.nft,
        marketplace: contractAddresses.marketplace || 
                    contractAddresses.Marketplace ||
                    contractAddresses['marketplace'] ||
                    contractAddresses.market
      };

      console.log('🔄 Normalized addresses:', normalizedAddresses);

      // Validate addresses
      if (!normalizedAddresses.hairStyleNFT || !normalizedAddresses.marketplace) {
        console.error('❌ Missing required contract addresses:', {
          hairStyleNFT: !!normalizedAddresses.hairStyleNFT,
          marketplace: !!normalizedAddresses.marketplace,
          original: contractAddresses
        });
        
        // Try to extract from original object if standard names failed
        const keys = Object.keys(contractAddresses || {});
        console.log('🔍 Available keys in contract addresses:', keys);
        
        if (keys.length >= 2) {
          // Try to auto-detect contract addresses
          const possibleNFT = keys.find(key => 
            key.toLowerCase().includes('hair') || 
            key.toLowerCase().includes('nft') ||
            key.toLowerCase().includes('style')
          );
          const possibleMarketplace = keys.find(key => 
            key.toLowerCase().includes('market') ||
            key.toLowerCase().includes('place')
          );
          
          if (possibleNFT && possibleMarketplace) {
            normalizedAddresses.hairStyleNFT = contractAddresses[possibleNFT];
            normalizedAddresses.marketplace = contractAddresses[possibleMarketplace];
            console.log('🎯 Auto-detected contracts:', {
              hairStyleNFT: `${possibleNFT} -> ${normalizedAddresses.hairStyleNFT}`,
              marketplace: `${possibleMarketplace} -> ${normalizedAddresses.marketplace}`
            });
          }
        }
        
        // Final validation
        if (!normalizedAddresses.hairStyleNFT || !normalizedAddresses.marketplace) {
          console.warn('⚠️ Still missing addresses after normalization, using hardcoded fallback');
          normalizedAddresses.hairStyleNFT = HARDCODED_ADDRESSES.hairStyleNFT;
          normalizedAddresses.marketplace = HARDCODED_ADDRESSES.marketplace;
        }
      }

      // Validate address format
      const isValidAddress = (addr) => {
        return addr && 
              typeof addr === 'string' && 
              addr.startsWith('0x') && 
              addr.length === 42;
      };

      if (!isValidAddress(normalizedAddresses.hairStyleNFT) || 
          !isValidAddress(normalizedAddresses.marketplace)) {
        throw new Error(`Invalid contract address format: 
          HairStyleNFT: ${normalizedAddresses.hairStyleNFT}
          Marketplace: ${normalizedAddresses.marketplace}`);
      }

      console.log('✅ Final contract addresses:', normalizedAddresses);

      // Import contract ABIs
      let hairStyleNFTABI, marketplaceABI;
      
      try {
        const hairStyleNFTModule = await import('../contracts/HairStyleNFT.json');
        hairStyleNFTABI = hairStyleNFTModule.default?.abi || hairStyleNFTModule.abi;
        if (!hairStyleNFTABI) {
          throw new Error('HairStyleNFT ABI is empty or invalid');
        }
      } catch (error) {
        console.error('❌ Could not load HairStyleNFT ABI:', error);
        return;
      }

      try {
        const marketplaceModule = await import('../contracts/Marketplace.json');
        marketplaceABI = marketplaceModule.default?.abi || marketplaceModule.abi;
        if (!marketplaceABI) {
          throw new Error('Marketplace ABI is empty or invalid');
        }
      } catch (error) {
        console.error('❌ Could not load Marketplace ABI:', error);
        return;
      }

      console.log('✅ Contract ABIs loaded successfully');

      const signer = web3Provider.getSigner();
      
      // Create contract instances
      const hairStyleNFTContract = new ethers.Contract(
        normalizedAddresses.hairStyleNFT,
        hairStyleNFTABI,
        signer
      );
      
      const marketplaceContract = new ethers.Contract(
        normalizedAddresses.marketplace,
        marketplaceABI,
        signer
      );

      // Test contract connection with detailed error reporting
      try {
        console.log('🧪 Testing contract connections...');
        
        // Test NFT contract
        console.log('🔍 Testing HairStyleNFT contract...');
        const nftName = await hairStyleNFTContract.name();
        console.log('✅ HairStyleNFT name:', nftName);
        
        // Test Marketplace contract
        console.log('🔍 Testing Marketplace contract...');
        const marketplaceOwner = await marketplaceContract.owner();
        console.log('✅ Marketplace owner:', marketplaceOwner);
        
        console.log('🎉 All contract connection tests passed!');
        
      } catch (error) {
        console.error('❌ Contract connection test failed:', error);
        
        // Provide detailed error information
        if (error.message.includes('could not detect network')) {
          throw new Error('Network detection failed - make sure you\'re connected to the correct network (Ganache)');
        } else if (error.message.includes('call revert exception')) {
          throw new Error('Contract call failed - contracts may not be deployed or network mismatch');
        } else if (error.message.includes('invalid address')) {
          throw new Error('Invalid contract address - please check deployment');
        } else {
          throw new Error(`Contract test failed: ${error.message}`);
        }
      }

      // Set contracts in state
      setContracts({
        hairStyleNFT: hairStyleNFTContract,
        marketplace: marketplaceContract
      });

      console.log('✅ Smart contracts loaded and tested successfully!');
      console.log('📍 HairStyleNFT:', normalizedAddresses.hairStyleNFT);
      console.log('📍 Marketplace:', normalizedAddresses.marketplace);
      
    } catch (error) {
      console.error('❌ Error loading contracts:', error);
      setContracts({ hairStyleNFT: null, marketplace: null });
      
      // Show user-friendly error
      if (error.message.includes('Network detection failed')) {
        console.warn('🌐 Network issue detected - please check MetaMask network');
      } else if (error.message.includes('Contract call failed')) {
        console.warn('📋 Contract deployment issue - please redeploy contracts');
      }
    }
  };

  const updateBalance = useCallback(async () => {
    if (account && provider) {
      try {
        const balance = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  }, [account, provider]);

  // Auto-connect on page load (with proper checks)
  useEffect(() => {
    const initializeWallet = async () => {
      if (typeof window.ethereum === 'undefined') {
        return;
      }

      try {
        // Check if previously connected
        const wasConnected = localStorage.getItem('walletConnected');
        const savedAccount = localStorage.getItem('connectedAccount');
        
        if (wasConnected && savedAccount) {
          console.log('🔄 Attempting auto-reconnect...');
          
          // Check if MetaMask still has permission
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts.length > 0 && accounts.includes(savedAccount)) {
            // Auto-reconnect silently
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            
            const accountBalance = await web3Provider.getBalance(savedAccount);
            const balanceInEth = ethers.utils.formatEther(accountBalance);
            
            await loadContracts(web3Provider);
            
            setAccount(savedAccount);
            setBalance(balanceInEth);
            setIsConnected(true);
            
            console.log('✅ Auto-reconnected successfully');
          } else {
            // Clear stale data
            console.log('🧹 Clearing stale connection data');
            handleDisconnect();
          }
        }
      } catch (error) {
        console.error('❌ Auto-connect failed:', error);
        handleDisconnect();
      }
    };

    initializeWallet();
  }, [handleDisconnect]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts) => {
      console.log('👤 Account changed:', accounts);
      
      if (accounts.length === 0) {
        // User disconnected
        handleDisconnect();
      } else if (accounts[0] !== account) {
        // User switched accounts
        console.log('🔄 Switching to new account...');
        handleDisconnect();
        // Auto-connect to new account
        setTimeout(() => {
          connectWallet();
        }, 100);
      }
    };

    const handleChainChanged = (chainId) => {
      console.log('🔗 Chain changed:', chainId);
      // Reload the page when chain changes
      window.location.reload();
    };

    const handleDisconnectEvent = () => {
      console.log('🔌 MetaMask disconnected');
      handleDisconnect();
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnectEvent);

    // Cleanup
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnectEvent);
      }
    };
  }, [account, connectWallet, handleDisconnect]);

  return (
    <Web3Context.Provider value={{
      account,
      balance,
      isConnected,
      contracts,
      loading,
      provider,
      connectWallet,
      disconnectWallet,
      updateBalance
    }}>
      {children}
    </Web3Context.Provider>
  );
};