import React, { useEffect, useState } from 'react';
import FoodCard from "../FoodCard/FoodCard";

function FoodList() {
  const [foodList, setFoodItems] = useState([]);

  useEffect(() => {
    fetchUpdatedFoodItems();
  }, []);

  const fetchUpdatedFoodItems = () => {
    fetch('http://127.0.0.1:5000/api/getCurrentFoodItems')
      .then(response => response.json())
      .then(data => {
        data.forEach(item => {
          console.log(`Item Title: ${item.title}, Labels:`, item.labels);
        });
        setFoodItems(data);
      })
      .catch(error => console.error("Error fetching data:", error));
  };

  const updateRating = (title, newRating) => {
    fetch('http://127.0.0.1:5000/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, rating: newRating })
    })
      .then(response => response.json())
      .then(updatedItem => {
        setFoodItems(prevItems =>
          prevItems.map(item =>
            item.title === updatedItem.title ? updatedItem : item
          )
        );
        fetchUpdatedFoodItems();
      })
      .catch(error => console.error("Error updating rating:", error));
  };

  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-6 text-center">Today's Food Items</h1>
      <div className=" p-4 flex flex-wrap gap-6 justify-start">
        {foodList.map((food, index) => (
          <FoodCard key={index} foodItem={food} updateRating={updateRating} />
        ))}
      </div>
    </div>
  );
}

export default FoodList;
