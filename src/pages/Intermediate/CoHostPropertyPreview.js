// src/pages/CoHostPropertyPreview.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CoHostPropertyLayout from "../Layout/CohostPropertyLayout";
import { AuthContext } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

import { ReactComponent as BedIcon } from '../../assets/icons/bed.svg';
import { ReactComponent as GuestsIcon } from '../../assets/icons/invité.svg';
import { ReactComponent as AreaIcon } from '../../assets/icons/superficie.svg';
import { ReactComponent as BathIcon } from '../../assets/icons/bathroom.svg';
import { ReactComponent as WifiIcon } from '../../assets/icons/wifi.svg';
import { ReactComponent as KitchenIcon } from '../../assets/icons/cuisine.svg';
import { ReactComponent as AcIcon } from '../../assets/icons/ac.svg';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function CoHostPropertyPreview() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axios.get(`${API_BASE}/api/property/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setProperty(res.data.property);
      } catch (err) {
        console.error("❌ Error fetching cohost property:", err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, navigate]);

  if (loading) return <p className="text-center mt-20">Chargement...</p>;
  if (!property) return <p className="text-center mt-20">Propriété introuvable.</p>;

  const features = [
    { icon: <BedIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bedrooms || 0} chambres` },
    { icon: <GuestsIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.guests || 0} invités` },
    { icon: <AreaIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.beds || 0} m²` },
    { icon: <BathIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bathrooms || 0} salles de bain` },
    property.equipments?.includes("wifi") && { icon: <WifiIcon className="w-7 h-7 text-gray-600" />, label: "Wifi" },
    property.equipments?.includes("kitchen") && { icon: <KitchenIcon className="w-7 h-7 text-gray-600" />, label: "Cuisine" },
    property.equipments?.includes("ac") && { icon: <AcIcon className="w-7 h-7 text-gray-600" />, label: "Climatisation" },
  ].filter(Boolean);

  const associatedPacks = property.associatedPacks?.length
    ? property.associatedPacks
    : [
        { name: "Quad Atlasia", location: "Ifrane - Farah Inn · 1h", image: "/placeholder1.jpg" },
        { name: "Cheval Atlasia", location: "Ifrane - Farah Inn · 1h", image: "/placeholder2.jpg" },
      ];

  const mapImage = "/map-placeholder.jpg";

  const hostData = property.owner ? {
    id: property.owner._id,
    name: property.owner.displayName || property.owner.fullName || property.owner.name || 'Nom non disponible',
    photo: property.owner.profilePic || property.owner.profileImage,
    email: property.owner.email
  } : null;

  // ✅ Function to request co-hosting
  const handleCoHostClick = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour devenir co-hôte");
      return;
    }

    if (requestSent) {
      toast("Demande déjà envoyée", { icon: "ℹ️" });
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${API_BASE}/api/partner/request/${propertyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setRequestSent(true);
        toast.success("Demande envoyée avec succès ! L'e-mail a été envoyé au propriétaire.");
      }
    } catch (err) {
      console.error("❌ Error sending cohost request:", err);
      const msg = err.response?.data?.message || "Erreur lors de l'envoi de la demande";
      toast.error(msg);
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <CoHostPropertyLayout
        title={property.title}
        location={`${property.localisation?.city || ""}${property.localisation?.address ? ", " + property.localisation.address : ""}`}
        rating={5}
        reviewCount={property.reviews?.length || 0}
        mainImage={property.photos?.[0] || "/placeholder1.jpg"}
        host={hostData}
        checkInTime="15:00"
        features={features}
        associatedPacks={associatedPacks}
        mapImage={mapImage}
        reviews={property.reviews || []}
        user={user}
        onCoHostClick={handleCoHostClick}
      />
    </>
  );
}
