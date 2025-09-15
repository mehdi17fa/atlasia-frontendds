import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { PhoneIcon } from "@heroicons/react/24/outline";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function OwnerDetails() {
  const { id } = useParams(); // 🔹 doit correspondre à /owner/:id
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        console.log("Fetching owner with ID:", id);

        const res = await axios.get(`${API_BASE}/api/auth/user/${id}`);

        console.log("Owner data received:", res.data);
        setOwner(res.data.user);
        setError(null);
      } catch (err) {
        console.error("Error fetching owner:", err);
        console.error("Error response:", err.response?.data);

        if (err.response?.status === 404) setError("Hôte introuvable");
        else if (err.response?.status === 400) setError("ID d'hôte invalide");
        else setError("Erreur lors du chargement des informations de l'hôte");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOwner();
    else {
      setLoading(false);
      setError("ID d'hôte manquant");
    }
  }, [id]);

  if (loading) return <p className="text-center mt-20">Chargement...</p>;
  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;
  if (!owner) return <p className="text-center mt-20">Hôte introuvable</p>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Photo + Name */}
      <div className="flex items-center space-x-4">
        <img
          src={owner.profileImage || owner.profilePic || "/placeholder-profile.jpg"}
          alt={owner.fullName || owner.name}
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-semibold">
            {owner.fullName || owner.name || "Nom non disponible"}
          </h1>
          <p className="text-sm text-gray-500">{owner.role || "Propriétaire"}</p>
        </div>
      </div>

      {/* Phone */}
{(owner.phoneNumber || owner.phone) && (
  <div className="border rounded-lg p-4 flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <PhoneIcon className="w-6 h-6 text-green-600" />
      <span className="text-gray-700">{owner.phoneNumber || owner.phone}</span>
    </div>
    <a
      href={`tel:${owner.phoneNumber || owner.phone}`}
      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
    >
      Contacter
    </a>
  </div>
)}


      {/* Additional info */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-2">À propos de l'hôte</h2>
        <p className="text-gray-600">{owner.bio || "Aucune description disponible."}</p>
        {owner.country && <p className="text-sm text-gray-500 mt-2">Pays: {owner.country}</p>}
        {owner.gender && <p className="text-sm text-gray-500">Genre: {owner.gender}</p>}
      </div>

      {/* Contact section */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold text-lg mb-2">Contact</h2>
        <div className="space-y-2">
          {owner.phoneNumber && <p className="text-sm text-gray-600">📞 {owner.phoneNumber}</p>}
          <p className="text-sm text-gray-600">
            💼 {owner.role === 'owner' ? 'Propriétaire' : owner.role === 'partner' ? 'Partenaire' : 'Hôte'}
          </p>
          {owner.isVerified && <p className="text-sm text-green-600">✅ Compte vérifié</p>}
        </div>
      </div>
    </div>
  );
}
