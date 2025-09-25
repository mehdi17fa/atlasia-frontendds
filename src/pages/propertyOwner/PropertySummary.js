import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { usePropertyCreation } from "../../context/PropertyCreationContext";
import S3Image from "../../components/S3Image";

const API_BASE = process.env.REACT_APP_API_URL;

export default function PropertySummary() {
  const { propertyData } = usePropertyCreation();
  const { user } = useContext(AuthContext);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      const authToken =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        user?.accessToken ||
        user?.token;

      if (!authToken) {
        setError("Veuillez vous connecter pour continuer.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE}/api/property/${propertyData.propertyId}`, // ✅ matches new route
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setProperty(res.data.property);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Erreur lors de la récupération de la propriété."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyData.propertyId, user]);

  if (loading) return <div className="p-6 text-center">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!property) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-green-800 text-center mb-6">
        Résumé de la propriété
      </h1>

      {/* Localisation */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Localisation</h2>
        <p>
          {property.localisation?.city}, {property.localisation?.address},{" "}
          {property.localisation?.postalCode}
        </p>
      </div>

      {/* Type */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Type de propriété</h2>
        <p>{property.propertyType || "Non renseigné"}</p>
      </div>

      {/* Info */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Informations</h2>
        <p>Guests: {property.info?.guests || 0}</p>
        <p>Bedrooms: {property.info?.bedrooms || 0}</p>
        <p>Beds: {property.info?.beds || 0}</p>
        <p>Bathrooms: {property.info?.bathrooms || 0}</p>
      </div>

      {/* Equipments */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Équipements</h2>
        {property.equipments?.length > 0 ? (
          <ul className="list-disc pl-5">
            {property.equipments.map((eq, i) => (
              <li key={i}>{eq}</li>
            ))}
          </ul>
        ) : (
          <p>Aucun équipement</p>
        )}
      </div>

      {/* Photos */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Photos</h2>
        {property.photos?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {property.photos.map((p, i) => (
              <S3Image
                key={i}
                src={p}
                alt={`Propriété ${i + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
                fallbackSrc="/placeholder.jpg"
              />
            ))}
          </div>
        ) : (
          <p>Aucune photo</p>
        )}
      </div>

      {/* Documents */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Documents légaux</h2>
        {property.documents?.length > 0 ? (
          <ul className="list-disc pl-5">
            {property.documents.map((d, i) => (
              <li key={i}>
                <a
                  href={d}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Voir document {i + 1}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun document</p>
        )}
      </div>

      {/* Title & Description */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Titre & Description</h2>
        <p>
          <strong>Titre:</strong> {property.title || "Non renseigné"}
        </p>
        <p>
          <strong>Description:</strong> {property.description || "Non renseignée"}
        </p>
      </div>

      {/* Price */}
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Prix</h2>
        <p>
          <strong>Jours de semaine:</strong> {property.price?.weekdays} MAD
        </p>
        <p>
          <strong>Week-end:</strong> {property.price?.weekend} MAD
        </p>
      </div>

      <button
        className="mt-6 w-full bg-green-800 text-white rounded-full py-3 font-semibold text-lg hover:bg-green-900 transition"
        onClick={() => navigate(`/publish-property/${property._id}`)}
      >
        Terminer
      </button>
    </div>
  );
}
