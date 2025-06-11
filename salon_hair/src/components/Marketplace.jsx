import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useNFT } from '../contexts/NFTContext';
import { ethers } from 'ethers';
import '../styles/Marketplace.scss';

function Marketplace() {
  const { contracts, account, isConnected, connectWallet, updateBalance } = useWeb3();
  const { 
    marketNFTs, 
    loading, 
    loadMarketplaceNFTs, 
    updateNFTOwnership,
    forceRefresh 
  } = useNFT();
  
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState({});

  // Load marketplace data on mount
  useEffect(() => {
    if (contracts.marketplace && contracts.hairStyleNFT) {
      console.log('🏪 Loading marketplace data...');
      loadMarketplaceNFTs();
    } else if (isConnected && (!contracts.marketplace || !contracts.hairStyleNFT)) {
      setError('Smart contracts chưa được deploy hoặc load');
    }
  }, [contracts.marketplace, contracts.hairStyleNFT, loadMarketplaceNFTs, isConnected]);

  // Listen for real-time blockchain events
  useEffect(() => {
    const handleMarketplaceEvents = (event) => {
      console.log('🔔 Marketplace event detected:', event.type, event.detail);
      
      // Refresh marketplace data after events
      setTimeout(() => {
        loadMarketplaceNFTs(true);
      }, 2000); // Wait for blockchain state to update
    };

    // Listen for marketplace events
    window.addEventListener('nftListed', handleMarketplaceEvents);
    window.addEventListener('nftDelisted', handleMarketplaceEvents);
    window.addEventListener('nftSold', handleMarketplaceEvents);

    return () => {
      window.removeEventListener('nftListed', handleMarketplaceEvents);
      window.removeEventListener('nftDelisted', handleMarketplaceEvents);
      window.removeEventListener('nftSold', handleMarketplaceEvents);
    };
  }, [loadMarketplaceNFTs]);

  // Replace handlePurchaseNFT function (starting around line 45):

  const handlePurchaseNFT = async (nft) => {
    if (!nft.marketplace?.price) {
      alert('❌ Giá NFT không hợp lệ');
      return;
    }

    const tokenId = nft.tokenId;
    setPurchasing(prev => ({ ...prev, [tokenId]: true }));

    try {
      console.log(`💰 Starting purchase of NFT ${tokenId}...`);
      
      // ✅ Pre-flight checks with proper error handling
      console.log('🔍 Running pre-flight checks...');
      
      // 1. Verify contracts exist
      if (!contracts.marketplace || !contracts.hairStyleNFT) {
        throw new Error('Smart contracts not available. Please check deployment.');
      }
      
      // 2. Check if listing is still active using correct function
      let listing;
      try {
        // ✅ Use the correct function name that exists in contract
        listing = await contracts.marketplace.getListingDetails(tokenId);
        console.log('📋 Listing details:', listing);
      } catch (listingError) {
        console.error('❌ Error getting listing:', listingError);
        throw new Error('Cannot fetch NFT listing details. Contract may not be deployed correctly.');
      }
      
      if (!listing.active) {
        throw new Error('NFT is no longer listed for sale');
      }
      
      // 3. Verify current ownership
      let currentOwner;
      try {
        currentOwner = await contracts.hairStyleNFT.ownerOf(tokenId);
        console.log('👤 Current owner:', currentOwner);
      } catch (ownerError) {
        console.error('❌ Error getting owner:', ownerError);
        throw new Error('Cannot verify NFT ownership. Token may not exist.');
      }
      
      if (currentOwner.toLowerCase() === account.toLowerCase()) {
        throw new Error('You cannot buy your own NFT');
      }
      
      // 4. Check if NFT is approved for marketplace
      let approved;
      try {
        approved = await contracts.hairStyleNFT.getApproved(tokenId);
        console.log('✅ Approved address:', approved);
        console.log('🏪 Marketplace address:', contracts.marketplace.address);
      } catch (approvalError) {
        console.error('❌ Error checking approval:', approvalError);
        throw new Error('Cannot verify NFT approval status.');
      }
      
      if (approved.toLowerCase() !== contracts.marketplace.address.toLowerCase()) {
        throw new Error('NFT is not approved for marketplace. Please contact the seller.');
      }
      
      // 5. Check buyer balance
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(account);
      const priceWei = ethers.utils.parseEther(nft.marketplace.price);
      const gasEstimate = ethers.utils.parseEther('0.01'); // Conservative gas estimate
      
      if (balance.lt(priceWei.add(gasEstimate))) {
        throw new Error(`Insufficient ETH. Need: ${ethers.utils.formatEther(priceWei.add(gasEstimate))} ETH`);
      }
      
      console.log('✅ All pre-flight checks passed');
      
      // ✅ Execute purchase with explicit gas settings
      console.log(`💰 Purchasing NFT ${tokenId} for ${nft.marketplace.price} ETH...`);
      
      const tx = await contracts.marketplace.buyNFT(tokenId, {
        value: priceWei,
        gasLimit: 300000,  // Explicit gas limit
        gasPrice: ethers.utils.parseUnits('20', 'gwei') // Explicit gas price for local network
      });
      
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      console.log(`✅ Purchase successful! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Update balance
      await updateBalance();
      
      // Update ownership
      updateNFTOwnership(tokenId, account);
      
      alert(`🎉 Mua NFT thành công!\n\n🆔 Token ID: ${tokenId}\n💰 Giá: ${nft.marketplace.price} ETH\n📋 Transaction: ${receipt.transactionHash}\n\n✨ NFT đã được chuyển vào ví của bạn!`);
      
      // Refresh marketplace and user's NFTs
      setTimeout(() => {
        loadMarketplaceNFTs(true);
        // Trigger My NFTs refresh
        window.dispatchEvent(new CustomEvent('nftPurchased', { detail: { tokenId } }));
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error purchasing NFT:', error);
      
      let errorMessage = 'Lỗi khi mua NFT:\n\n';
      
      if (error.message.includes('user rejected')) {
        errorMessage += '❌ Bạn đã từ chối giao dịch trong MetaMask';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += '💰 Không đủ ETH để mua NFT và trả gas fee\n\nVui lòng nạp thêm ETH vào ví';
      } else if (error.message.includes('Internal JSON-RPC error')) {
        errorMessage += '🔧 Lỗi smart contract:\n\n';
        errorMessage += '• Contract function không tồn tại\n';
        errorMessage += '• Contracts chưa được deploy đúng\n';
        errorMessage += '• ABI không khớp với deployed contract\n\n';
        errorMessage += '💡 Giải pháp: Redeploy contracts (npm run deploy)';
      } else if (error.message.includes('execution reverted')) {
        errorMessage += '⚠️ Smart contract từ chối giao dịch:\n\n';
        errorMessage += (error.reason || error.message);
      } else if (error.message.includes('network')) {
        errorMessage += '🌐 Lỗi kết nối mạng blockchain\n\nKiểm tra Ganache đang chạy';
      } else if (error.message.includes('Contract may not be deployed')) {
        errorMessage += '🏗️ Smart contracts chưa được deploy đúng cách\n\n';
        errorMessage += 'Chạy: npm run deploy trong thư mục blockchain';
      } else {
        errorMessage += `🔧 ${error.message}`;
      }
      
      alert(errorMessage);
      
    } finally {
      setPurchasing(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  const getImageSrc = (metadata, tokenId) => {
    console.log(metadata);
    const imageHash = metadata?.image || '';
    console.log(imageHash);
    if (imageHash) {
      if (metadata.image.startsWith('ipfs://')) {
        const ipfsHash = metadata.image.replace('ipfs://', '');
        return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }
      if (metadata.image.startsWith('http')) {
        return metadata.image;
      }
      return `https://gateway.pinata.cloud/ipfs/${imageHash}`;
    }
    return `https://via.placeholder.com/400x400/667eea/ffffff?text=Hair+Style+${tokenId}`;
  };

  const isOwner = (nft) => {
    return nft.owner?.toLowerCase() === account?.toLowerCase();
  };

  const getPurchaseButtonText = (nft) => {
    const tokenId = nft.tokenId;
    
    if (purchasing[tokenId]) {
      return '🔄 Đang mua...';
    }
    
    if (isOwner(nft)) {
      return '👤 Bạn sở hữu';
    }
    
    return `💰 Mua ${nft.marketplace?.price || '0'} ETH`;
  };

  if (!isConnected) {
    return (
      <div className="marketplace-not-connected">
        <div className="not-connected-content">
          <h2>🏪 Hair Style NFT Marketplace</h2>
          <div className="marketplace-preview">
            <p>🎨 Khám phá và sưu tập các NFT kiểu tóc AI độc đáo</p>
            <p>💎 Mua bán NFT với cộng đồng</p>
            <p>🔒 An toàn với blockchain technology</p>
          </div>
          <div className="connect-instruction">
            <p>👆 Vui lòng kết nối ví MetaMask trên navbar để truy cập marketplace</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="marketplace-error">
        <h2>⚠️ Lỗi tải Marketplace</h2>
        <p>{error}</p>
        <div className="error-details">
          <h3>🛠️ Hướng dẫn khắc phục:</h3>
          <ul>
            <li>Kiểm tra contracts đã được deploy</li>
            <li>Kiểm tra kết nối mạng blockchain</li>
            <li>Thử refresh lại dữ liệu</li>
          </ul>
        </div>
        <button onClick={forceRefresh} className="retry-button">
          🔄 Refresh Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        {/* <h1>🏪 Hair Style NFT Marketplace</h1> */}
        {/* <p>Khám phá và sưu tập những NFT kiểu tóc AI độc đáo</p> */}
        
        <div className="marketplace-stats">
          <div className="stat-item">
            <span className="stat-number">
              {loading.marketplace ? '...' : marketNFTs.length}
            </span>
            <span className="stat-label">NFTs Listed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {loading.marketplace ? '...' : marketNFTs.filter(nft => !isOwner(nft)).length}
            </span>
            <span className="stat-label">Available</span>
          </div>
        </div>

        <div className="marketplace-controls">
          <button 
            onClick={() => loadMarketplaceNFTs(true)} 
            className="refresh-button"
            disabled={loading.marketplace}
          >
            {loading.marketplace ? '🔄 Đang tải...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Real-time status */}
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-dot active"></span>
            <span>Real-time marketplace updates</span>
          </div>
        </div>
      </div>

      {loading.marketplace && marketNFTs.length === 0 ? (
        <div className="marketplace-loading">
          <div className="spinner"></div>
          <p>Đang tải NFTs từ marketplace...</p>
        </div>
      ) : marketNFTs.length === 0 ? (
        <div className="no-nfts">
          <h3>🏪 Marketplace đang trống</h3>
          <p>Chưa có NFT nào được đăng bán</p>
          <div className="marketplace-tips">
            <p>💡 Mẹo:</p>
            <ul>
              <li>Tạo NFT kiểu tóc của riêng bạn</li>
              <li>Đăng bán NFT trong "My NFTs"</li>
              <li>Khám phá các NFT từ người dùng khác</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="nft-grid">
          {marketNFTs.map((nft) => (
            <div key={nft.tokenId} className="nft-card marketplace-card">
              <div className="nft-image">
                <img 
                  src={getImageSrc(nft.metadata, nft.tokenId)}
                  alt={nft.metadata?.name || `Hair Style #${nft.tokenId}`}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/400x400/667eea/ffffff?text=NFT+${nft.tokenId}`;
                  }}
                />
                <div className="price-badge">
                  💰 {nft.marketplace?.price || '0'} ETH
                </div>
                {isOwner(nft) && (
                  <div className="owner-badge">Your NFT</div>
                )}
              </div>
              
              <div className="nft-info">
                <h3>{nft.metadata?.name || `Hair Style #${nft.tokenId}`}</h3>
                <p className="nft-description">{nft.metadata?.description}</p>
                
                <div className="nft-details">
                  <div className="detail-item">
                    <span>Token ID:</span>
                    <span>#{nft.tokenId}</span>
                  </div>
                  <div className="detail-item">
                    <span>Seller:</span>
                    <span>{nft.marketplace?.seller?.slice(0, 6)}...{nft.marketplace?.seller?.slice(-4)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Hair Type:</span>
                    <span>{nft.hairStyleData?.hairType || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span>Color:</span>
                    <span>{nft.hairStyleData?.colorType || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span>Likes:</span>
                    <span>❤️ {nft.hairStyleData?.likes || 0}</span>
                  </div>
                </div>

                <div className="nft-actions">
                  <button 
                    className={`action-button purchase-button ${
                      isOwner(nft) ? 'owner-button' : 
                      purchasing[nft.tokenId] ? 'purchasing-button' : 
                      'buy-button'
                    }`}
                    onClick={() => !isOwner(nft) && !purchasing[nft.tokenId] && handlePurchaseNFT(nft)}
                    disabled={isOwner(nft) || purchasing[nft.tokenId]}
                  >
                    {getPurchaseButtonText(nft)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Marketplace;