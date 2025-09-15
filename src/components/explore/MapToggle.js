import React from 'react';
import { MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function MapToggle({ isMapView = false, onToggle = () => {} }) {
  return (
    <div className="flex justify-center my-4">
      <button 
        onClick={onToggle}
        className="bg-green-700 text-white px-6 py-2 mb-8 rounded-full font-medium text-sm hover:bg-green-800 transition flex items-center gap-2"
      >
        {isMapView ? (
          <>
            <ListBulletIcon className="w-4 h-4" />
            Liste
          </>
        ) : (
          <>
            <MapIcon className="w-4 h-4" />
            Carte
          </>
        )}
      </button>
    </div>
  );
}
