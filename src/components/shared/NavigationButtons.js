import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable navigation button with left and right sections.
 * @param {React.ReactNode} left - Content for the left section
 * @param {React.ReactNode} right - Content for the right section
 * @param {string} to - The route to navigate to on click (optional)
 * @param {boolean} active - If true, highlights the button (optional)
 */
export default function NavigationButton({ left, right, to, active }) {
  const navigate = useNavigate();

  return (
    <div
      className={`rounded-xl border border-gray-300 bg-white px-4 py-2.5 mb-2 flex items-center justify-between cursor-pointer transition hover:bg-gray-50
        ${active ? "ring-2 ring-green-800" : ""}
      `}
      onClick={to ? () => navigate(to) : undefined}
    >
      <span className="text-black font-semibold">{left}</span>
      <span className="text-gray-500 font-medium">{right}</span>
    </div>
  );
}