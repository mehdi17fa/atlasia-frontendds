import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function IdentificationModal({ onClose }) {
  const navigate = useNavigate();

  const handleProfileSelect = async (profileType) => {
    try {
      const email = localStorage.getItem("signupEmail"); // store email from first step
      if (!email) {
        alert("Email not found. Please go back and restart signup.");
        return;
      }

      // Correct backend URL
      const res = await axios.post("http://localhost:4000/api/auth/set-role", { 
        email, 
        role: profileType.toLowerCase() 
      });

      console.log("Role saved:", res.data);
      navigate(`/complete-profile?type=${profileType.toLowerCase()}`);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to save role. Please try again.");
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center justify-start px-6 py-8">
            
            <div className="w-full mb-4 relative">
              <button onClick={handleClose} className="text-2xl hover:opacity-70 absolute -top-2 -right-2 text-gray-600">
                ✕
              </button>
              <h1 className="text-2xl font-bold text-black text-center">Sign up</h1>
            </div>

            <div className="h-1 w-full bg-gray-300 relative mb-6">
              <div className="absolute top-0 left-0 h-1 w-full bg-green-800" />
            </div>

            <div className="flex flex-col items-center mb-8">
              <h2 className="text-3xl font-bold text-green-800 text-center mb-4">Identification</h2>
              <p className="text-gray-700 text-lg text-center px-4">Please select your profile type:</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-4 w-full">
              {["tourist", "owner", "partner"].map((type) => (
                <button
                  key={type}
                  onClick={() => handleProfileSelect(type)}
                  className="border-2 border-green-800 rounded-lg py-6 px-6 w-full sm:w-32 lg:w-36 h-32 sm:h-36 lg:h-40 flex flex-col items-center justify-center hover:bg-green-800 hover:text-white transition-colors group focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-opacity-50"
                >
                  <span className="text-green-800 text-lg font-semibold group-hover:text-white text-center capitalize">
                    {type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}