import React from 'react';
import { MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function MapToggle({ isMapView = false, onToggle = () => {} }) {
  return (
    <div className="flex justify-center my-4">
      <button 
        onClick={onToggle}
        className="bg-primary-500 text-white px-6 py-2 mb-8 rounded-full font-medium text-sm hover:bg-primary-600 transition-colors flex items-center gap-2 shadow-atlasia"
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
