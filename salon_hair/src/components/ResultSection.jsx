import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { uploadToIPFS, uploadJSONToIPFS } from '../utils/ipfs';

function ResultSection({ resultImage, isProcessing, originalImages, semanticData }) {
  const { account, contracts, isConnected, balance, updateBalance } = useWeb3();
  const [isMinting, setIsMinting] = useState(false);

  const handleSaveImage = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `hairstyle_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMintNFT = async () => {
    if (!isConnected) {
      alert('⚠️ Vui lòng kết nối ví MetaMask trên navbar trước khi mint NFT');
      return;
    }

    if (!resultImage) {
      alert('❌ Không có ảnh kết quả để mint NFT');
      return;
    }

    if (!contracts.hairStyleNFT) {
      alert('❌ Smart contracts chưa được load. Vui lòng deploy contracts trước.');
      return;
    }

    setIsMinting(true);

    try {
      console.log('🎨 Starting NFT minting process...');

      // Convert result image to file
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const resultFile = new File([blob], `hairstyle_result_${Date.now()}.png`, { type: 'image/png' });

      // Upload result image to IPFS
      console.log('📤 Uploading result image to IPFS...');
      const resultImageHash = await uploadToIPFS(resultFile);
      console.log('✅ Result image uploaded:', resultImageHash);

      // Upload original face image to IPFS (if available)
      let originalImageHash = '';
      if (originalImages.face) {
        console.log('📤 Uploading original image to IPFS...');
        originalImageHash = await uploadToIPFS(originalImages.face);
        console.log('✅ Original image uploaded:', originalImageHash);
      }

      // Create metadata with enhanced attributes
      const timestamp = new Date().toISOString();
      const metadata = {
        image:  `ipfs://${resultImageHash}`,
        metadata: semanticData || null
      };

      console.log('📤 Uploading metadata to IPFS...');
      const metadataHash = await uploadJSONToIPFS(metadata);
      console.log('✅ Metadata uploaded:', metadataHash);
      
      // Mint NFT (miễn phí, chỉ trả gas fee)
      console.log('🎨 Minting NFT on blockchain...');
      const tx = await contracts.hairStyleNFT.mintHairStyle(
        account,
        `ipfs://${metadataHash}`,
        originalImageHash,
        resultImageHash,
        semanticData?.faceShape || originalImages.hairShape?.name || 'Custom',
        semanticData?.hairColor || originalImages.hairColor?.name || 'Custom'
      );

      console.log('⏳ Waiting for transaction confirmation...');
      console.log('📋 Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      
      // Update balance after transaction
      await updateBalance();
      
      // Get token ID from transaction receipt
      const mintEvent = receipt.events?.find(e => e.event === 'HairStyleMinted');
      const tokenId = mintEvent?.args?.tokenId?.toNumber();
      
      if (tokenId) {
        alert(`🎉 NFT đã được mint thành công!\n\n🆔 Token ID: ${tokenId}\n📋 Transaction: ${receipt.transactionHash}\n\n✨ Bạn có thể xem NFT trong "My NFTs"`);
        console.log('✅ NFT minted successfully!', {
          tokenId,
          transactionHash: receipt.transactionHash,
          gasUsed: receipt.gasUsed.toString()
        });
      } else {
        alert(`🎉 NFT đã được mint thành công!\n📋 Transaction: ${receipt.transactionHash}`);
        console.log('✅ NFT minted successfully! Transaction:', receipt.transactionHash);
      }

    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      
      let errorMessage = 'Lỗi khi mint NFT:\n\n';
      if (error.message.includes('user rejected')) {
        errorMessage += '❌ Bạn đã từ chối giao dịch trong MetaMask';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += '💰 Không đủ ETH để trả gas fee\n\nVui lòng nạp thêm ETH vào ví';
      } else if (error.message.includes('execution reverted')) {
        errorMessage += '⚠️ Smart contract từ chối giao dịch\n\nCó thể do contracts chưa được deploy đúng cách';
      } else if (error.message.includes('network')) {
        errorMessage += '🌐 Lỗi kết nối mạng\n\nVui lòng kiểm tra kết nối internet';
      } else {
        errorMessage += `🔧 ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const handleShareImage = async () => {
    if (!resultImage) {
      alert('❌ Không có ảnh để chia sẻ');
      return;
    }

    const shareData = {
      title: 'My AI Hair Style - HairStyleAI',
      text: `🎨 Tôi vừa tạo kiểu tóc mới với HairStyleAI Web3! \n\nHair Type: ${originalImages.hairShape?.name || 'Custom'}\nColor: ${originalImages.hairColor?.name || 'Custom'}\n\n`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        console.log('✅ Shared successfully');
      } catch (error) {
        console.log('❌ Share cancelled or failed');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const text = shareData.text + shareData.url;
      try {
        await navigator.clipboard.writeText(text);
        alert('✅ Link đã được copy vào clipboard!');
      } catch (error) {
        console.warn('❌ Failed to copy to clipboard');
        alert('❌ Không thể copy link. Vui lòng copy thủ công: ' + text);
      }
    }
  };

  const getMintButtonStatus = () => {
    if (!isConnected) {
      return { text: '🔗 Kết nối ví để mint NFT', disabled: true };
    }
    if (!contracts.hairStyleNFT) {
      return { text: '⚠️ Contracts chưa sẵn sàng', disabled: true };
    }
    if (isMinting) {
      return { text: '🔄 Đang mint NFT...', disabled: true };
    }
    return { text: '🎨 Mint NFT (Free + Gas)', disabled: false };
  };

  const mintButtonStatus = getMintButtonStatus();

  return (
    <div className="upload-column card">
      <div className="card-header">
        ✨ Kết quả
        {isConnected && (
          <span className="connection-indicator">🔗 Đã kết nối</span>
        )}
      </div>
      
      <div className="result-area">
        {isProcessing ? (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>🔄 Đang xử lý ảnh với AI...</p>
            <p className="processing-subtitle">Vui lòng đợi trong giây lát</p>
          </div>
        ) : resultImage ? (
          <>
            <div className="result-image-container">
              <img 
                src={resultImage} 
                alt="AI Generated Hair Style Result" 
                className="result-image" 
              />
              <div className="image-overlay">
                <span className="image-label">AI Generated</span>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="action-button save-button" 
                onClick={handleSaveImage}
                title="Tải ảnh về máy"
              >
                💾 Lưu ảnh
              </button>
              
              <button 
                className={`action-button mint-button ${!mintButtonStatus.disabled ? 'ready' : 'disabled'}`}
                onClick={handleMintNFT}
                disabled={mintButtonStatus.disabled}
                title={isConnected ? 'Mint NFT miễn phí (chỉ trả gas fee)' : 'Kết nối ví để mint NFT'}
              >
                {mintButtonStatus.text}
              </button>
              
              <button 
                className="action-button share-button" 
                onClick={handleShareImage}
                title="Chia sẻ kết quả"
              >
                🔗 Chia sẻ
              </button>
            </div>
            
            {/* Web3 Status Info */}
            <div className="web3-status-info">
              {!isConnected ? (
                <div className="status-card not-connected">
                  <p className="status-message">
                    🔗 Kết nối ví MetaMask trên navbar để mint NFT miễn phí!
                  </p>
                  <div className="status-details">
                    <small>• Mint NFT hoàn toàn miễn phí (chỉ trả gas fee)</small>
                    <small>• Sở hữu kiểu tóc AI độc quyền trên blockchain</small>
                    <small>• Có thể bán trên marketplace</small>
                  </div>
                </div>
              ) : (
                <div className="status-card connected">
                  <div className="wallet-details">
                    <div className="wallet-item">
                      <span className="label">👤 Ví:</span>
                      <span className="value">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
                    </div>
                    <div className="wallet-item">
                      <span className="label">💰 Số dư:</span>
                      <span className="value">{parseFloat(balance || 0).toFixed(4)} ETH</span>
                    </div>
                    <div className="wallet-item">
                      <span className="label">📋 Contracts:</span>
                      <span className={`value ${contracts.hairStyleNFT ? 'ready' : 'not-ready'}`}>
                        {contracts.hairStyleNFT ? '✅ Sẵn sàng' : '⚠️ Chưa deploy'}
                      </span>
                    </div>
                  </div>
                  
                  {!contracts.hairStyleNFT && (
                    <div className="contract-warning">
                      <p>⚠️ Smart contracts chưa được deploy</p>
                      <small>Chạy: cd blockchain && npm run deploy</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-result">
            <div className="empty-icon">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/1055/1055645.png" 
                alt="Upload to see result" 
                width="80" 
              />
            </div>
            <h3>Chưa có kết quả</h3>
            <p>Tải ảnh lên và nhấn "Tạo kiểu tóc mới!" để xem phép màu AI</p>
          </div>
        )}
      </div>

      {/* Tips Section - only show when no result */}
      {!resultImage && (
        <div className="tips-card">
          <div className="card-header">💡 Mẹo để có kết quả tốt nhất</div>
          <ul className="tips-list">
            <li>📸 Sử dụng ảnh chụp chính diện, ánh sáng tốt</li>
            <li>👤 Chọn ảnh có khuôn mặt rõ ràng, không bị che</li>
            <li>🎨 Thử nghiệm nhiều kiểu tóc và màu sắc khác nhau</li>
            <li>🆕 <strong>Mint NFT miễn phí</strong> để sở hữu kiểu tóc độc quyền!</li>
            <li>💰 Chỉ cần trả gas fee (thường &lt; $5) để mint NFT</li>
            <li>🏪 Có thể bán NFT trên marketplace tích hợp</li>
            <li>🔗 Kết nối MetaMask để sử dụng tính năng Web3</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default ResultSection;