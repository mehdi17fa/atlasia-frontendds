import React from "react";

export default function PropertyCard({ name, description, location, image, onClick }) {
  return (
    <div
      className="flex items-center bg-white rounded-xl shadow border border-gray-200 p-4 mb-2 cursor-pointer hover:shadow-md transition"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') onClick && onClick(); }}
    >
      <img
        src={image}
        alt={name}
        className="w-16 h-16 rounded-lg object-cover mr-4 flex-shrink-0"
      />
      <div className="flex flex-col">
        <span className="font-semibold text-base text-gray-900 mb-1">{name}</span>
        {description && (
          <span className="text-sm text-gray-600 mb-1 line-clamp-2">{description}</span>
        )}
        <span className="text-xs text-gray-500">{location}</span>
      </div>
    </div>
  );
} 