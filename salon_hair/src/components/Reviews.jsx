import React from 'react';

function Reviews() {
  const reviews = [
    {
      id: 1,
      rating: 5,
      comment: "Công cụ này thật tuyệt vời! Tôi đã thử nhiều kiểu tóc khác nhau trước khi quyết định cắt thực sự.",
      author: "Nguyễn Thị A"
    },
    {
      id: 2,
      rating: 5,
      comment: "Rất dễ sử dụng và kết quả trông rất tự nhiên. Giờ tôi không còn lo lắng khi thay đổi kiểu tóc nữa.",
      author: "Trần Văn B"
    }
  ];

  return (
    <div className="card reviews">
      <div className="card-header">⭐ Đánh giá từ khách hàng</div>
      <div className="reviews-container">
        {reviews.map(review => (
          <div key={review.id} className="review-item">
            <div className="review-rating">
              {'⭐'.repeat(review.rating)}
            </div>
            <p className="review-comment">{review.comment}</p>
            <div className="review-author">- {review.author}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reviews;