import React, { useEffect, useRef, useState } from 'react';
import Star from '../Star/Star';
import MacroTable from "../Macros/MacroTable";
import { FaLeaf, FaBreadSlice, FaHandRock } from 'react-icons/fa';
import gsap from "gsap";
import {useGSAP} from "@gsap/react";

function FoodCard({ foodItem, updateRating }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);


  const averageRating = (foodItem.rating / (foodItem.rating_count || 1)).toFixed(1);

  const handleRating = (newRating) => {
    updateRating(foodItem.title, newRating);
  };
  let labelsArray = JSON.parse(foodItem.labels);


const isVegetarian = labelsArray.includes("vegetarian");
  const hasGluten = labelsArray.includes("gluten");
  const highProtein = labelsArray.includes("protein");

  return (
    <div
      ref={cardRef}
      className={`relative bg-gray-700 text-white rounded-lg shadow-md p-6 cursor-pointer
       hover:bg-gray-600 transition-all duration-400 ${
        isExpanded ? "w-auto h-auto" : "w-64 h-32"
      }`}
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{foodItem.title}</h2>
        <div className="absolute top-2 right-2 flex justify-end items-start space-x-2">
          {isVegetarian && <FaLeaf title="Vegetarian" className="text-green-400" />}
          {hasGluten && <FaBreadSlice title="Contains Gluten" className="text-yellow-500" />}
          {highProtein && <FaHandRock title="High Protein" className="text-red-400" />}
        </div>
      </div>

      <div className="flex items-center mt-2">
        <Star currentRating={averageRating} onRate={handleRating} />
        <span className="ml-2 text-sm">({foodItem.rating_count} reviews)</span>
      </div>

      {isExpanded && (
        <div className="mt-4">
          <p className="text-gray-300">{foodItem.description}</p>
          <MacroTable macros={foodItem.nutritional_info} />
          <div className="mt-2">
            <h3 className="font-semibold">Portion Size:</h3>
            <p className="text-gray-300">{foodItem.portion_size}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodCard;