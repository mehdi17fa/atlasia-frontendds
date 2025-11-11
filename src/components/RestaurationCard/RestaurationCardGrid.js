// components/Restauration/RestaurationCardGrid.js
import React from 'react';
import RestaurationCard from './RestaurationCard';

export default function RestaurationCardGrid({ title, listings, onServiceClick }) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-green-900 mb-2">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {listings.map((item, i) => (
          <div 
            key={item._id || i} 
            onClick={() => item.isB2BService && onServiceClick ? onServiceClick(item) : null}
            className={item.isB2BService && onServiceClick ? 'cursor-pointer' : ''}
          >
            <RestaurationCard data={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
