import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import { AuthContext } from "../../context/AuthContext";
import NavigationButton from "../../components/shared/NavigationButtons";

// Icons
import { ReactComponent as AppartementIconBlack } from "../../assets/icons/Properties/appartementBlack.svg";
import { ReactComponent as AppartementIconGreen } from "../../assets/icons/Properties/appartementGreen.svg";
import { ReactComponent as VillaIconBlack } from "../../assets/icons/Properties/villaBlack.svg";
import { ReactComponent as VillaIconGreen } from "../../assets/icons/Properties/villaGreen.svg";
import { ReactComponent as ChaletIconBlack } from "../../assets/icons/Properties/chaletBlack.svg";
import { ReactComponent as ChaletIconGreen } from "../../assets/icons/Properties/chaletGreen.svg";
import { ReactComponent as StudioIconBlack } from "../../assets/icons/Properties/studioBlack.svg";
import { ReactComponent as StudioIconGreen } from "../../assets/icons/Properties/studioGreen.svg";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const propertyTypes = [
  { label: "Appartement", iconActive: AppartementIconGreen, iconInactive: AppartementIconBlack },
  { label: "Villa", iconActive: VillaIconGreen, iconInactive: VillaIconBlack },
  { label: "Chalet", iconActive: ChaletIconGreen, iconInactive: ChaletIconBlack },
  { label: "Studio / Chambre", iconActive: StudioIconGreen, iconInactive: StudioIconBlack },
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

export default function PropertyTypeStep() {
  const navigate = useNavigate();
  const { propertyData, setPropertyData } = usePropertyCreation();
  const { user } = useContext(AuthContext) || {};

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const selected = propertyTypes.findIndex((t) => t.label === propertyData.propertyType);
  const currentStepKey = "propertyType";
  const currentStepIndex = stepOrder.findIndex((step) => step.key === currentStepKey);
  const stepsAfter = stepOrder.slice(currentStepIndex + 1);

  const handleSelect = (idx) => {
    setPropertyData((prev) => ({
      ...prev,
      propertyType: propertyTypes[idx].label,
    }));
  };

  const handleNext = async () => {
    if (selected === null) return;

    const authToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      user?.accessToken ||
      user?.token;

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
      const headers = { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" };
      const body = { propertyType: propertyTypes[selected].label };

      const res = await axios.patch(
        `${API_BASE}/api/property/${propertyData.propertyId}/propertyType`,
        body,
        { headers }
      );

      const property = res?.data?.property;

      setPropertyData((prev) => ({
        ...prev,
        propertyType: property?.propertyType || body.propertyType,
        stepsCompleted: { ...(prev.stepsCompleted || {}), propertyType: true },
      }));

      navigate("/property-info", { replace: true });
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

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <div className="w-full max-w-md mx-auto px-4 pt-4">
        {stepOrder.slice(0, currentStepIndex).map((step) =>
          propertyData.stepsCompleted?.[step.key] ? (
            <NavigationButton key={step.key} left={step.label} right="✓" to={step.to} active={false} />
          ) : null
        )}
      </div>

      <div className="w-full max-w-md mx-auto mt-4 px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-4">
          <h2 className="text-green-800 text-lg font-bold text-center mb-1">Etape 2:</h2>
          <h3 className="text-black text-xl font-bold text-center mb-6">Type de propriété</h3>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {propertyTypes.map((type, idx) => {
              const Icon = selected === idx ? type.iconActive : type.iconInactive;
              const textColor = selected === idx ? "text-green-800" : "text-[#222]";
              return (
                <button
                  key={type.label}
                  onClick={() => handleSelect(idx)}
                  className={`border-2 rounded-xl p-4 flex flex-col items-center transition-all duration-300 ${
                    selected === idx ? "border-green-800 bg-green-50" : "border-green-800 bg-white"
                  }`}
                >
                  <Icon className="w-12 h-12 mx-auto mb-2 transition-all duration-300" />
                  <span className={`font-semibold ${textColor}`}>{type.label}</span>
                </button>
              );
            })}
          </div>

          {apiError && <div className="text-red-600 text-sm mb-2">{apiError}</div>}

          <button
            className="w-full bg-green-800 text-white rounded-full py-3 font-semibold text-lg hover:bg-green-900"
            disabled={selected === null || submitting}
            onClick={handleNext}
          >
            {submitting ? "Enregistrement..." : "Suivant"}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {stepsAfter.map((step) =>
            propertyData.stepsCompleted?.[step.key] ? (
              <NavigationButton key={step.key} left={step.label} right="✓" to={step.to} active={false} />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
