import React from 'react';

function ResultSection({ resultImage, isProcessing }) {
  const handleSaveImage = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'new_hairstyle.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShareImage = () => {
    // Implement sharing functionality
    alert('Chức năng chia sẻ sẽ được phát triển trong phiên bản tiếp theo!');
  };

  return (
    <div className="upload-column card">
      <div className="card-header">✨ Kết quả</div>
      <div className="result-area">
        {isProcessing ? (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>Đang xử lý, vui lòng đợi...</p>
          </div>
        ) : resultImage ? (
          <>
            <img 
              src={resultImage} 
              alt="Result" 
              className="result-image" 
            />
            <div className="action-buttons">
              <button className="action-button save-button" onClick={handleSaveImage}>
                💾 Lưu ảnh
              </button>
              <button className="action-button share-button" onClick={handleShareImage}>
                🔗 Chia sẻ
              </button>
            </div>
          </>
        ) : (
          <div className="empty-result">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/1055/1055645.png" 
              alt="Empty result" 
              width="100" 
            />
            <p>Tải ảnh lên và nhấn "Tạo kiểu tóc mới!" để xem kết quả</p>
          </div>
        )}
      </div>

      {!resultImage && (
        <div className="tips-card">
          <div className="card-header">💡 Tips</div>
          <ul className="tips-list">
            <li>Sử dụng ảnh chụp chính diện để có kết quả tốt nhất</li>
            <li>Chọn kiểu tóc phù hợp với hình dáng khuôn mặt</li>
            <li>Thử nghiệm nhiều màu khác nhau để tìm ra phong cách phù hợp</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default ResultSection;