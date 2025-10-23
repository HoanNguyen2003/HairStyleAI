import React from 'react';

function UploadSection({ 
  faceImage, 
  hairShape, 
  hairColor, 
  setFaceImage, 
  setHairShape, 
  setHairColor, 
  handleProcessImages, 
  isProcessing,
  error
}) {
  const handleFileUpload = (setter) => (e) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  return (
    <div className="upload-column card">
      <div className="upload-step">
        <div className="card-header">
          <span className="step-number">1</span>Tải ảnh của bạn
        </div>
        <div className="file-upload-container">
          <label className="file-upload-label">
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/jpg" 
              onChange={handleFileUpload(setFaceImage)}
              className="file-input" 
            />
            <span className="upload-button">Chọn ảnh khuôn mặt</span>
          </label>
          {faceImage && (
            <div className="preview-container">
              <img 
                src={URL.createObjectURL(faceImage)} 
                alt="Face preview" 
                className="image-preview" 
              />
              <div className="file-name">{faceImage.name}</div>
            </div>
          )}
        </div>
      </div>

      <div className="upload-step">
        <div className="card-header">
          <span className="step-number">2</span>Chọn kiểu tóc
        </div>
        <div className="file-upload-container">
          <label className="file-upload-label">
            <input 
              type="file" 
              accept="image/png" 
              onChange={handleFileUpload(setHairShape)}
              className="file-input" 
            />
            <span className="upload-button">Chọn ảnh mẫu tóc</span>
          </label>
          {hairShape && (
            <div className="preview-container">
              <img 
                src={URL.createObjectURL(hairShape)} 
                alt="Hair shape preview" 
                className="image-preview" 
              />
              <div className="file-name">{hairShape.name}</div>
            </div>
          )}
        </div>
      </div>

      <div className="upload-step">
        <div className="card-header">
          <span className="step-number">3</span>Chọn màu tóc
        </div>
        <div className="file-upload-container">
          <label className="file-upload-label">
            <input 
              type="file" 
              accept="image/png" 
              onChange={handleFileUpload(setHairColor)}
              className="file-input" 
            />
            <span className="upload-button">Chọn ảnh màu tóc</span>
          </label>
          {hairColor && (
            <div className="preview-container">
              <img 
                src={URL.createObjectURL(hairColor)} 
                alt="Hair color preview" 
                className="image-preview" 
              />
              <div className="file-name">{hairColor.name}</div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button 
        className="custom-button" 
        onClick={handleProcessImages}
        disabled={!faceImage || !hairShape || !hairColor || isProcessing}
      >
        {isProcessing ? '🔄 Đang xử lý...' : '✨ Tạo kiểu tóc mới!'}
      </button>
    </div>
  );
}

export default UploadSection;