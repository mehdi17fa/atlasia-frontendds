import React, { useState, useRef, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import { AuthContext } from "../../context/AuthContext";
import { getValidToken, checkTokenStatus } from "../../utils/authUtils";
import NavigationButton from "../../components/shared/NavigationButtons";
import { FaArrowLeft, FaUser } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL;

const cities = [
  "Ifrane",
  "Fès",
  "Marrakech",
  "Casablanca",
  "Rabat",
  "Agadir",
  "Tanger",
];

const stepOrder = [
  { key: "localisation", label: "Localisation", to: "/property-localisation" },
  { key: "propertyType", label: "Type de propriété", to: "/property-type" },
  { key: "info", label: "Informations", to: "/property-info" },
  { key: "equipments", label: "Equipements", to: "/property-equipments" },
  { key: "photos", label: "Photos", to: "/property-photos" },
  { key: "title", label: "Titre", to: "/property-title" },
  { key: "description", label: "Description", to: "/property-description" },
  { key: "price", label: "Prix", to: "/property-price" },
  { key: "documents", label: "Documents légaux", to: "/property-documents" },
];

export default function AddProperty() {
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRef = useRef(null);

  const { propertyData, setPropertyData, clearPropertyData } = usePropertyCreation();
  const { city = "", address = "", postalCode = "" } = propertyData.localisation || {};

  const authContext = useContext(AuthContext) || {};
  const { user, token } = authContext;
  
  // Enhanced token handling
  const authToken = getValidToken(authContext);

  const [showError, setShowError] = useState(false);
  const [animateError, setAnimateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Effect to check if we should clear old property data
  useEffect(() => {
    // If user comes from owner dashboard or my-properties, clear old data
    const searchParams = new URLSearchParams(location.search);
    const shouldClear = searchParams.get('new') === 'true' || 
                       location.state?.clearData === true;
    
    if (shouldClear && (propertyData.propertyId || propertyData.localisation)) {
      console.log("🧹 Auto-clearing property data for fresh start");
      clearPropertyData();
    }
  }, [location, propertyData.propertyId, propertyData.localisation, clearPropertyData]);

  const handleChange = (field, value) => {
    setPropertyData((prev) => ({
      ...prev,
      localisation: {
        ...(prev.localisation || { city: "", address: "", postalCode: "" }),
        [field]: value,
      },
    }));
  };

  const handleNext = async () => {
    // Basic required fields check
    if (!city || !address || !postalCode) {
      setShowError(true);
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 700);
      return;
    }

    if (!authToken) {
      // Debug token status
      const tokenStatus = checkTokenStatus(authContext);
      console.log("🚨 No valid token found:", tokenStatus);
      
      setApiError("Veuillez vous connecter pour continuer.");
      setShowError(true);
      return;
    }

    setShowError(false);
    setApiError("");
    setSubmitting(true);

    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      };

      const body = {
        localisation: { city, address, postalCode },
      };

      let res;

      // If we already have a propertyId, update the localisation (user revisiting)
      if (propertyData.propertyId) {
        res = await axios.patch(
          `${API_BASE}/api/property/${propertyData.propertyId}/localisation`,
          body,
          { headers }
        );
      } else {
        // First time here → create the property
        res = await axios.post(`${API_BASE}/api/property`, body, { headers });
      }

      const property = res?.data?.property;

      // Persist propertyId + step data in context
      setPropertyData((prev) => ({
        ...prev,
        propertyId: property?._id || prev.propertyId,
        localisation: property?.localisation || body.localisation,
        stepsCompleted: {
          ...(prev.stepsCompleted || {}),
          localisation: true,
        },
      }));

      // Move to next step and prevent going back to this one
      navigate("/property-type", { replace: true });
    } catch (err) {
      // Prefer express-validator format, else generic message
      const msg =
        err?.response?.data?.errors?.[0]?.msg ||
        err?.response?.data?.message ||
        "Une erreur est survenue. Réessayez.";
      setApiError(msg);
      setShowError(true);
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 700);
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepKey = "localisation";
  const currentStepIndex = stepOrder.findIndex((s) => s.key === currentStepKey);
  const stepsAfter = stepOrder.slice(currentStepIndex + 1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

            {/* Center: Atlasia Branding */}
            <div className="text-center">
              <div className="font-bold text-green-700 text-2xl">
                Atlasia
              </div>
            </div>

            {/* Right: Account Icon */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-10 h-10 bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors font-semibold text-sm"
            >
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mt-6 mb-2 px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-4">
          <div className="mb-4">
            {stepOrder.slice(0, currentStepIndex).map((step) =>
              propertyData.stepsCompleted?.[step.key] ? (
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

          <h2 className="text-green-800 text-lg font-bold text-center mb-1">Etape 1:</h2>
          <h3 className="text-black text-xl font-bold text-center mb-4">Localisation</h3>
          
          {/* Check if there's existing data and offer to start fresh */}
          {(propertyData.localisation || propertyData.propertyType || propertyData.propertyId) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-blue-800 text-sm">
                  📝 Données de propriété précédente détectées
                </p>
                <button
                  onClick={() => {
                    clearPropertyData();
                    // Refresh the current values
                    window.location.reload();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                  Recommencer
                </button>
              </div>
            </div>
          )}

          {/* Ville */}
          <div className="mb-4">
            <label className="block text-green-800 font-semibold mb-1">
              Ville<span className="text-red-500"> *</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none"
              value={city}
              onChange={(e) => handleChange("city", e.target.value)}
            >
              <option value="" disabled hidden>
                Choisir la ville
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Adresse */}
          <div className="mb-4">
            <label className="block text-green-800 font-semibold mb-1">
              Adresse<span className="text-red-500"> *</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none"
              placeholder="Entre l’adresse"
              value={address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          {/* Code postal */}
          <div className="mb-2">
            <label className="block text-green-800 font-semibold mb-1">
              Code postal<span className="text-red-500"> *</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none"
              placeholder="Entre le code postal"
              value={postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
            />
          </div>

          {/* API error */}
          {apiError && (
            <div className="text-red-600 text-sm mt-2">{apiError}</div>
          )}

          {/* Suivant Button */}
          <button
            ref={buttonRef}
            className={`w-full mt-4 bg-green-800 text-white rounded-full py-3 font-semibold text-lg transition
              hover:bg-green-900 disabled:opacity-60 disabled:cursor-not-allowed
              ${animateError ? "animate-shake bg-red-600" : ""}
            `}
            disabled={submitting}
            onClick={handleNext}
            style={{ transition: "background 1s" }}
          >
            {submitting ? "Enregistrement..." : "Suivant"}
          </button>

          {showError && !apiError && (
            <label className="block text-red-500 text-xs mt-2 font-normal text-center">
              Les champs marqués d'un astérisque (*) sont obligatoires.
            </label>
          )}
        </div>

        {/* Completed steps after current, below Suivant */}
        <div className="mt-4 flex flex-col gap-2">
          {stepsAfter.map((step) =>
            propertyData.stepsCompleted?.[step.key] ? (
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
  );
}
