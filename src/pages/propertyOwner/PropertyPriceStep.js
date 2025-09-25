import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import { AuthContext } from "../../context/AuthContext";

import EditIcon from "../../assets/icons/edit.svg";
import NavigationButton from "../../components/shared/NavigationButtons";

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

const API_BASE = process.env.REACT_APP_API_URL;

const currentStepKey = "price";
const currentStepIndex = stepOrder.findIndex((step) => step.key === currentStepKey);
const stepsAfter = stepOrder.slice(currentStepIndex + 1);

export default function PropertyPriceStep() {
  const navigate = useNavigate();
  const { propertyData, setPropertyData } = usePropertyCreation();
  const { user } = useContext(AuthContext);

  const [editType, setEditType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const weekInputRef = useRef(null);
  const weekendInputRef = useRef(null);

  const priceWeek = propertyData.priceWeek ?? 0;
  const priceWeekend = propertyData.priceWeekend ?? 0;

  useEffect(() => {
    if (editType === "week" && weekInputRef.current) {
      weekInputRef.current.focus();
      weekInputRef.current.select();
    }
    if (editType === "weekend" && weekendInputRef.current) {
      weekendInputRef.current.focus();
      weekendInputRef.current.select();
    }
  }, [editType]);

  const handlePriceChange = (type, value) => {
    let val = value ?? 0;
    val = Math.max(0, Math.min(99999, val));

    setPropertyData((prev) => ({
      ...prev,
      priceWeek: type === "week" ? val : prev.priceWeek,
      priceWeekend: type === "weekend" ? val : prev.priceWeekend,
    }));
  };

  const handleNext = async () => {
    if (priceWeek <= 0 || priceWeekend <= 0) return;

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
      const body = {
        price: {
          weekdays: priceWeek,
          weekend: priceWeekend,
        },
      };

      const res = await axios.patch(
        `${API_BASE}/api/property/${propertyData.propertyId}/price`,
        body,
        { headers }
      );

      setPropertyData((prev) => ({
        ...prev,
        priceWeek: res?.data?.price?.weekdays ?? priceWeek,
        priceWeekend: res?.data?.price?.weekend ?? priceWeekend,
        stepsCompleted: { ...(prev.stepsCompleted || {}), price: true },
      }));

      navigate("/property-documents");
    } catch (err) {
      console.error("Failed to update property price:", err.response || err);
      const msg =
        err?.response?.data?.message || "Erreur lors de l'enregistrement du prix.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Completed steps before current */}
      <div className="w-full max-w-md mx-auto px-4 pt-4">
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

      {/* Step 8 */}
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-4">
          <h2 className="text-green-800 text-lg font-bold text-center mb-1">Etape 8:</h2>
          <h3 className="text-black text-xl font-bold text-center mb-2">Définir le prix</h3>
          <p className="text-center text-gray-700 mb-4">
            Fixez un tarif de base pour{" "}
            <span className="text-green-800 font-semibold">les jours de semaine</span> et{" "}
            <span className="text-green-800 font-semibold">les week-ends</span>
          </p>

          {/* Weekday price */}
          <div className="flex flex-col items-center mb-6">
            <span className="text-green-800 font-semibold mb-1">Prix jours de semaine</span>
            {editType === "week" ? (
              <input
                ref={weekInputRef}
                type="number"
                min={0}
                max={99999}
                className="text-center text-3xl font-bold border-b-2 border-green-800 outline-none w-40 mb-2"
                value={priceWeek}
                onChange={(e) => handlePriceChange("week", e.target.valueAsNumber)}
                onBlur={() => setEditType(null)}
              />
            ) : (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditType("week")}>
                <span className="text-4xl font-bold">{priceWeek} MAD</span>
                <img src={EditIcon} alt="Editer" className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Weekend price */}
          <div className="flex flex-col items-center mb-6">
            <span className="text-green-800 font-semibold mb-1">Prix week-end</span>
            {editType === "weekend" ? (
              <input
                ref={weekendInputRef}
                type="number"
                min={0}
                max={99999}
                className="text-center text-3xl font-bold border-b-2 border-green-800 outline-none w-40 mb-2"
                value={priceWeekend}
                onChange={(e) => handlePriceChange("weekend", e.target.valueAsNumber)}
                onBlur={() => setEditType(null)}
              />
            ) : (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditType("weekend")}>
                <span className="text-4xl font-bold">{priceWeekend} MAD</span>
                <img src={EditIcon} alt="Editer" className="w-6 h-6" />
              </div>
            )}
          </div>

          {apiError && <div className="text-red-600 text-sm mb-2">{apiError}</div>}

          <button
            className="w-full bg-green-800 text-white rounded-full py-3 font-semibold text-lg hover:bg-green-900 transition"
            disabled={priceWeek <= 0 || priceWeekend <= 0 || submitting}
            onClick={handleNext}
          >
            {submitting ? "Enregistrement..." : "Suivant"}
          </button>
        </div>

        {/* Completed steps after current */}
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
