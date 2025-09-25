import React, { useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import { AuthContext } from "../../context/AuthContext";
import NavigationButton from "../../components/shared/NavigationButtons";
import S3Image from "../../components/S3Image";
import { uploadMultipleFilesToS3 } from "../../utilities/s3Service";

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

export default function PropertyPhotosStep() {
  const navigate = useNavigate();
  const { propertyData, setPropertyData } = usePropertyCreation();
  const { user } = useContext(AuthContext);

  const fileInputRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const photos = propertyData.photos || [];
  const currentStepKey = "photos";
  const currentStepIndex = stepOrder.findIndex((step) => step.key === currentStepKey);
  const stepsAfter = stepOrder.slice(currentStepIndex + 1);

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - photos.length); // Limit 4 max
    setPropertyData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...files],
    }));
  };

  const handleRemovePhoto = (idx) => {
    setPropertyData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  const handleNext = async () => {
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

    if (photos.length === 0) {
      setApiError("Ajoutez au moins une photo.");
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      // Get only the File objects for upload
      const filesToUpload = photos.filter(file => file instanceof File);
      
      if (filesToUpload.length === 0) {
        // No new files to upload, just proceed
        navigate("/property-title", { replace: true });
        return;
      }

      // Try S3 direct upload first
      try {
        console.log("Attempting direct S3 upload...");
        const uploadResults = await uploadMultipleFilesToS3(
          filesToUpload, 
          'property-photos',
          (fileIndex, progress, fileName) => {
            console.log(`Uploading ${fileName}: ${progress}%`);
          }
        );
        
        // Combine existing photos with new uploaded photos
        const allPhotos = [
          ...photos.filter(photo => !(photo instanceof File)), // Keep existing URLs
          ...uploadResults.map(result => result.url) // Add new uploaded URLs
        ];

        setPropertyData((prev) => ({
          ...prev,
          photos: allPhotos,
          stepsCompleted: { ...(prev.stepsCompleted || {}), photos: true },
        }));

        navigate("/property-title", { replace: true });
        return;
        
      } catch (s3Error) {
        console.error("S3 direct upload failed, trying backend:", s3Error);
        
        // Fallback to backend upload
        const formData = new FormData();
        filesToUpload.forEach((file) => {
          formData.append("photos", file);
        });

        const headers = {
          Authorization: `Bearer ${authToken}`,
        };

        const res = await axios.post(
          `${API_BASE}/api/property/${propertyData.propertyId}/photos`,
          formData,
          { headers }
        );

        const updatedPhotos = res?.data?.property?.photos || photos;

        setPropertyData((prev) => ({
          ...prev,
          photos: updatedPhotos,
          stepsCompleted: { ...(prev.stepsCompleted || {}), photos: true },
        }));

        navigate("/property-title", { replace: true });
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.msg ||
        `Erreur ${err.response?.status || 'inconnue'}: ${err.message}` ||
        "Erreur lors de l'enregistrement des photos.";
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

      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 pt-4">
          <h2 className="text-green-800 text-lg font-bold text-center mb-1">Etape 5:</h2>
          <h3 className="text-black text-xl font-bold text-center mb-6">
            Choisissez jusqu'à 4 photos
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {photos.map((fileOrPath, idx) => (
              <div
                key={idx}
                className="relative border-2 border-dashed rounded-lg w-92 h-32 p-2 flex flex-col items-center justify-center"
              >
                {fileOrPath instanceof File ? (
                  <img
                    src={URL.createObjectURL(fileOrPath)}
                    alt={`photo-${idx + 1}`}
                    className="w-98 h-28 object-cover rounded"
                  />
                ) : (
                  <S3Image
                    src={fileOrPath}
                    alt={`photo-${idx + 1}`}
                    className="w-98 h-28 object-cover rounded"
                    fallbackSrc="/placeholder.jpg"
                  />
                )}
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  onClick={() => handleRemovePhoto(idx)}
                  aria-label="Supprimer la photo"
                >
                  ×
                </button>
              </div>
            ))}

            {photos.length < 4 && (
              <button
                type="button"
                className="col-span-2 border-2 border-dashed border-[#a084e8] rounded-lg w-94 h-32 flex flex-col items-center justify-center text-[#a084e8] hover:bg-[#f5f5f5] transition"
                onClick={() => fileInputRef.current.click()}
              >
                <span className="text-4xl mb-2">+</span>
                <span className="text-base font-semibold">Ajouter</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFilesChange}
                />
              </button>
            )}
          </div>

          {apiError && <div className="text-red-600 text-sm mb-2">{apiError}</div>}

          <button
            className="w-full bg-green-800 text-white rounded-full py-3 font-semibold text-lg hover:bg-green-900 transition"
            disabled={photos.length === 0 || submitting}
            onClick={handleNext}
          >
            {submitting ? "Enregistrement..." : "Suivant"}
          </button>
        </div>

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
