import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PropertyLayout from "../Layout/PropertyLayout";
import { ReactComponent as BedIcon } from '../../assets/icons/bed.svg';
import { ReactComponent as GuestsIcon } from '../../assets/icons/invité.svg';
import { ReactComponent as AreaIcon } from '../../assets/icons/superficie.svg';
import { ReactComponent as BathIcon } from '../../assets/icons/bathroom.svg';
import { ReactComponent as WifiIcon } from '../../assets/icons/wifi.svg';
import { ReactComponent as KitchenIcon } from '../../assets/icons/cuisine.svg';
import { ReactComponent as AcIcon } from '../../assets/icons/ac.svg';
import { AuthContext } from "../../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function PropertyPreview() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [packs, setPacks] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPropertyAndPacks = async () => {
      try {
        // Fetch property
        const resProperty = await axios.get(`${API_BASE}/api/property/public/${id}`);
        setProperty(resProperty.data.property);

        // Fetch associated packs
        const resPacks = await axios.get(`${API_BASE}/api/property/${id}/packs`);
        if (resPacks.data.success) setPacks(resPacks.data.packs);
      } catch (err) {
        console.error("Error fetching property or packs:", err);
      }
    };
    fetchPropertyAndPacks();
  }, [id]);

  if (!property) return <p className="text-center mt-20">Chargement...</p>;

  const features = [
    { icon: <BedIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bedrooms || 0} chambres` },
    { icon: <GuestsIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.guests || 0} invités` },
    { icon: <AreaIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.beds || 0} m²` },
    { icon: <BathIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bathrooms || 0} salles de bain` },
    property.equipments?.includes("wifi") && { icon: <WifiIcon className="w-7 h-7 text-gray-600" />, label: "Wifi" },
    property.equipments?.includes("kitchen") && { icon: <KitchenIcon className="w-7 h-7 text-gray-600" />, label: "Cuisine" },
    property.equipments?.includes("ac") && { icon: <AcIcon className="w-7 h-7 text-gray-600" />, label: "Climatisation" },
  ].filter(Boolean);

  const mapImage = "/map-placeholder.jpg";

  const hostData = property.owner ? {
    id: property.owner._id,
    name: property.owner.displayName || property.owner.fullName || property.owner.name || 'Nom non disponible',
    photo: property.owner.profileImage || property.owner.profilePic,
    email: property.owner.email
  } : null;

  return (
    <PropertyLayout
      title={property.title}
      location={`${property.localisation?.city || ""}${property.localisation?.address ? ", " + property.localisation.address : ""}`}
      rating={5}
      reviewCount={property.reviews?.length || 0}
      mainImage={property.photos?.[0] || "/placeholder1.jpg"}
      photos={property.photos || []}
      host={hostData}
      checkInTime="15:00"
      features={features}
      associatedPacks={packs}
      mapImage={mapImage}
      reviews={property.reviews || []}
      user={user}
    />
  );
}
