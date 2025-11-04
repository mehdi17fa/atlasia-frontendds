import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function IdentificationModal({ onClose }) {
  const navigate = useNavigate();

  const handleProfileSelect = async (profileType) => {
    try {
      const email = localStorage.getItem("signupEmail"); // store email from first step
      if (!email) {
        alert("E-mail non trouvé. Veuillez revenir en arrière et recommencer l'inscription.");
        return;
      }

      // Correct backend URL
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/set-role`, { 
        email, 
        role: profileType.toLowerCase() 
      });

      console.log("Role saved:", res.data);
      navigate(`/complete-profile?type=${profileType.toLowerCase()}`);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Échec de la sauvegarde du rôle. Veuillez réessayer.");
    }
  };

  const handleClose = () => {
    navigate(-1);
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
              <h1 className="text-2xl font-bold text-black text-center">S'inscrire</h1>
            </div>

            <div className="h-1 w-full bg-gray-300 relative mb-6">
              <div className="absolute top-0 left-0 h-1 w-full bg-green-800" />
            </div>

            <div className="flex flex-col items-center mb-8">
              <h2 className="text-3xl font-bold text-green-800 text-center mb-4">Identification</h2>
              <p className="text-gray-700 text-lg text-center px-4">Veuillez sélectionner votre type de profil :</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-4 w-full flex-wrap">
              {[
                { value: "tourist", label: "Touriste", icon: null },
                { value: "owner", label: "Propriétaire", icon: null },
                { value: "intermediate", label: "Intermédiaire", icon: null },
                { value: "b2b", label: "B2B", icon: BuildingOfficeIcon }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleProfileSelect(type.value)}
                  className="border-2 border-green-800 rounded-lg py-6 px-6 w-full sm:w-32 lg:w-36 h-32 sm:h-36 lg:h-40 flex flex-col items-center justify-center hover:bg-green-800 hover:text-white transition-colors group focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-opacity-50"
                >
                  {type.icon && (
                    <type.icon className="w-8 h-8 mb-2 text-green-800 group-hover:text-white" />
                  )}
                  <span className="text-green-800 text-lg font-semibold group-hover:text-white text-center">
                    {type.label}
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