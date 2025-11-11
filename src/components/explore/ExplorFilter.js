// components/explore/ExploreFilter.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Import custom SVGs
import { ReactComponent as LogementIcon } from '../../assets/icons/logement.svg';
import { ReactComponent as RestaurationIcon } from '../../assets/icons/restauration.svg';
import { ReactComponent as ActiviteIcon } from '../../assets/icons/activite.svg';
import { ReactComponent as PacksIcon } from '../../assets/icons/pack.svg';

const categories = [
  { label: 'Logement', icon: LogementIcon, path: '/' }, // ← ici
  { label: 'Services', icon: RestaurationIcon, path: '/restauration' },
  { label: 'Activités', icon: ActiviteIcon, path: '/activites' },
  { label: 'Packs et services', icon: PacksIcon, path: '/packages' },
];


export default function ExploreFilter() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex justify-around border-b border-gray-200 py-2 bg-white">
      {categories.map((cat, i) => {
        const Icon = cat.icon;
        const isActive = location.pathname === cat.path;

        return (
          <button
            key={i}
            onClick={() => navigate(cat.path)}
            className={`flex flex-col items-center text-xs transition ${
              isActive ? 'text-primary-700 font-semibold' : 'text-secondary-500'
            }`}
          >
            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary-700' : 'text-secondary-500'}`} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
