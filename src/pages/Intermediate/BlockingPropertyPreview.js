import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import PropertyLayout from "../Layout/PropertyLayout";
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
  const [blockCheckIn, setBlockCheckIn] = useState("");
  const [blockCheckOut, setBlockCheckOut] = useState("");
  const [blockDatesError, setBlockDatesError] = useState("");
  const [blockInfo, setBlockInfo] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);

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
          const blockedProperty = res.data.properties.find(p => p._id === propertyId);
          const blocked = !!blockedProperty;
          setIsBlocked(blocked);
          if (blockedProperty?.blockingInfo) {
            const { checkIn, checkOut } = blockedProperty.blockingInfo;
            const normalizeDate = (value) => {
              if (!value) return "";
              if (typeof value === "string") {
                return value.includes("T") ? value.split("T")[0] : value;
              }
              try {
                return new Date(value).toISOString().split("T")[0];
              } catch (e) {
                return "";
              }
            };
            const normalizedCheckIn = normalizeDate(checkIn);
            const normalizedCheckOut = normalizeDate(checkOut);
            if (normalizedCheckIn) setBlockCheckIn(normalizedCheckIn);
            if (normalizedCheckOut) setBlockCheckOut(normalizedCheckOut);
            setBlockInfo(blockedProperty.blockingInfo);
            setBlockDatesError("");
          } else {
            setBlockInfo(null);
          }
        } else {
          setIsBlocked(false);
          setBlockInfo(null);
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

  const owner = property.owner || {};
  const locationLabel = `${property.localisation?.city || ""}${property.localisation?.address ? ", " + property.localisation.address : ""}`;

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

  const handleBlockDatesChange = ({ checkIn, checkOut }) => {
    if (typeof checkIn !== 'undefined') {
      setBlockCheckIn(checkIn);
    }
    if (typeof checkOut !== 'undefined') {
      setBlockCheckOut(checkOut);
    }
    setBlockDatesError("");
  };

  const computeMinutesRemaining = (expiresAt, fallbackMinutes) => {
    if (expiresAt) {
      const expires = new Date(expiresAt).getTime();
      if (!Number.isNaN(expires)) {
        const diff = Math.ceil((expires - Date.now()) / (1000 * 60));
        if (diff > 0) {
          return diff;
        }
      }
    }
    if (typeof fallbackMinutes === 'number' && fallbackMinutes > 0) {
      return fallbackMinutes;
    }
    return null;
  };

  const formatExpiryMessage = (expiresAt) => {
    if (!expiresAt) return null;
    const expires = new Date(expiresAt);
    if (Number.isNaN(expires.getTime())) return null;
    const datePart = expires.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const timePart = expires.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `Blocage actif jusqu'au ${datePart} à ${timePart}`;
  };

  const handleBlockClick = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour bloquer la propriété");
      return;
    }

    if (isBlocked) {
      toast("Blocage déjà effectué", { icon: "ℹ️" });
      return;
    }

    if (!blockCheckIn || !blockCheckOut) {
      const message = "Veuillez sélectionner les dates d'arrivée et de départ.";
      setBlockDatesError(message);
      toast.error(message);
      return;
    }

    const checkInDate = new Date(blockCheckIn);
    const checkOutDate = new Date(blockCheckOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      const message = "Les dates sélectionnées ne sont pas valides.";
      setBlockDatesError(message);
      toast.error(message);
      return;
    }

    if (checkOutDate <= checkInDate) {
      const message = "La date de départ doit être après la date d'arrivée.";
      setBlockDatesError(message);
      toast.error(message);
      return;
    }

    setBlockLoading(true);
    try {
      // Enforce single active block per partner
      const existing = await api.get('/api/partner/blocked-properties', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (existing.data?.success && Array.isArray(existing.data.properties)) {
        const otherBlocked = existing.data.properties.find(p => p._id !== propertyId);
        if (otherBlocked) {
          toast.error("Vous avez déjà bloqué une propriété. Débloquez-la d'abord.");
          return;
        }
      }

      const res = await api.post(`/api/property/${propertyId}/block`, {
        checkIn: blockCheckIn,
        checkOut: blockCheckOut,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setIsBlocked(true);
        toast.dismiss();
        toast.success("Propriété bloquée pour 15 minutes !");
        setBlockDatesError("");
        if (res.data.booking?.checkIn) {
          setBlockCheckIn(res.data.booking.checkIn.split('T')[0]);
        }
        if (res.data.booking?.checkOut) {
          setBlockCheckOut(res.data.booking.checkOut.split('T')[0]);
        }
        setBlockInfo({
          bookingId: res.data.booking?._id,
          expiresAt: res.data.booking?.expiresAt,
          checkIn: res.data.booking?.checkIn,
          checkOut: res.data.booking?.checkOut,
          timeRemaining: res.data.booking?.timeRemaining,
        });
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
      setBlockDatesError(msg);
      toast.error(msg);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleBookClick = async () => {
    console.log("🎯 Book button clicked!");
    console.log("User:", user);
    console.log("PropertyId:", propertyId);
    console.log("Token:", token ? "Present" : "Missing");
    console.log("📅 Blocked dates:", { checkIn: blockCheckIn || blockInfo?.checkIn, checkOut: blockCheckOut || blockInfo?.checkOut });
    
    if (!user) {
      toast.error("Vous devez être connecté pour réserver");
      navigate("/login");
      return;
    }

    // Get the blocked dates
    const blockedCheckIn = blockCheckIn || blockInfo?.checkIn;
    const blockedCheckOut = blockCheckOut || blockInfo?.checkOut;

    if (!blockedCheckIn || !blockedCheckOut) {
      toast.error("Dates de blocage manquantes. Veuillez réessayer.");
      return;
    }

    try {
      setBlockLoading(true);
      // First, unblock the property if it's currently blocked
      console.log("📤 Sending unblock request...");
      toast.loading("Déblocage de la propriété...");
      
      const unblockRes = await api.delete(`/api/partner/unblock-property/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Unblock response:", unblockRes.data);

      if (unblockRes.data.success) {
        toast.dismiss();
        toast.success("Redirection vers la réservation...");
        setIsBlocked(false);
        setBlockInfo(null);
        
        console.log("🚀 Navigating to booking page with dates:", { blockedCheckIn, blockedCheckOut });
        // Wait a moment for the backend to process
        setTimeout(() => {
          // Navigate directly to booking request page with pre-filled dates
          console.log("🔄 Executing navigation to booking...");
          navigate(`/booking/request/${propertyId}`, {
            state: {
              fromBlocked: true,
              propertyData: property,
              checkIn: blockedCheckIn,
              checkOut: blockedCheckOut,
              guests: 1, // Default to 1 guest for partners
              authToken: token,
              userId: user._id,
              hostId: property?.owner?._id,
              hostName: property?.owner?.fullName || property?.owner?.name || "Hôte",
              hostPhoto: property?.owner?.profilePic || property?.owner?.profileImage
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
          navigate(`/booking/request/${propertyId}`, {
            state: {
              fromBlocked: true,
              propertyData: property,
              checkIn: blockedCheckIn,
              checkOut: blockedCheckOut,
              guests: 1,
              authToken: token,
              userId: user._id,
              hostId: property?.owner?._id,
              hostName: property?.owner?.fullName || property?.owner?.name || "Hôte",
              hostPhoto: property?.owner?.profilePic || property?.owner?.profileImage
            }
          });
        }, 300);
      } else {
        const msg = err.response?.data?.message || err.message || "Erreur lors du déblocage";
        toast.error(msg);
      }
    } finally {
      setBlockLoading(false);
    }
  };

  const minutesRemaining = computeMinutesRemaining(blockInfo?.expiresAt, blockInfo?.timeRemaining);

  const blockInfoMessage = isBlocked
    ? formatExpiryMessage(blockInfo?.expiresAt) || "Blocage actif. Finalisez votre réservation pour ne pas le perdre."
    : "Sélectionnez vos dates pour bloquer ce logement pendant 15 minutes.";

  const blockSubText = isBlocked
    ? minutesRemaining
      ? `Le blocage expirera dans environ ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`
      : "Le blocage expirera automatiquement après 15 minutes."
    : "Le blocage expire automatiquement après 15 minutes.";

  const ctaButtonLabel = blockLoading
    ? "Traitement..."
    : (isBlocked ? "Continuer vers la réservation" : "Bloquer pour 15 min");

  const ctaConfig = {
    title: isBlocked ? "Blocage en cours" : "Bloquer ce logement",
    buttonLabel: ctaButtonLabel,
    buttonDisabled: blockLoading,
    buttonLoading: blockLoading,
    buttonClassName: isBlocked
      ? "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
      : "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
    onAction: isBlocked ? handleBookClick : handleBlockClick,
    showGuestsInput: false,
    infoMessage: blockInfoMessage,
    errorMessage: blockDatesError,
    subText: blockSubText,
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <PropertyLayout
        title={property.title}
        location={locationLabel}
        rating={property.rating?.average || 0}
        reviewCount={property.rating?.count || property.reviews?.length || 0}
        mainImage={property.photos?.[0] || "/placeholder1.jpg"}
        photos={property.photos || []}
        host={hostData}
        checkInTime={property.checkInTime || "15:00"}
        features={features}
        associatedPacks={associatedPacks}
        mapImage={locationLabel}
        reviews={property.reviews || []}
        user={user}
        token={token}
        propertyId={propertyId}
        initialCheckIn={blockCheckIn}
        initialCheckOut={blockCheckOut}
        onDatesChange={handleBlockDatesChange}
        ctaConfig={ctaConfig}
      />
    </>
  );
}