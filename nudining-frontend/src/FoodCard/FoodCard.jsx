import React, { useEffect, useRef, useState } from 'react';
import Star from '../Star/Star';
import MacroTable from "../Macros/MacroTable";
import { FaLeaf, FaBreadSlice, FaHandRock, FaCheckCircle } from 'react-icons/fa';
import { getAuth } from 'firebase/auth';

const FoodCard = React.forwardRef(({ className, foodItem, updateRating, ratedFood, fetchUserMacros }, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [servingSize, setServingSize] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [macros, setMacros] = useState(foodItem.nutritional_info || {});
  const cardRef = useRef(null);

  const averageRating = Number((foodItem.rating / (foodItem.rating_count || 1)).toFixed(1));

  const handleRating = (event, newRating) => {
    event.stopPropagation();
    console.log(`Updating rating for ${foodItem.title} to ${newRating}`);
    updateRating(foodItem.title, newRating)
      .then(response => {
        console.log('Rating updated successfully:', response);
      })
      .catch(error => {
        console.error('Error updating rating:', error);
      });
  };

  const handleAddMacros = async (event) => {
    event.stopPropagation();
    const user = getAuth().currentUser;

    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const uid = user.uid;

      const response = await fetch(import.meta.env.VITE_UPDATE_MACROS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid,
          serving_size: parseFloat(servingSize),
          food_item: foodItem
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update macros: ${errorText}`);
      }

      const data = await response.json();
      console.log('Macros updated:', data);
      setServingSize('');
      setShowInput(false);
      setMacros(data.macros || {});
      console.log(macros) // Update the macros state with the server response
      fetchUserMacros(); // Refresh user macros in the parent component
    } catch (error) {
      console.error('Error updating macros:', error);
    }
  };

  const handleShowInput = (event) => {
    event.stopPropagation();
    setShowInput(!showInput);
  };

  let labelsArray = [];
  try {
    labelsArray = JSON.parse(foodItem.labels || '[]');
  } catch (error) {
    console.error("Error parsing labels:", error);
  }

  const isVegetarian = labelsArray.includes("vegan");
  const hasGluten = labelsArray.includes("gluten");
  const highProtein = labelsArray.includes("protein");

  const isRated = ratedFood.includes(foodItem.title);

  return (
    <div
      ref={ref}
      className={`relative bg-gray-700 text-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-600 transition-all duration-400 ${
        isExpanded ? "w-auto h-auto" : "w-72 h-36"
      } ${className}`}
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-bold break-words">{foodItem.title}</h2>
        <div className="absolute top-2 right-2 flex justify-end items-start space-x-2">
          {isVegetarian && (
            <div className="relative group">
              <FaLeaf title="Vegan" className="text-green-400" />
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                Vegetarian
              </span>
            </div>
          )}
          {hasGluten && (
            <div className="relative group">
              <FaBreadSlice title="Contains Gluten" className="text-yellow-500" />
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                Contains Gluten
              </span>
            </div>
          )}
          {highProtein && (
            <div className="relative group">
              <FaHandRock title="High Protein" className="text-red-400" />
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
                High Protein
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center mt-2">
        <Star currentRating={averageRating} onRate={(event, rating) => handleRating(event, rating)} />
        {isRated && <FaCheckCircle className="text-green-500 ml-2" />}
        <span className="ml-2 text-sm">({foodItem.rating_count} reviews)</span>
      </div>

      {isExpanded && (
        <div className="mt-4 max-w-sm">
          <p className="text-gray-300">{foodItem.description}</p>
          <MacroTable macros={foodItem.nutritional_info} />
          <div className="mt-2">
            <strong>Ingredients: </strong>
            <p className="text-gray-300">{foodItem.ingredients}</p>
          </div>

          <div className="mt-2">
            <h3 className="font-semibold">Portion Size:</h3>
            <p className="text-gray-300">{foodItem.portion_size}</p>
          </div>
          <button
            onClick={handleShowInput}
            className="food-card-macro bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 absolute right-4 bottom-4 w-8 transition duration-300 ease-in-out transform hover:scale-105"
          >
            +
          </button>
          {showInput && (
            <div onClick={(event) => event.stopPropagation()} className="mt-2">
              <input
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="Serving size"
                className="border rounded px-2 py-1 text-black"
              />
              <button
                onClick={handleAddMacros}
                className="bg-green-500 text-white px-2 py-1 rounded ml-2 hover:bg-green-600"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FoodCard;
