import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavigationButton from "../../components/shared/NavigationButtons";

// Dummy restaurants data, replace with your real data or props
const restaurants = [
  {
    id: 1,
    name: "Foodle Restaurants",
    location: "Ifrane - Downtown",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=80&q=80"
  },
  {
    id: 2,
    name: "Lyn Restaurant",
    location: "Ifrane - Downtown",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=80&q=80"
  }
];

const stepOrder = [
  { key: "date", label: "Date", to: "/create-package" },
  { key: "property", label: "Propriété", to: "/select-property" },
  { key: "activities", label: "Type de pack", to: "/create-package/activities" },
  // Add more steps as needed
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

export default function ActivitiesStep() {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, property } = location.state || {};
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [stepsCompleted, setStepsCompleted] = useState({ 
    date: true, 
    property: true, 
    activities: false 
  });

  const handleNext = () => {
    if (selectedRestaurants.length > 0) {
      setStepsCompleted((prev) => ({ ...prev, activities: true }));
      navigate("/create-package/next-step", {
        state: { date, property, restaurants: selectedRestaurants }
      });
    }
  };

  const toggleRestaurant = (restaurant) => {
    setSelectedRestaurants(prev => 
      prev.some(r => r.id === restaurant.id)
        ? prev.filter(r => r.id !== restaurant.id)
        : [...prev, restaurant]
    );
  };

  const currentStepKey = "activities";
  const currentStepIndex = stepOrder.findIndex((step) => step.key === currentStepKey);
  const stepsAfter = stepOrder.slice(currentStepIndex + 1);

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
        
        {/* Date and Property summary */}
        <div className="w-full rounded-xl border px-4 py-2 mb-2 flex flex-col gap-2 bg-white font-medium">
          <div className="flex items-center">
            <span className="text-gray-600">Date</span>
            <span className="flex-1 text-right text-black">
              {formatDateRange(date)}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">Propriété</span>
            <span className="flex-1 text-right text-black">
              {property?.name}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mt-2">
          <h2 className="text-green-800 text-center text-lg font-bold mb-1">
            Etape 3: <span className="text-black">Type de pack</span>
          </h2>
          
          {/* Categories */}
          <div className="flex justify-center gap-4 mb-4">
            <button className="text-green-800 font-medium border-b-2 border-green-800 pb-1">
              Restaurants
            </button>
            <button className="text-gray-500 font-medium">
              Activités
            </button>
            <button className="text-gray-500 font-medium">
              Services
            </button>
          </div>

          {/* Restaurants list */}
          <div className="flex flex-col gap-3 mb-6">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => toggleRestaurant(restaurant)}
                className={`flex items-center w-full rounded-xl border px-2 py-2 transition
                  ${selectedRestaurants.some(r => r.id === restaurant.id)
                    ? "border-green-800 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"}
                `}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="text-left">
                    <div className="font-semibold">{restaurant.name}</div>
                    <div className="text-gray-500 text-sm">{restaurant.location}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            className={`w-full rounded-full py-2 font-semibold text-lg transition ${
              selectedRestaurants.length > 0
                ? "bg-green-800 text-white hover:bg-green-900"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={selectedRestaurants.length === 0}
            onClick={handleNext}
          >
            Suivant
          </button>

          {/* Completed steps after current */}
          <div className="mt-4 flex flex-col gap-2">
            {stepsAfter.map((step) =>
              stepsCompleted[step.key] ? (
                <NavigationButton
                  key={step.key}
                  left={step.label}
                  right="✓"
                  to={step.to}
                  active={false}
                />
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}