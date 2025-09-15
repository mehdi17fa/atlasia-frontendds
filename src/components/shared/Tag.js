import React from 'react';

export default function Tag({ text }) {
  return (
    <div className="absolute top-2 left-2 bg-white text-green-800 text-sm font-semibold px-3 py-1 rounded-lg shadow">
      {text}
    </div>
  );
}
