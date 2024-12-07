import React, { useEffect, useState, useRef } from 'react';
import FoodCard from "../FoodCard/FoodCard";
import { getAuth } from "firebase/auth";
import { gsap } from 'gsap';

function FoodList({ Station, MealPeriod, DiningHall, fetchUserMacros, activeFilters }) {
  const [foodList, setFoodItems] = useState([]);
  const [ratedFood, setRatedFood] = useState([]);
  const [cardsRendered, setCardsRendered] = useState(false);
  const foodCardRefs = useRef({}); // Using an object to map unique titles to refs

  const getFilteredFoodItems = () => {
    let filteredItems = foodList;

    if (activeFilters && activeFilters.length > 0) {
      if (activeFilters.includes('gluten')) {
        filteredItems = filteredItems.filter(
          (item) => !JSON.parse(item.labels || '[]').includes('gluten')
        );
      }

      const includeFilters = activeFilters.filter((filter) => filter !== 'gluten');
      if (includeFilters.length > 0) {
        filteredItems = filteredItems.filter((item) =>
          includeFilters.some((filter) =>
            JSON.parse(item.labels || '[]').includes(filter)
          )
        );
      }
    }

    return filteredItems;
  };

  const filteredFoodItems = getFilteredFoodItems();

  // Fetch food items and rated food on component mount
  useEffect(() => {
    fetchUpdatedFoodItems();
    fetchUserRatedFood();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set cardsRendered to true once all food cards are created
  useEffect(() => {
    if (filteredFoodItems.length > 0) {
      setCardsRendered(true);
    }
  }, [filteredFoodItems]);

  // Apply GSAP animation when cardsRendered is true
  useEffect(() => {
    if (cardsRendered) {
      const cards = Object.values(foodCardRefs.current).filter((el) => el);

      if (cards.length > 0) {
        // Reset opacity and position before animating
        gsap.set(cards, { opacity: 0, y: 20 });

        // Animate the cards
        gsap.fromTo(cards,
            { opacity: 0, y: 20 },
            {
          opacity: 1,
          y: 0,
          duration: 0.5,
            stagger: 0.1,
          ease: "power2.out",
        });
      }
    }
  }, [cardsRendered]);

  const fetchUpdatedFoodItems = async () => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(import.meta.env.VITE_FETCH_UPDATED_FOOD_ITEMS_URL, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch food items");
        }
        const data = await response.json();
        setFoodItems(data);
      } catch (error) {
        console.error("Error fetching food items:", error);
      }
    } else {
      console.error("User is not authenticated");
    }
  };

  const fetchUserRatedFood = async () => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(import.meta.env.VITE_FETCH_USER_RATED_FOOD_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user-rated food");
        }
        const data = await response.json();
        setRatedFood(data.ratedFood);
      } catch (error) {
        console.error("Error fetching user-rated food:", error);
      }
    } else {
      console.error("User is not authenticated");
    }
  };

  const updateRating = async (title, newRating) => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken();
        const uid = user.uid;
        console.log("Payload:", { title, rating: newRating, uid });
        const response = await fetch(import.meta.env.VITE_UPDATE_RATING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ title, rating: newRating, uid }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error:", errorText);
          throw new Error('Failed to update rating');
        }
        const updatedItem = await response.json();
        setFoodItems(prevItems =>
          prevItems.map(item =>
            item.title === updatedItem.title ? updatedItem : item
          )
        );
        setRatedFood(prevRatedFood => [...prevRatedFood, title]);
        return updatedItem;
      } catch (error) {
        console.error("Error updating rating:", error);
        throw error;
      }
    } else {
      console.error("User is not authenticated");
      throw new Error("User is not authenticated");
    }
  };

  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-6 text-center">{Station}</h1>
      <div className="p-4 flex flex-wrap gap-6 justify-start">
        {filteredFoodItems
          .filter(food => food.dining_hall.includes(DiningHall))
          .filter(food => food.meal_period.includes(MealPeriod))
          .filter(food => food.table_caption.includes(Station))
          .map((food) => (
            <FoodCard className="food-card"
              key={food.title} // Ensure 'title' is unique
              ref={(el) => {
                if (el) {
                  foodCardRefs.current[food.title] = el;
                }
              }}
              foodItem={food}
              updateRating={updateRating}
              ratedFood={ratedFood}
              fetchUserMacros={fetchUserMacros}
            />
          ))}
      </div>
    </div>
  );
}

export default FoodList;