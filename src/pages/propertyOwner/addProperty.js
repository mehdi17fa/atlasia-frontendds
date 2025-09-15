import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import { AuthContext } from "../../context/AuthContext";
import NavigationButton from "../../components/shared/NavigationButtons";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

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
  const buttonRef = useRef(null);

  const { propertyData, setPropertyData } = usePropertyCreation();
  const { city = "", address = "", postalCode = "" } = propertyData.localisation || {};

  const { user } = useContext(AuthContext) || {};
  const authToken =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    user?.accessToken ||
    user?.token;

  const [showError, setShowError] = useState(false);
  const [animateError, setAnimateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

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
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mt-6 mb-2 px-4">
        <h1 className="text-green-800 text-2xl font-bold text-center mb-2">Atlasia</h1>
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
          <h3 className="text-black text-xl font-bold text-center mb-6">Localisation</h3>

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
