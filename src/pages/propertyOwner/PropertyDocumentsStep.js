import React, { useRef, useState, useContext } from "react";
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

export default function PropertyDocumentsStep() {
  const navigate = useNavigate();
  const { propertyData, setPropertyData } = usePropertyCreation();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [apiError, setApiError] = useState("");

  const documents = propertyData.documents || [];

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setPropertyData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), ...files],
    }));
  };

  const handleRemoveDocument = (idx) => {
    setPropertyData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== idx),
    }));
  };

  const handleUploadAndNext = async () => {
    if (documents.length === 0) return;

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

    setUploading(true);
    setApiError("");

    try {
      const formData = new FormData();
      documents.forEach((file) => formData.append("documents", file));

      const res = await axios.post(
        `${API_BASE}/api/property/${propertyData.propertyId}/documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Backend should return saved file paths
      const savedFiles = res?.data?.documents || [];
      setPropertyData((prev) => ({
        ...prev,
        documents: savedFiles,
        stepsCompleted: { ...(prev.stepsCompleted || {}), documents: true },
      }));

      // Navigate to the next step or finish
      navigate("/property-summary"); // replace with your final step route
    } catch (err) {
      console.error("Failed to upload documents:", err.response || err);
      const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement des documents.";
      setApiError(msg);
    } finally {
      setUploading(false);
    }
  };

  const currentStepKey = "documents";
  const currentStepIndex = stepOrder.findIndex((step) => step.key === currentStepKey);
  const stepsBefore = stepOrder.slice(0, currentStepIndex);
  const stepsAfter = stepOrder.slice(currentStepIndex + 1);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Completed steps before current */}
      <div className="w-full max-w-md mx-auto px-4 pt-4">
        {stepsBefore.map((step) =>
          propertyData.stepsCompleted?.[step.key] ? (
            <NavigationButton key={step.key} left={step.label} right="✓" to={step.to} active={false} />
          ) : null
        )}
      </div>

      {/* Step 9 */}
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-4">
          <h2 className="text-green-800 text-lg font-bold text-center mb-1">Etape 9:</h2>
          <h3 className="text-black text-xl font-bold text-center mb-2">Documents légaux</h3>
          <p className="text-center text-gray-700 mb-4">
            Veuillez télécharger les documents prouvant que vous êtes autorisé à louer ce bien (titre de propriété, contrat de location, etc.).
          </p>

          <div className="mb-8 flex flex-col gap-3">
            <input
              type="file"
              accept="application/pdf,image/*"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFilesChange}
            />

            {documents.length === 0 && (
              <button
                type="button"
                className="border-2 border-dashed border-[#a084e8] rounded-lg w-full h-32 flex flex-col items-center justify-center text-[#a084e8] hover:bg-[#f5f5f5] transition"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <span className="text-4xl mb-2">+</span>
                <span className="text-base font-semibold">Ajouter un document</span>
              </button>
            )}

            {documents.map((file, idx) => (
              <div key={idx} className="relative border-2 border-dashed rounded-lg w-full h-20 px-4 flex items-center justify-between bg-gray-50">
                <span className="truncate max-w-xs">{file.name}</span>
                <button
                  type="button"
                  className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-2"
                  onClick={() => handleRemoveDocument(idx)}
                  aria-label="Supprimer le document"
                >
                  ×
                </button>
              </div>
            ))}

            {documents.length > 0 && (
              <button
                type="button"
                className="border-2 border-dashed border-[#a084e8] rounded-lg w-full h-20 flex flex-col items-center justify-center text-[#a084e8] hover:bg-[#f5f5f5] transition"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <span className="text-3xl mb-1">+</span>
                <span className="text-xs font-semibold">Ajouter</span>
              </button>
            )}
          </div>

          {apiError && <div className="text-red-600 text-sm mb-2">{apiError}</div>}

          <button
            className="w-full bg-green-800 text-white rounded-full py-3 font-semibold text-lg hover:bg-green-900 transition"
            disabled={documents.length === 0 || uploading}
            onClick={handleUploadAndNext}
          >
            {uploading ? "Enregistrement..." : "Terminer"}
          </button>
        </div>
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
  );
}
