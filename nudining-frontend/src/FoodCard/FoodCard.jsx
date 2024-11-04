import React, { useState } from 'react';
import './FoodCard.css';
import Star from '../Star/Star';
import MacroTable from '../Macros/MacroTable';

function FoodCard({ foodItem, updateRating }) {
  const [isHovered, setIsHovering] = useState(false);
  const averageRating = foodItem.rating / (foodItem.rating_count || 1);

  const handleRating = (newRating) => {
    updateRating(foodItem.title, newRating);
  };

  return (
    <div
      className="foodCard"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <h2>{foodItem.title}</h2>
      <h1>Average Rating: {averageRating.toFixed(1)}</h1>

      {isHovered && (
        <div>
          <MacroTable macros={foodItem.nutritional_info}/>?
          <Star currentRating={averageRating} onRate={handleRating} />
          <h3>Rating Count: {foodItem.rating_count}</h3>
          <h3>Portion Size: {foodItem.portion_size}</h3>
        </div>
      )}
    </div>
  );
}

export default FoodCard;
