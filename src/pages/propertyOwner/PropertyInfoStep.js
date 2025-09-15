import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import { AuthContext } from "../../context/AuthContext";
import NavigationButton from "../../components/shared/NavigationButtons";

// Icons
import { ReactComponent as GuestsIcon } from "../../assets/icons/Properties/guests.svg";
import { ReactComponent as RoomsIcon } from "../../assets/icons/Properties/rooms.svg";
import { ReactComponent as BedsIcon } from "../../assets/icons/Properties/beds.svg";
import { ReactComponent as BathsIcon } from "../../assets/icons/Properties/baths.svg";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const infoTypes = [
  { label: "Invités", icon: GuestsIcon, key: "guests", min: 1 },
  { label: "Chambres", icon: RoomsIcon, key: "bedrooms", min: 0 }, // <- changed key to 'bedrooms'
  { label: "Lits", icon: BedsIcon, key: "beds", min: 0 },
  { label: "Salles de bain", icon: BathsIcon, key: "bathrooms", min: 0 },
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

const currentStepKey = "info";

export default function PropertyInfoStep() {
  const navigate = useNavigate();
  const { propertyData, setPropertyData } = usePropertyCreation();
  const { user } = useContext(AuthContext) || {};

  const authToken =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    user?.accessToken ||
    user?.token;

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const info = propertyData.info || { guests: 1, bedrooms: 1, beds: 1, baths: 1 };

  const handleChange = (key, delta, min) => {
    setPropertyData((prev) => ({
      ...prev,
      info: {
        ...prev.info,
        [key]: Math.max(min, (prev.info?.[key] || min) + delta),
      },
    }));
  };

  const handleNext = async () => {
    if (!authToken) {
      setApiError("Veuillez vous connecter pour continuer.");
      return;
    }

    if (!propertyData.propertyId) {
      setApiError("Aucune propriété trouvée. Retournez à l'étape 1.");
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      };

      const body = { info };

      const res = await axios.patch(
        `${API_BASE}/api/property/${propertyData.propertyId}/info`,
        body,
        { headers }
      );

      const property = res?.data?.property;

      // Update context
      setPropertyData((prev) => ({
        ...prev,
        info: property?.info || body.info,
        stepsCompleted: { ...(prev.stepsCompleted || {}), info: true },
      }));

      // Navigate to next step
      navigate("/property-equipments", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.msg ||
        err?.response?.data?.message ||
        "Erreur lors de l'enregistrement.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepsCompleted = propertyData.stepsCompleted || {};
  const currentStepIndex = stepOrder.findIndex(
    (step) => step.key === currentStepKey
  );
  const stepsAfter = stepOrder.slice(currentStepIndex + 1);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <div className="w-full max-w-md mx-auto px-4 pt-4">
        {stepOrder.slice(0, currentStepIndex).map((step) =>
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

      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-4">
          <h2 className="text-green-800 text-lg font-bold text-center mb-1">
            Etape 3:
          </h2>
          <h3 className="text-black text-xl font-bold text-center mb-6">
            Informations
          </h3>

          <div className="flex flex-col gap-5 mb-8">
            {infoTypes.map(({ label, icon: Icon, key, min }) => (
              <div key={key} className="flex items-center gap-3">
                <Icon className="w-8 h-8 text-green-800" />
                <span className="flex-1 font-semibold text-lg text-green-800">
                  {label}
                </span>
                <button
                  className="w-8 h-8 rounded-full bg-green-800 text-white text-xl flex items-center justify-center"
                  onClick={() => handleChange(key, -1, min)}
                  disabled={info[key] <= min}
                >
                  –
                </button>
                <span className="w-6 text-center font-bold text-lg">
                  {info[key]}
                </span>
                <button
                  className="w-8 h-8 rounded-full bg-green-800 text-white text-xl flex items-center justify-center"
                  onClick={() => handleChange(key, 1, min)}
                >
                  +
                </button>
              </div>
            ))}
          </div>

          {apiError && (
            <div className="text-red-600 text-sm mb-2">{apiError}</div>
          )}

          <button
            className="w-full bg-green-800 text-white rounded-full py-3 font-semibold text-lg hover:bg-green-900 transition"
            onClick={handleNext}
            disabled={submitting}
          >
            {submitting ? "Enregistrement..." : "Suivant"}
          </button>
        </div>

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
  );
}
