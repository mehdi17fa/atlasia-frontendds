// components/explore/SearchBar.js
import React from 'react';
import { ReactComponent as SearchIcon } from '../../assets/icons/search.svg';
import { ReactComponent as FilterIcon } from '../../assets/icons/filter.svg';

export default function SearchBar({ onClick }) {
  return (
    <div className="px-4 py-3">
      <div 
        className="bg-white rounded-full shadow flex items-center px-4 py-2 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <SearchIcon className="w-5 h-5 mr-3 text-gray-700" />
        <input
          type="text"
          placeholder="Atlasia  •  Any week  •  Add guests"
          className="flex-1 text-sm text-gray-700 focus:outline-none pointer-events-none"
          readOnly
        />
        <FilterIcon className="w-5 h-5 text-green-800" />
      </div>
    </div>
  );
}