import { useState } from "react";

function Star({ currentRating, onRate }) {
  const [hoverRating, setHoverRating] = useState(0);

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => onRate(star)}
        style={{
          cursor: 'pointer',
          color: star <= (hoverRating || currentRating) ? '#FFD700' : '#ccc'
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="starRating">
      {renderStars()}
    </div>
  );
}

export default Star;
