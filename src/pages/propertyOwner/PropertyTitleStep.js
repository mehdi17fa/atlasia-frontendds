import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import { AuthContext } from "../../context/AuthContext";
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

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const currentStepKey = "title";
const currentStepIndex = stepOrder.findIndex((step) => step.key === currentStepKey);
const stepsAfter = stepOrder.slice(currentStepIndex + 1);

export default function PropertyTitleStep() {
  const navigate = useNavigate();
  const { propertyData, setPropertyData } = usePropertyCreation();
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState(propertyData.title || "");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => setTitle(e.target.value.slice(0, 25));

  const handleNext = async () => {
    if (!title) return;

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
      const body = { title };

      const res = await axios.patch(
        `${API_BASE}/api/property/${propertyData.propertyId}/title`,
        body,
        { headers }
      );

      const updatedTitle = res?.data?.property?.title || title;

      setPropertyData((prev) => ({
        ...prev,
        title: updatedTitle,
        stepsCompleted: { ...(prev.stepsCompleted || {}), title: true },
      }));

      navigate("/property-description");
    } catch (err) {
      console.error("Title update error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        "Erreur lors de l'enregistrement du titre.";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Progress bar */}
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

      {/* Step 6 */}
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-4">
          <h2 className="text-green-800 text-lg font-bold text-center mb-1">Etape 6:</h2>
          <h3 className="text-black text-xl font-bold text-center mb-2">
            Attribuer un titre à votre annonce
          </h3>
          <p className="text-center text-gray-700 mb-4">Vous pourrez toujours le modifier plus tard!</p>

          <textarea
            className="w-full border-2 border-green-800 rounded-xl px-4 py-3 text-gray-700 focus:outline-none resize-none text-lg mb-2"
            rows={4}
            maxLength={25}
            value={title}
            onChange={handleChange}
            placeholder="Titre de l'annonce"
          />
          <div className="text-xs text-gray-500 mb-4 text-right">{title.length}/25</div>

          {apiError && <div className="text-red-600 text-sm mb-2">{apiError}</div>}

          <button
            className="w-full bg-green-800 text-white rounded-full py-3 font-semibold text-lg hover:bg-green-900 transition"
            disabled={!title || submitting}
            onClick={handleNext}
          >
            {submitting ? "Enregistrement..." : "Suivant"}
          </button>
        </div>

        {/* Completed steps after current */}
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
