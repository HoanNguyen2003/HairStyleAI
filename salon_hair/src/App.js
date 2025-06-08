import React, { useState } from 'react';
import './styles/style.scss';
import Header from './components/Header';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import ResultSection from './components/ResultSection';
import Marketplace from './components/Marketplace';
import MyNFTs from './components/MyNFTs';
import TrendingStyles from './components/TrendingStyles';
import { NFTProvider } from './contexts/NFTContext';

import Reviews from './components/Reviews';
import Footer from './components/Footer';
import Chatbox from './components/Chatbot';
import { Web3Provider } from './contexts/Web3Context';

function App() {
  const [faceImage, setFaceImage] = useState(null);
  const [hairShape, setHairShape] = useState(null);
  const [hairColor, setHairColor] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('home');

  const handleProcessImages = async () => {
    if (!faceImage || !hairShape || !hairColor) {
      setError('Vui lòng tải lên đầy đủ các ảnh cần thiết');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('face', faceImage);
    formData.append('shape', hairShape);
    formData.append('color', hairColor);

    try {
      const response = await fetch('http://localhost:5000/swap', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Lỗi từ server: ${response.status}`);
      }

      const blob = await response.blob();
      setResultImage(URL.createObjectURL(blob));
    } catch (err) {
      setError(`Đã xảy ra lỗi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <>
            <div className="intro card">
              <h2 className="card-header">👋 Chào mừng bạn đến với công cụ thử kiểu tóc ảo Web3!</h2>
              <p>Công nghệ AI của chúng tôi sẽ giúp bạn dễ dàng thử nghiệm các kiểu tóc và màu sắc khác nhau trước khi quyết định thay đổi diện mạo thực tế. Giờ đây bạn còn có thể mint NFT và giao dịch trên marketplace!</p>
            </div>
            
            <div className="main-content">
              <UploadSection 
                faceImage={faceImage}
                hairShape={hairShape}
                hairColor={hairColor}
                setFaceImage={setFaceImage}
                setHairShape={setHairShape}
                setHairColor={setHairColor}
                handleProcessImages={handleProcessImages}
                isProcessing={isProcessing}
                error={error}
              />
              
              <ResultSection 
                resultImage={resultImage}
                isProcessing={isProcessing}
                originalImages={{
                  face: faceImage,
                  hairShape: hairShape,
                  hairColor: hairColor
                }}
              />
            </div>
          </>
        );
      case 'marketplace':
        return <Marketplace />; // Add this case
      case 'my-nfts':
        return <MyNFTs />;
      // ... other cases
      default:
        return <div>Không tìm thấy nội dung phù hợp.</div>;
    }
  };

  return (
    <Web3Provider>
      <NFTProvider>

        <div className="app">
          <Header />
          <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />
          
          <div className="container">
            {renderSection()}
            
            {activeSection === 'home' && <Reviews />}
          </div>
          
          <Footer />
          <Chatbox />
        </div>
      </NFTProvider>
    </Web3Provider>
  );
}

export default App;