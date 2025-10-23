import React from 'react';

function TrendingStyles() {
  const trendingHairstyles = [
    { id: 1, name: 'Kiểu layer', image: '/trending_hair/layer.jpg' },
    { id: 2, name: 'Kiểu mulet', image: '/trending_hair/mulet.jpg' },
    { id: 3, name: 'Side Part 6/4', image: '/trending_hair/sidepart64.jpg' },
    { id: 4, name: 'Texture Top', image: '/trending_hair/textureTop.jpg' },
    { id: 5, name: 'Kiểu duỗi thẳng', image: '/trending_hair/tocduoi.jpg' },
  ];

  return (
    <div className="card trending-styles">
      <div className="card-header">🔥 Xu hướng tóc hot nhất</div>
      <div className="styles-container">
        {trendingHairstyles.map(style => (
          <div key={style.id} className="style-item">
            <img src={style.image} alt={style.name} className="style-image" />
            <div className="style-name">{style.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrendingStyles;
