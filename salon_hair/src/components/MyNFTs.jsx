import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

function MyNFTs() {
  const { contracts, account, isConnected, connectWallet } = useWeb3();
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState({});
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebug = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(`🔍 [MyNFTs] ${logMessage}`);
    setDebugInfo(prev => [...prev.slice(-10), logMessage]);
  }, []);

  // ✅ ENHANCED: Load NFTs with real-time sale status check
  const loadMyNFTs = useCallback(async (forceRefresh = false) => {
    if (!contracts.hairStyleNFT || !account) {
      addDebug('⚠️ Contract or account not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      addDebug(`🔍 Loading NFTs for account: ${account}`);

      let ownedTokens = [];
      try {
        addDebug('📞 Calling getOwnedTokens (current ownership)...');
        ownedTokens = await contracts.hairStyleNFT.getOwnedTokens(account);
        addDebug(`✅ getOwnedTokens returned ${ownedTokens.length} tokens`);
      } catch (ownedError) {
        addDebug(`❌ getOwnedTokens failed: ${ownedError.message}`);
        
        try {
          addDebug('🔄 Fallback: Manually checking ownership...');
          const totalSupply = await contracts.hairStyleNFT.getTotalTokens();
          addDebug(`📊 Total supply: ${totalSupply}`);

          if (totalSupply.toNumber() > 0) {
            const ownedTokenIds = [];
            
            for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
              try {
                const owner = await contracts.hairStyleNFT.ownerOf(tokenId);
                if (owner.toLowerCase() === account.toLowerCase()) {
                  ownedTokenIds.push(ethers.BigNumber.from(tokenId));
                  addDebug(`✅ Found owned token: ${tokenId}`);
                }
              } catch (ownerError) {
                addDebug(`⚠️ Token ${tokenId} may not exist: ${ownerError.message}`);
              }
            }
            
            ownedTokens = ownedTokenIds;
            addDebug(`✅ Fallback method found ${ownedTokens.length} owned tokens`);
          }
        } catch (fallbackError) {
          addDebug(`❌ Fallback method failed: ${fallbackError.message}`);
          throw fallbackError;
        }
      }

      if (ownedTokens.length === 0) {
        addDebug('📝 No NFTs owned by this account');
        setMyNFTs([]);
        return;
      }

      addDebug(`🔍 Processing ${ownedTokens.length} owned tokens...`);

      // ✅ ENHANCED: Load token data with real-time verification
      const nftData = await Promise.all(
        ownedTokens.map(async (tokenId, index) => {
          try {
            const tokenIdNumber = tokenId.toNumber ? tokenId.toNumber() : parseInt(tokenId);
            addDebug(`🔍 Processing token #${tokenIdNumber} (${index + 1}/${ownedTokens.length})`);
            
            // Double-check current ownership
            const owner = await contracts.hairStyleNFT.ownerOf(tokenIdNumber);
            if (owner.toLowerCase() !== account.toLowerCase()) {
              addDebug(`⏭️ Skipping token ${tokenIdNumber} - owned by different account now`);
              return null;
            }

            // ✅ Get REAL-TIME hair style data (not cached)
            const hairStyleData = await contracts.hairStyleNFT.hairStyles(tokenIdNumber);
            addDebug(`📊 Token ${tokenIdNumber} - isForSale: ${hairStyleData.isForSale}`);

            // ✅ DOUBLE CHECK: Verify with marketplace listing status
            let marketplaceActive = false;
            try {
              const listing = await contracts.marketplace.getListing(tokenIdNumber);
              marketplaceActive = listing.active;
              addDebug(`🏪 Token ${tokenIdNumber} - marketplace active: ${marketplaceActive}`);
            } catch (marketplaceError) {
              addDebug(`⚠️ Could not check marketplace for token ${tokenIdNumber}: ${marketplaceError.message}`);
            }

            // ✅ FINAL SALE STATUS: Both NFT contract AND marketplace must agree
            const actuallyForSale = hairStyleData.isForSale && marketplaceActive;
            addDebug(`🎯 Token ${tokenIdNumber} - final sale status: ${actuallyForSale}`);

            let metadata = {
              name: `Hair Style #${tokenIdNumber}`, 
              description: 'AI Generated Hair Style',
              image: `https://via.placeholder.com/400x400/667eea/ffffff?text=NFT+${tokenIdNumber}`,
              attributes: []
            };

            try {
              const tokenURI = await contracts.hairStyleNFT.tokenURI(tokenIdNumber);
              if (tokenURI && tokenURI.startsWith('ipfs://')) {
                const ipfsHash = tokenURI.replace('ipfs://', '');
                const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, { 
                  timeout: 5000 
                });
                if (response.ok) {
                  const fetchedMetadata = await response.json();
                  metadata = { ...metadata, ...fetchedMetadata };
                }
              }
            } catch (metadataError) {
              addDebug(`⚠️ Metadata loading failed for token ${tokenIdNumber}: ${metadataError.message}`);
            }

            const nftItem = {
              tokenId: tokenIdNumber,
              owner,
              metadata,
              hairStyleData: {
                likes: hairStyleData.likes?.toNumber?.() || 0,
                hairType: hairStyleData.hairType || 'Unknown',
                colorType: hairStyleData.colorType || 'Unknown',
                isForSale: actuallyForSale, // ✅ Use verified sale status
                price: (actuallyForSale && hairStyleData.price) ? 
                       ethers.utils.formatEther(hairStyleData.price) : '0',
                creator: hairStyleData.creator || 'Unknown',
                timestamp: hairStyleData.timestamp?.toNumber ? 
                          new Date(hairStyleData.timestamp.toNumber() * 1000) : new Date()
              }
            };

            addDebug(`✅ Successfully processed NFT #${tokenIdNumber}`);
            return nftItem;
            
          } catch (error) {
            addDebug(`❌ Error processing token ${tokenId}: ${error.message}`);
            return null;
          }
        })
      );

      const validNFTs = nftData.filter(nft => nft !== null);
      addDebug(`✅ Successfully loaded ${validNFTs.length} valid NFTs`);
      setMyNFTs(validNFTs);
      
    } catch (error) {
      addDebug(`❌ Error loading NFTs: ${error.message}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [contracts, account, addDebug]);

  useEffect(() => {
    if (contracts.hairStyleNFT && account) {
      addDebug('🔄 Triggering NFT load due to dependency change');
      loadMyNFTs();
    } else if (isConnected && !contracts.hairStyleNFT) {
      setError('Smart contracts chưa được deploy hoặc ABI chưa được load');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [contracts.hairStyleNFT, account, loadMyNFTs, isConnected]);

  // ✅ Enhanced event listeners
  useEffect(() => {
    if (!contracts.hairStyleNFT || !account) return;

    const handleTransferEvents = async () => {
      try {
        const filterTo = contracts.hairStyleNFT.filters.Transfer(null, account);
        contracts.hairStyleNFT.on(filterTo, (from, to, tokenId) => {
          addDebug(`📥 NFT #${tokenId} transferred TO current account from ${from}`);
          setTimeout(() => loadMyNFTs(true), 2000);
        });

        const filterFrom = contracts.hairStyleNFT.filters.Transfer(account, null);
        contracts.hairStyleNFT.on(filterFrom, (from, to, tokenId) => {
          addDebug(`📤 NFT #${tokenId} transferred FROM current account to ${to}`);
          setTimeout(() => loadMyNFTs(true), 2000);
        });

      } catch (error) {
        addDebug(`⚠️ Error setting up transfer listeners: ${error.message}`);
      }
    };

    handleTransferEvents();

    return () => {
      if (contracts.hairStyleNFT.removeAllListeners) {
        contracts.hairStyleNFT.removeAllListeners();
      }
    };
  }, [contracts.hairStyleNFT, account, loadMyNFTs, addDebug]);

  // ✅ Listen for NFT purchases from other components
  useEffect(() => {
    const handleNFTPurchased = (event) => {
      addDebug(`🛒 NFT purchase detected: ${event.detail.tokenId}`);
      setTimeout(() => loadMyNFTs(true), 2000);
    };

    window.addEventListener('nftPurchased', handleNFTPurchased);
    return () => window.removeEventListener('nftPurchased', handleNFTPurchased);
  }, [loadMyNFTs, addDebug]);

  const setOperationState = useCallback((tokenId, state) => {
    setOperationLoading(prev => ({
      ...prev,
      [tokenId]: state
    }));
  }, []);

  const handleListForSale = async (tokenId) => {
    const price = prompt('Enter price in ETH:');
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setOperationState(tokenId, 'listing');

    try {
      const priceInWei = ethers.utils.parseEther(price);
      
      addDebug(`📋 Listing NFT ${tokenId} for ${price} ETH...`);
      
      // Step 1: Approve marketplace
      addDebug('⏳ Step 1: Approving marketplace...');
      const approveTx = await contracts.hairStyleNFT.approve(contracts.marketplace.address, tokenId);
      await approveTx.wait();
      
      // Step 2: List on marketplace  
      addDebug('⏳ Step 2: Listing on marketplace...');
      const listTx = await contracts.marketplace.listNFT(tokenId, priceInWei);
      await listTx.wait();
      
      // Step 3: Update NFT contract sale status
      addDebug('⏳ Step 3: Updating NFT sale status...');
      const updateTx = await contracts.hairStyleNFT.listForSale(tokenId, priceInWei);
      await updateTx.wait();
      
      addDebug('✅ NFT listed successfully');
      alert('🎉 NFT listed for sale successfully!');
      
      setTimeout(() => loadMyNFTs(true), 1000);
      
    } catch (error) {
      addDebug(`❌ Error listing NFT: ${error.message}`);
      alert('Error: ' + error.message);
    } finally {
      setOperationState(tokenId, null);
    }
  };

  const handleRemoveFromSale = async (tokenId) => {
    setOperationState(tokenId, 'delisting');

    try {
      addDebug(`📋 Removing NFT ${tokenId} from sale...`);
      
      // Step 1: Delist from marketplace
      addDebug('⏳ Step 1: Delisting from marketplace...');
      const delistTx = await contracts.marketplace.delistNFT(tokenId);
      await delistTx.wait();
      
      // Step 2: Update NFT contract sale status  
      addDebug('⏳ Step 2: Removing from NFT sale status...');
      const removeTx = await contracts.hairStyleNFT.removeFromSale(tokenId);
      await removeTx.wait();
      
      addDebug('✅ NFT delisted successfully');
      alert('✅ NFT removed from sale!');
      
      setTimeout(() => loadMyNFTs(true), 1000);
      
    } catch (error) {
      addDebug(`❌ Error removing from sale: ${error.message}`);
      alert('Error: ' + error.message);
    } finally {
      setOperationState(tokenId, null);
    }
  };

  // ✅ Add like functionality
  const handleLikeNFT = async (tokenId) => {
    try {
      addDebug(`❤️ Liking NFT ${tokenId}...`);
      
      const tx = await contracts.hairStyleNFT.likeHairStyle(tokenId);
      await tx.wait();
      
      addDebug(`✅ NFT ${tokenId} liked successfully`);
      
      setTimeout(() => loadMyNFTs(true), 1000);
      
    } catch (error) {
      addDebug(`❌ Error liking NFT: ${error.message}`);
      
      if (error.message.includes('Already liked')) {
        alert('❤️ Bạn đã like NFT này rồi!');
      } else {
        alert('Error liking NFT: ' + error.message);
      }
    }
  };

  const getImageSrc = (metadata, tokenId) => {
    if (metadata.image) {
      if (metadata.image.startsWith('ipfs://')) {
        const ipfsHash = metadata.image.replace('ipfs://', '');
        return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }
      if (metadata.image.startsWith('http')) {
        return metadata.image;
      }
    }
    return `https://via.placeholder.com/400x400/667eea/ffffff?text=Hair+Style+${tokenId}`;
  };

  const getOperationStatus = (tokenId) => {
    const operation = operationLoading[tokenId];
    switch (operation) {
      case 'listing': return { text: '🏷️ Đang đăng bán...', disabled: true };
      case 'delisting': return { text: '❌ Đang gỡ bán...', disabled: true };
      default: return { text: null, disabled: false };
    }
  };

  if (!isConnected) {
    return (
      <div className="connect-wallet-section">
        <h2>🔗 Kết nối ví của bạn</h2>
        <p>Vui lòng kết nối ví MetaMask để xem NFTs của bạn</p>
        <button onClick={connectWallet} className="connect-wallet-btn">
          🦊 Kết nối MetaMask
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="marketplace-error">
        <h2>⚠️ Lỗi tải NFTs</h2>
        <p>{error}</p>
        
        {debugInfo.length > 0 && (
          <div className="debug-section">
            <h4>🔍 Debug Information:</h4>
            <div className="debug-info">
              {debugInfo.map((info, index) => (
                <div key={index} className="debug-line">{info}</div>
              ))}
            </div>
          </div>
        )}
        
        <button onClick={() => loadMyNFTs(true)} className="retry-button">
          🔄 Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="my-nfts">
      <div className="my-nfts-header">
        {/* <h1>🎨 My Hair Style NFTs</h1>
        <p>Quản lý bộ sưu tập NFT kiểu tóc AI của bạn</p> */}
        
        <div className="header-controls">
          <div className="nft-count">
            {loading ? (
              <span>🔄 Đang tải...</span>
            ) : (
              <span>📊 {myNFTs.length} NFT(s) trong ví</span>
            )}
          </div>
          
          <button 
            onClick={() => loadMyNFTs(true)} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? '🔄 Đang tải...' : '🔄 Refresh'}
          </button>
        </div>

        <div className="status-indicators">
          <div className="status-item">
            <span className="status-dot active"></span>
            <span>Real-time ownership tracking</span>
          </div>
          <div className="status-item">
            <span className="status-dot success"></span>
            <span>Auto-refresh on transfers</span>
          </div>
        </div>
      </div>

      {/* <div className="debug-panel">
        <details>
          <summary>🔍 Debug Information (Click to expand)</summary>
          <div className="debug-content">
            <h4>🔗 Connection Status:</h4>
            <p>Account: {account}</p>
            <p>Contract: {contracts.hairStyleNFT?.address || 'Not loaded'}</p>
            <p>Method: getOwnedTokens() + Real-time verification</p>
            
            <h4>🎨 Loading History:</h4>
            <div className="debug-info">
              {debugInfo.map((info, index) => (
                <div key={index} className="debug-line">{info}</div>
              ))}
            </div>
          </div>
        </details>
      </div> */}

      {loading && myNFTs.length === 0 ? (
        <div className="marketplace-loading">
          <div className="spinner"></div>
          <p>Đang tải NFTs của bạn...</p>
        </div>
      ) : myNFTs.length === 0 ? (
        <div className="no-nfts">
          <h3>🎨 Bạn chưa có NFT nào</h3>
          <p>Tạo NFT đầu tiên bằng cách sử dụng công cụ AI tạo kiểu tóc hoặc mua NFT trên marketplace!</p>
          <div className="no-nfts-actions">
            <button 
              onClick={() => window.location.href = '/#home'} 
              className="action-button"
            >
              🎨 Tạo NFT đầu tiên
            </button>
            <button 
              onClick={() => window.location.href = '/#marketplace'} 
              className="action-button secondary"
            >
              🏪 Xem Marketplace
            </button>
          </div>
        </div>
      ) : (
        <div className="nft-grid">
          {myNFTs.map((nft) => {
            const operationStatus = getOperationStatus(nft.tokenId);
            
            return (
              <div key={nft.tokenId} className="nft-card my-nft-card">
                <div className="nft-image">
                  <img 
                    src={getImageSrc(nft.metadata, nft.tokenId)}
                    alt={nft.metadata.name}
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/400x400/667eea/ffffff?text=NFT+${nft.tokenId}`;
                    }}
                  />
                  {nft.hairStyleData.isForSale && (
                    <div className="sale-badge">
                      💰 {nft.hairStyleData.price} ETH
                    </div>
                  )}
                  {operationStatus.text && (
                    <div className="operation-overlay">
                      {operationStatus.text}
                    </div>
                  )}
                </div>
                
                <div className="nft-info">
                  <h3>{nft.metadata.name || `Hair Style #${nft.tokenId}`}</h3>
                  {/* <p className="nft-description">{nft.metadata.description}</p> */}
                  
                  <div className="nft-details">
                    <div className="detail-item">
                      <span>Token ID:</span>
                      <span>#{nft.tokenId}</span>
                    </div>
                    <div className="detail-item">
                      <span>Hair Type:</span>
                      <span>{nft.hairStyleData.hairType}</span>
                    </div>
                    <div className="detail-item">
                      <span>Color:</span>
                      <span>{nft.hairStyleData.colorType}</span>
                    </div>
                    <div className="detail-item">
                      <span>Current Owner:</span>
                      <span className="owner-you">You</span>
                    </div>
                    <div className="detail-item">
                      <span>Creator:</span>
                      <span>{nft.hairStyleData.creator === account ? 'You' : nft.hairStyleData.creator?.slice(0,6) + '...' + nft.hairStyleData.creator?.slice(-4)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Likes:</span>
                      <span>❤️ {nft.hairStyleData.likes}</span>
                    </div>
                    {nft.hairStyleData.isForSale && (
                      <div className="detail-item">
                        <span>Listed Price:</span>
                        <span className="price-highlight">{nft.hairStyleData.price} ETH</span>
                      </div>
                    )}
                  </div>

                  <div className="nft-actions">
                    {operationStatus.text ? (
                      <button className="action-button operation-button" disabled>
                        {operationStatus.text}
                      </button>
                    ) : (
                      <>
                        {/* ✅ FIXED: Proper button logic based on verified sale status */}
                        {nft.hairStyleData.isForSale ? (
                          <button 
                            className="remove-sale-button action-button danger"
                            onClick={() => handleRemoveFromSale(nft.tokenId)}
                          >
                            ❌ Remove from Sale
                          </button>
                        ) : (
                          <button 
                            className="list-sale-button action-button primary"
                            onClick={() => handleListForSale(nft.tokenId)}
                          >
                            🏷️ List for Sale
                          </button>
                        )}
                        
                        <button 
                          className="action-button like-button secondary"
                          onClick={() => handleLikeNFT(nft.tokenId)}
                          title="Like this NFT"
                        >
                          ❤️ Like ({nft.hairStyleData.likes})
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyNFTs;