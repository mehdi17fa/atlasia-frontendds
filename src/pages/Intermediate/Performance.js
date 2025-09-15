import React from 'react';
import { FaArrowLeft, FaStar } from 'react-icons/fa';

const Performance = () => {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-4">
      {/* Header */}
      <div className="text-center font-bold text-green-700 text-3xl m-6">
        Atlasia
      </div>

      {/* Title + Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Performance de M. Ezzaim</h2>
      </div>


      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-100 p-4 rounded transition-transform hover:shadow-md hover:bg-green-300  hover:scale-[1.02]">
          <p className="text-sm text-gray-700">Propriétés Gérées</p>
          <p className="text-lg font-semibold">7</p>
        </div>
        <div className="bg-gray-100 p-4 rounded transition-transform hover:shadow-md hover:bg-green-300  hover:scale-[1.02]">

          <p className="text-sm text-gray-700">Reservation du mois</p>
          <p className="text-lg font-semibold">14</p>
        </div>
        <div className="bg-gray-100 p-4 rounded transition-transform hover:shadow-md hover:bg-green-300  hover:scale-[1.02]">
          <p className="text-sm text-gray-700">Revenu Total</p>
          <p className="text-lg font-bold">12 000 MAD</p>
        </div>
        <div className="bg-gray-100 p-4 rounded transition-transform hover:shadow-md hover:bg-green-300  hover:scale-[1.02]">
          <p className="text-sm text-gray-700">Taux d'occupation</p>
          <p className="text-lg font-semibold">75%</p>
        </div>
      </div>


      {/* Rating */}
      <div className="flex items-center mt-6 gap-1">
        {[...Array(4)].map((_, i) => (
          <FaStar key={i} className="text-yellow-400" />
        ))}
        <FaStar className="text-yellow-400 opacity-100" />
        <span className="ml-2 font-medium">5 sur 5</span>
      </div>

      {/* Reservations */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Avis Clients</h2>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {/* Feedback 1 */}
          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center mb-1">
              <p className="font-medium text-gray-800">Fatima Z.</p>
              <div className="ml-2 text-yellow-400 text-sm">★★★★★</div>
            </div>
            <p className="text-sm text-gray-600">Très bon service, je recommande fortement !</p>
          </div>

          {/* Feedback 2 */}
          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center mb-1">
              <p className="font-medium text-gray-800">Mohamed A.</p>
              <div className="ml-2 text-yellow-400 text-sm">★★★★☆</div>
            </div>
            <p className="text-sm text-gray-600">Bonne communication et bon suivi.</p>
          </div>

          {/* Feedback 3 */}
          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center mb-1">
              <p className="font-medium text-gray-800">Salma R.</p>
              <div className="ml-2 text-yellow-400 text-sm">★★★★★</div>
            </div>
            <p className="text-sm text-gray-600">Service rapide et efficace. Merci !</p>
          </div>

          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center mb-1">
              <p className="font-medium text-gray-800">Akram Ezzaim</p>
              <div className="ml-2 text-yellow-400 text-sm">★★★★★</div>
            </div>
            <p className="text-sm text-gray-600">chi haja lkher lahoma barik hhhhh </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Performance;