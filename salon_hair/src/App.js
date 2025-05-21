import React, { useState } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import ResultSection from './components/ResultSection';
import TrendingStyles from './components/TrendingStyles';
import Reviews from './components/Reviews';
import Footer from './components/Footer';
import Chatbox from './components/Chatbot';
import './styles/style.scss';

function App() {
  const [faceImage, setFaceImage] = useState(null);
  const [hairShape, setHairShape] = useState(null);
  const [hairColor, setHairColor] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="app">
      <Header />
      <Navbar />
      
      <div className="container">
        <div className="intro card">
          <h2 className="card-header">👋 Chào mừng bạn đến với công cụ thử kiểu tóc ảo!</h2>
          <p>Công nghệ AI của chúng tôi sẽ giúp bạn dễ dàng thử nghiệm các kiểu tóc và màu sắc khác nhau trước khi quyết định thay đổi diện mạo thực tế.</p>
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
          />
        </div>
        
        <TrendingStyles />
        <Reviews />
      </div>
      
      <Footer />
      <Chatbox />
    </div>
  );
}

export default App;