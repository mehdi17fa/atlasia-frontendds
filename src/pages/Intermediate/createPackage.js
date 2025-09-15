import React, { useState } from "react";
import Calendar from "../../components/shared/Calendar";
import { useNavigate } from "react-router-dom";

export default function CreatePackage() {
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const handleNext = () => {
    if (selectedDate) {
      // Save the date to context or state as needed
      // Then go to the next step (e.g., activities selection)
      navigate("/select-property", { state: { date: selectedDate } });
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
        <div className="bg-white rounded-xl shadow p-4 mt-2">
          <h2 className="text-green-800 text-center text-lg font-bold mb-1">
            Etape 1: <span className="text-black">Date</span>
          </h2>
          <p className="text-center text-gray-700 mb-4 font-medium">
            Sélectionner une date:
          </p>
          <div className="flex justify-center mb-6">
            <Calendar value={selectedDate} onChange={setSelectedDate} mode="range" />
          </div>
          <button
            className={`w-full rounded-full py-2 font-semibold text-lg transition ${
              selectedDate && Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]
                ? "bg-green-800 text-white hover:bg-green-900"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!(selectedDate && Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1])}
            onClick={handleNext}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}