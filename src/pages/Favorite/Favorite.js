// src/pages/Favorites/Favorites.js
import React from 'react';
import SectionTitle from '../../components/shared/SectionTitle';

export default function Favorites() {
  const sections = [
    'Logement',
    'Restaurants',
    'Activités',
    'Packs et Services',
    'Professionnel préféré',
  ];

  return (
    <div className="pb-20 px-4  mt-24 ">
      <SectionTitle title="Ma Liste" />
      <ul className="space-y-4 text-lg mt-8">
        {sections.map((label) => (
          <li key={label} className="flex justify-between items-center py-2 border-b">
            <span>{label}</span>
            <span>&gt;</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
