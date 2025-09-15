import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Dummy properties, replace with your real data or props
const properties = [
  {
    id: 1,
    name: "Appart. Zephire",
    location: "Ifrane - Downtown",
    price: 360,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80"
  },
  {
    id: 2,
    name: "Villa Makarska",
    location: "Ifrane - Downtown",
    price: 360,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=80&q=80"
  }
];

function formatDateRange(dateRange) {
  if (!dateRange) return "";
  const options = { day: "2-digit", month: "short", year: "numeric" };
  if (Array.isArray(dateRange) && dateRange.length === 2) {
    const [start, end] = dateRange;
    return (
      start.toLocaleDateString("fr-FR", options) +
      " - " +
      end.toLocaleDateString("fr-FR", options)
    );
  }
  if (dateRange instanceof Date) {
    return dateRange.toLocaleDateString("fr-FR", options);
  }
  return "";
}

export default function SelectPropertyStep() {
  const location = useLocation();
  const navigate = useNavigate();
  // Get date from previous step (could be a single date or [start, end])
  const date = location.state?.date;

  const [selectedProperty, setSelectedProperty] = useState(null);

  const handleNext = () => {
    if (selectedProperty) {
      // Pass selected property and date to the next step
      navigate("/activities", {
        state: { date, property: selectedProperty }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md mx-auto pt-4 pb-2 px-4">
        <div className="flex items-center mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-green-800 text-2xl mr-2"
          >
            &#8592;
          </button>
          <span className="text-green-800 font-bold text-xl">Atlasia</span>
        </div>
        {/* Date summary */}
        <div className="w-full rounded-xl border px-4 py-2 mb-4 flex items-center gap-2 bg-white font-medium">
          <span className="text-gray-600">Date</span>
          <span className="flex-1 text-right text-black">
            {formatDateRange(date)}
          </span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 mt-2">
          <h2 className="text-green-800 text-center text-lg font-bold mb-1">
            Etape 2: <span className="text-black">Propriété</span>
          </h2>
          <p className="text-center text-gray-700 mb-4 font-medium">
            Selectionner une de vos Propriétés:
          </p>
          <div className="flex flex-col gap-3 mb-6">
            {properties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className={`flex items-center justify-between w-full rounded-xl border px-2 py-2 transition
                  ${selectedProperty?.id === prop.id
                    ? "border-green-800 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"}
                `}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={prop.image}
                    alt={prop.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="text-left">
                    <div className="font-semibold">{prop.name}</div>
                    <div className="text-gray-500 text-sm">{prop.location}</div>
                  </div>
                </div>
                <div className="text-green-900 font-bold text-base whitespace-nowrap">
                  {prop.price} MAD
                </div>
              </button>
            ))}
          </div>
          <button
            className={`w-full rounded-full py-2 font-semibold text-lg transition ${
              selectedProperty
                ? "bg-green-800 text-white hover:bg-green-900"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!selectedProperty}
            onClick={handleNext}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}