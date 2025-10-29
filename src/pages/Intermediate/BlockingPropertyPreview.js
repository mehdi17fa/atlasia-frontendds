import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import CoHostPropertyLayout from "../Layout/CohostPropertyLayout";
import { AuthContext } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

import { ReactComponent as BedIcon } from '../../assets/icons/bed.svg';
import { ReactComponent as GuestsIcon } from '../../assets/icons/invité.svg';
import { ReactComponent as AreaIcon } from '../../assets/icons/superficie.svg';
import { ReactComponent as BathIcon } from '../../assets/icons/bathroom.svg';
import { ReactComponent as WifiIcon } from '../../assets/icons/wifi.svg';
import { ReactComponent as TvIcon } from '../../assets/icons/PropertyEquipment/tvBlack.svg';
import { ReactComponent as WasherIcon } from '../../assets/icons/PropertyEquipment/washerBlack.svg';
import { ReactComponent as AcIcon } from '../../assets/icons/ac.svg';
import { ReactComponent as HeaterIcon } from '../../assets/icons/PropertyEquipment/heaterBlack.svg';
import { ReactComponent as KitchenIcon } from '../../assets/icons/cuisine.svg';
import { ReactComponent as ParkingIcon } from '../../assets/icons/PropertyEquipment/parkingBlack.svg';
import { ReactComponent as PoolIcon } from '../../assets/icons/PropertyEquipment/poolBlack.svg';
import { ReactComponent as PlaygroundIcon } from '../../assets/icons/PropertyEquipment/playgroundBlack.svg';

export default function BlockingPropertyPreview() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        if (!propertyId) {
          throw new Error("Property ID is undefined");
        }
        console.log(`Fetching property with ID: ${propertyId}`);
        console.log(`Using token: ${token ? 'Present' : 'Missing'}`);
        const res = await api.get(`/api/property/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("API response:", res.data);
        setProperty(res.data.property);
      } catch (err) {
        console.error("❌ Error fetching property:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          propertyId,
        });
        setError({
          message: err.response?.data?.message || err.message || "Failed to load property",
          status: err.response?.status || null,
        });
        if (err.response?.status === 401 || !token) {
          console.warn("Unauthorized, redirecting to /login");
          navigate("/login");
        } else if (err.response?.status === 403) {
          console.warn("Forbidden, redirecting to /blocking-explore");
          navigate("/blocking-explore");
        } else if (err.message === "Property ID is undefined") {
          console.warn("Invalid property ID, redirecting to /blocking-explore");
          navigate("/blocking-explore");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      console.warn("No token found, redirecting to /login");
      navigate("/login");
      return;
    }

    if (!propertyId) {
      console.warn("Property ID is undefined, redirecting to /blocking-explore");
      setError({ message: "Invalid property ID", status: null });
      setLoading(false);
      navigate("/blocking-explore");
      return;
    }

    fetchProperty();
  }, [propertyId, navigate, token]);

  // Check if this property is currently blocked by this user
  useEffect(() => {
    const checkIfBlocked = async () => {
      try {
        const res = await api.get('/api/partner/blocked-properties', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success && Array.isArray(res.data.properties)) {
          const blocked = res.data.properties.some(p => p._id === propertyId);
          setIsBlocked(blocked);
        }
      } catch (err) {
        console.error("Error checking if property is blocked:", err);
      }
    };

    if (token && propertyId) {
      checkIfBlocked();
    }
  }, [propertyId, token]);

  if (loading) {
    return <p className="text-center mt-20">Chargement...</p>;
  }

  if (error) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-semibold mb-2">Erreur</h3>
          <p>{error.message}</p>
          {error.status && <p>Status: {error.status}</p>}
          <p>Property ID: {propertyId || "undefined"}</p>
        </div>
        <button
          onClick={() => navigate("/blocking-explore")}
          className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800"
        >
          Retour à l'exploration des propriétés
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <p className="text-center text-gray-500">Propriété introuvable.</p>
        <button
          onClick={() => navigate("/blocking-explore")}
          className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800"
        >
          Retour à l'exploration des propriétés
        </button>
      </div>
    );
  }

  const features = [
    { icon: <BedIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bedrooms || 0} chambres` },
    { icon: <GuestsIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.guests || 0} invités` },
    { icon: <AreaIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.beds || 0} m²` },
    { icon: <BathIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bathrooms || 0} salles de bain` },
    property.equipments?.includes("wifi") && { icon: <WifiIcon className="w-7 h-7 text-gray-600" />, label: "Wifi" },
    property.equipments?.includes("tv") && { icon: <TvIcon className="w-7 h-7 text-gray-600" />, label: "Télévision" },
    property.equipments?.includes("washer") && { icon: <WasherIcon className="w-7 h-7 text-gray-600" />, label: "Lave-linge" },
    property.equipments?.includes("ac") && { icon: <AcIcon className="w-7 h-7 text-gray-600" />, label: "Climatisation" },
    property.equipments?.includes("heater") && { icon: <HeaterIcon className="w-7 h-7 text-gray-600" />, label: "Chauffage" },
    property.equipments?.includes("kitchen") && { icon: <KitchenIcon className="w-7 h-7 text-gray-600" />, label: "Cuisine" },
    property.equipments?.includes("parking") && { icon: <ParkingIcon className="w-7 h-7 text-gray-600" />, label: "Parking" },
    property.equipments?.includes("pool") && { icon: <PoolIcon className="w-7 h-7 text-gray-600" />, label: "Piscine" },
    property.equipments?.includes("playground") && { icon: <PlaygroundIcon className="w-7 h-7 text-gray-600" />, label: "Aire de jeux" },
  ].filter(Boolean);

  const associatedPacks = Array.isArray(property.associatedPacks) ? property.associatedPacks : [];

  const mapImage = "/map-placeholder.jpg";

  const owner = property.owner || {};
  const computedOwnerName = owner.displayName 
    || owner.fullName 
    || [owner.firstName, owner.lastName].filter(Boolean).join(' ')
    || owner.name 
    || owner.email 
    || 'Hôte';
  const hostData = property.owner ? {
    id: owner._id,
    name: computedOwnerName,
    photo: owner.profilePic || owner.profileImage,
    email: owner.email
  } : null;

  const handleBlockClick = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour bloquer la propriété");
      return;
    }

    if (isBlocked) {
      toast("Blocage déjà effectué", { icon: "ℹ️" });
      return;
    }

    try {
      const res = await api.post(`/api/property/${propertyId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setIsBlocked(true);
        toast.success("Propriété bloquée pour 15 minutes !");
      }
    } catch (err) {
      console.error("❌ Error sending block request:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const msg = err.response?.status === 404
        ? "Propriété introuvable ou non publiée"
        : err.response?.data?.message || err.message || "Erreur lors du blocage";
      toast.error(msg);
    }
  };

  const handleBookClick = async () => {
    console.log("🎯 Book button clicked!");
    console.log("User:", user);
    console.log("PropertyId:", propertyId);
    console.log("Token:", token ? "Present" : "Missing");
    
    if (!user) {
      toast.error("Vous devez être connecté pour réserver");
      navigate("/login");
      return;
    }

    try {
      // First, unblock the property if it's currently blocked
      console.log("📤 Sending unblock request...");
      toast.loading("Déblocage de la propriété...");
      
      const unblockRes = await api.delete(`/api/partner/unblock-property/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Unblock response:", unblockRes.data);

      if (unblockRes.data.success) {
        toast.dismiss();
        toast.success("Propriété débloquée ! Redirection vers la réservation...");
        
        console.log("🚀 Navigating to property page...");
        // Wait a moment for the backend to process
        setTimeout(() => {
          // Navigate to booking flow - same as regular property booking
          console.log("🔄 Executing navigation...");
          navigate(`/property/${propertyId}`, {
            state: {
              fromBlocked: true,
              propertyData: property
            }
          });
        }, 500);
      } else {
        console.warn("⚠️ Unblock was not successful:", unblockRes.data);
        toast.dismiss();
        toast.error("Erreur lors du déblocage");
      }
    } catch (err) {
      toast.dismiss();
      console.error("❌ Error unblocking property:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      // If the property is not blocked (404), we can still proceed with booking
      if (err.response?.status === 404) {
        console.log("ℹ️ Property not blocked (404), proceeding with booking anyway");
        toast.success("Redirection vers la réservation...");
        setTimeout(() => {
          navigate(`/property/${propertyId}`, {
            state: {
              fromBlocked: true,
              propertyData: property
            }
          });
        }, 300);
      } else {
        const msg = err.response?.data?.message || err.message || "Erreur lors du déblocage";
        toast.error(msg);
      }
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
        onCoHostClick={isBlocked ? handleBookClick : handleBlockClick}
        requestSent={isBlocked}
        mode={isBlocked ? "booking" : "block"}
      />
    </>
  );
}