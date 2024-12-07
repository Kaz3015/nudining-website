import React, { useEffect, useState, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import Steast from "./Steast";
import { gsap } from 'gsap';
import { doSignOut } from "../firebase/auth";
import IV from "./IV";
import { useNavigate } from 'react-router-dom';
import Joyride from 'react-joyride';

function Home() {
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [showMacros, setShowMacros] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState("Steast");
  const [runTutorial, setRunTutorial] = useState(false);
  const macrosRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showMacros) {
      gsap.fromTo(macrosRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 });
    }
  }, [showMacros]);

  const fetchUserMacros = async () => {
    const user = getAuth().currentUser;

    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(import.meta.env.VITE_FETCH_USER_MACROS_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch macros: ${errorText}`);
      }

      const data = await response.json();
      setMacros(data.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 });
    } catch (error) {
      console.error('Error fetching macros:', error);
    }
  };

  const handleResetMacros = async () => {
    const user = getAuth().currentUser;

    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(import.meta.env.VITE_HANDLE_RESET_USER_MACROS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ uid: user.uid })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reset macros: ${errorText}`);
      }

      const data = await response.json();
      setMacros(data.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 });
    } catch (error) {
      console.error('Error resetting macros:', error);
    }
  };

  const handleMacroClick = () => {
    setShowMacros(!showMacros);
    fetchUserMacros();
  };

  const handleLogout = () => {
    doSignOut()
      .then(() => {
        navigate('/login');
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  }

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
    }
  };

  const steps = [
    {
      target: '.tutorial-button',
      content: 'Click here to start the tutorial.',
    },
    {
      target: '.filter-gluten',
      content: 'Use this button to exclude gluten.',
    },
    {
      target: '.filter-vegetarian',
      content: 'Use this button to only show vegetarian options.',
    },
    {
      target: '.filter-protein',
      content: 'Use this button to only show high protein options.',
    },
    {
      target: '.food-card',
      content: 'Click on a food card to see more details such as macros and ingredients.',
    },
    {
      target: '.food-card-macro',
      content: 'Click on this button to add the food item to your daily macros.',
    },
    {
      target: '.macro-calculator-button',
      content: 'Click here to open the macro calculator.',
    },
  ];

  return (
    <>
      <Joyride
  steps={steps}
  run={runTutorial}
  continuous
  showProgress
  showSkipButton
  callback={handleJoyrideCallback}
  styles={{
    options: {
      zIndex: 10000,
      primaryColor: '#4CAF50', // Primary color for buttons and highlights
      textColor: '#FFFFFF', // Text color
      backgroundColor: '#333333', // Background color for the tooltip
      overlayColor: 'rgba(0, 0, 0, 0.5)', // Overlay color
    },
    tooltip: {
      backgroundColor: '#374151', // Tooltip background color
      color: '#FFFFFF', // Tooltip text color
    },
    buttonNext: {
      backgroundColor: '#2563EB', // Next button background color
      color: '#FFFFFF', // Next button text color
    },
    buttonBack: {
      color: '#FFFFFF', // Back button text color
    },
    buttonClose: {
      color: '#FFFFFF', // Close button color
    },
  }}
/>
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-gray-700 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105"
      >
        Logout
      </button>
      <button
        onClick={() => setRunTutorial(true)}
        className="tutorial-button absolute top-16 left-4 bg-gray-700 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105"
      >
        Start Tutorial
      </button>
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => setSelectedComponent("Steast")}
          className={`py-2 px-6 rounded-full border-2 ${
            selectedComponent === "Steast"
              ? "bg-white text-blue-600 border-blue-600"
              : "bg-gray-700 text-gray-300 hover:bg-blue-500"
          }`}
        >
          Steast
        </button>
        <button
          onClick={() => setSelectedComponent("IV")}
          className={`py-2 px-6 rounded-full border-2 ${
            selectedComponent === "IV"
              ? "bg-white text-blue-600 border-blue-600"
              : "bg-gray-700 text-gray-300 hover:bg-blue-500"
          }`}
        >
          IV
        </button>
      </div>
      <div>
        {selectedComponent === "Steast" ? (
          <Steast fetchUserMacros={fetchUserMacros} />
        ) : (
          <IV fetchUserMacros={fetchUserMacros} />
        )}
        <button
          className="macro-calculator-button absolute top-4 left-4 bg-gray-700 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105"
          onClick={handleMacroClick}
        >
          Macro Calculator
        </button>

        {showMacros && (
          <div ref={macrosRef} className="fixed top-16 left-4 bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-white text-xl font-bold mb-2">Total Macros</h2>
            <p className="text-white">Calories: {macros.calories}</p>
            <p className="text-white">Protein: {macros.protein}g</p>
            <p className="text-white">Carbs: {macros.carbs}g</p>
            <p className="text-white">Fat: {macros.fat}g</p>
            <button
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleResetMacros}
            >
              Reset Macros
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Home;