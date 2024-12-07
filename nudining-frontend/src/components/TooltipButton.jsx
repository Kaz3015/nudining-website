// TooltipButton.jsx
import React from 'react';

function TooltipButton({
  tooltipText,
  onClick,
  children,
  containerClassName = '',
  buttonClassName = '',
}) {
  // Generate a unique ID for ARIA accessibility
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative group inline-block ${containerClassName}`}>
      {/* Macro Calculator Button */}
      <button
        onClick={onClick}
        className={`relative z-10 ${buttonClassName}`}
        aria-describedby={tooltipId}
      >
        {children}
      </button>

      {/* Tooltip */}
      <span
        id={tooltipId}
        role="tooltip"
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-sm rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
      >
        {tooltipText}
      </span>
    </div>
  );
}

export default TooltipButton;
