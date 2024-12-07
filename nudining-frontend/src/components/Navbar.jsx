import React from 'react';
import { FaLeaf, FaBreadSlice, FaHandRock, FaBan } from 'react-icons/fa';

function Navbar({ handleNavClick, toggleFilter, activeFilters }) {
  return (
    <>
      <div className="text-center">
        <nav className="inline-flex justify-center m-4 space-x-4 rounded-full border-2 px-4 py-4">
          <button
            onClick={() => handleNavClick("Breakfast")}
            className="bg-gray-700 text-gray-300 p-2 hover:bg-blue-500 rounded-full px-4 border-2"
          >
            Breakfast
          </button>
          <button
            onClick={() => handleNavClick("Lunch")}
            className="bg-gray-700 text-gray-300 p-2 hover:bg-blue-500 rounded-full px-4 border-2"
          >
            Lunch
          </button>
          <button
            onClick={() => handleNavClick("Dinner")}
            className="bg-gray-700 text-gray-300 p-2 hover:bg-blue-500 rounded-full px-4 border-2"
          >
            Dinner
          </button>
          <button
            onClick={() => handleNavClick("Everyday")}
            className="bg-gray-700 text-gray-300 p-2 hover:bg-blue-500 rounded-full px-4 border-2"
          >
            Everyday
          </button>
        </nav>
      </div>
      <div className="text-center">
        <div className="inline-flex justify-center gap-4 mb-6">
          {/* Vegan Filter Button */}
          <div className="relative group">
            <button onClick={() => toggleFilter('vegan')}>
              <FaLeaf
                title="Vegan"
                className={`filter-vegetarian ${
                  activeFilters.includes('vegan') ? 'text-green-200' : 'text-green-500'
                }`}
              />
            </button>
            <span className="filter-vegetarian absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
              Vegetarian
            </span>
          </div>
          {/* Exclude Gluten Filter Button */}
          <div className="relative group">
            <button onClick={() => toggleFilter('gluten')}>
              <div className="relative w-6 h-6">
                {/* Bread Icon */}
                <FaBreadSlice
                  title="Exclude Gluten"
                  className={`filter-gluten absolute text-yellow-500 ${
                    activeFilters.includes('gluten') ? 'opacity-50' : ''
                  }`}
                  style={{ fontSize: '1rem', top: '5px', left: '5px' }}
                />
                {/* Ban Icon */}
                <FaBan
                  className="absolute text-red-600"
                  style={{ fontSize: '2rem', top: '-4px', left: '-4px' }}
                />
              </div>
            </button>
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
              Exclude Gluten
            </span>
          </div>
          {/* High Protein Filter Button */}
          <div className="relative group">
            <button onClick={() => toggleFilter('protein')}>
              <FaHandRock
                title="High Protein"
                className={`filter-protein ${
                  activeFilters.includes('protein') ? 'text-red-200' : 'text-red-500'
                }`}
              />
            </button>
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2">
              High Protein
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
