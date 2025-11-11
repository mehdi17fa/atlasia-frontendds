import React, { useEffect, useState, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import PropertyLayout from "../Layout/PropertyLayout";
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
import { AuthContext } from "../../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_URL;

export default function PropertyPreview() {
  const { id } = useParams();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useContext(AuthContext);

  // Simple function to extract property ID
  const getPropertyId = () => {
    console.log('🔍 Getting property ID from:', { id, type: typeof id });
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 URL pathname:', window.location.pathname);
    console.log('🔍 URL search:', window.location.search);
    console.log('🔍 URL hash:', window.location.hash);
    console.log('🔍 Location state:', location.state);
    console.log('🔍 History state:', window.history.state);
    
    // Method 1: If useParams gives us a string, use it
    if (typeof id === 'string' && id.match(/^[a-f0-9]{24}$/)) {
      console.log('✅ Using string ID from useParams:', id);
      return id;
    }
    
    // Method 2: Extract from URL pathname
    const urlMatch = window.location.pathname.match(/\/property\/([a-f0-9]{24})/);
    if (urlMatch) {
      console.log('✅ Using ID from URL:', urlMatch[1]);
      return urlMatch[1];
    }
    
    // Method 3: Try to extract from URL pathname manually
    const pathParts = window.location.pathname.split('/');
    console.log('🔍 URL path parts:', pathParts);
    
    const propertyIndex = pathParts.indexOf('property');
    if (propertyIndex !== -1 && pathParts[propertyIndex + 1]) {
      const potentialId = pathParts[propertyIndex + 1];
      console.log('🔍 Potential ID from path:', potentialId);
      
      if (potentialId && potentialId.match(/^[a-f0-9]{24}$/)) {
        console.log('✅ Found valid ID in path:', potentialId);
        return potentialId;
      }
    }
    
    // Method 4: If id is an object, try to extract from it
    if (id && typeof id === 'object') {
      console.log('🔍 Object received, trying to extract ID...');
      console.log('🔍 Object keys:', Object.keys(id));
      console.log('🔍 Object values:', Object.values(id));
      
      // Try common ID field names
      const possibleId = id._id || id.id || id.propertyId || id.property_id;
      if (possibleId && typeof possibleId === 'string' && possibleId.match(/^[a-f0-9]{24}$/)) {
        console.log('✅ Found ID in object:', possibleId);
        return possibleId;
      }
      
      // Try to find any string that looks like an ID in the object
      const allValues = Object.values(id);
      const stringValues = allValues.filter(v => typeof v === 'string');
      console.log('🔍 All string values in object:', stringValues);
      
      const validId = stringValues.find(v => v && v.length === 24 && v.match(/^[a-f0-9]{24}$/));
      
      if (validId) {
        console.log('✅ Found valid ID in object values:', validId);
        return validId;
      }
    }
    
    // Method 5: Try to extract from URL search parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchId = urlParams.get('id') || urlParams.get('propertyId');
    if (searchId && searchId.match(/^[a-f0-9]{24}$/)) {
      console.log('✅ Found ID in search params:', searchId);
      return searchId;
    }
    
    // Method 6: Try to extract from URL hash
    if (window.location.hash) {
      const hashMatch = window.location.hash.match(/([a-f0-9]{24})/);
      if (hashMatch) {
        console.log('✅ Found ID in hash:', hashMatch[1]);
        return hashMatch[1];
      }
    }
    
    // Method 7: Try to extract from the entire URL
    const fullUrlMatch = window.location.href.match(/([a-f0-9]{24})/);
    if (fullUrlMatch) {
      console.log('✅ Found ID in full URL:', fullUrlMatch[1]);
      return fullUrlMatch[1];
    }
    
    // Method 8: Handle the specific case where URL contains [object Object]
    if (window.location.href.includes('[object%20Object]') || window.location.href.includes('[object Object]')) {
      console.log('🚨 Detected [object Object] in URL - this indicates incorrect navigation');
      console.log('🚨 The component is being called with an object instead of a string ID');
      console.log('🚨 This suggests the navigation logic is passing the entire property object');
      console.log('🚨 Expected: navigate("/property/123") or <Route path="/property/:id">');
      console.log('🚨 Received: navigate("/property/", { state: { property: {...} } })');
      
      // Try to get the property from the navigation state or location state
      if (window.history.state && window.history.state.property) {
        const property = window.history.state.property;
        console.log('🔍 Found property in history state:', property);
        
        const propertyId = property._id || property.id || property.propertyId;
        if (propertyId && typeof propertyId === 'string' && propertyId.match(/^[a-f0-9]{24}$/)) {
          console.log('✅ Found ID in history state property:', propertyId);
          return propertyId;
        }
      }
      
      // Try to get from location state (React Router)
      if (location.state && location.state.property) {
        const property = location.state.property;
        console.log('🔍 Found property in location state:', property);
        
        const propertyId = property._id || property.id || property.propertyId;
        if (propertyId && typeof propertyId === 'string' && propertyId.match(/^[a-f0-9]{24}$/)) {
          console.log('✅ Found ID in location state property:', propertyId);
          return propertyId;
        }
      }
      
      // Try to get from location state directly
      if (location.state && location.state._id) {
        const propertyId = location.state._id;
        if (propertyId && typeof propertyId === 'string' && propertyId.match(/^[a-f0-9]{24}$/)) {
          console.log('✅ Found ID in location state directly:', propertyId);
          return propertyId;
        }
      }
    }
    
    console.error('❌ No valid property ID found');
    console.error('❌ useParams id:', id);
    console.error('❌ URL pathname:', window.location.pathname);
    console.error('❌ URL search:', window.location.search);
    console.error('❌ URL hash:', window.location.hash);
    console.error('❌ Full URL:', window.location.href);
    console.error('❌ History state:', window.history.state);
    console.error('❌ Location state:', location.state);
    console.error('❌ This indicates a navigation issue - the component is being called incorrectly');
    console.error('❌ Expected: navigate("/property/123") or <Route path="/property/:id">');
    console.error('❌ Received: navigate("/property/", { state: { property: {...} } })');
    return null;
  };

  useEffect(() => {
    const fetchPropertyAndPacks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const propertyId = getPropertyId();
        
        if (!propertyId) {
          console.error('❌ No valid property ID found, showing error');
          setError('No valid property ID found. Please check the URL and try again.');
          setLoading(false);
          return;
        }
        
        console.log('✅ Using property ID:', propertyId);
        
        console.log('🚀 Fetching property with ID:', propertyId);
        
        // Fetch property
        const resProperty = await axios.get(`${API_BASE}/api/property/public/${propertyId}`);
        console.log('🏠 Property data received:', resProperty.data.property);
        setProperty(resProperty.data.property);

        // Fetch associated packs
        try {
          const resPacks = await axios.get(`${API_BASE}/api/property/${propertyId}/packs`);
          if (resPacks.data.success) {
            console.log('📦 Associated packs:', resPacks.data.packs);
            setPacks(resPacks.data.packs);
          }
        } catch (packError) {
          console.warn('Could not fetch packs:', packError);
          // Don't fail the whole component if packs can't be fetched
        }
        
      } catch (err) {
        console.error("Error fetching property:", err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch property');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyAndPacks();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Propriété non trouvée</h2>
          <p className="text-gray-600 mb-4">Cette propriété n'existe pas ou n'est plus disponible.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const features = [
    { icon: <BedIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bedrooms || 0} chambres` },
    { icon: <GuestsIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.guests || 0} invités` },
    { icon: <AreaIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.beds || 0} m²` },
    { icon: <BathIcon className="w-7 h-7 text-gray-600" />, label: `${property.info?.bathrooms || 0} salles de bain` },
    // Equipment features
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

  const hostData = property.owner ? {
    id: property.owner._id,
    name: property.owner.displayName || property.owner.fullName || property.owner.name || 'Hôte',
    photo: property.owner.profileImage || property.owner.profilePic,
    email: property.owner.email,
    fullName: property.owner.fullName,
    displayName: property.owner.displayName,
    profileImage: property.owner.profileImage,
    profilePic: property.owner.profilePic
  } : null;

  return (
    <PropertyLayout
      title={property.title}
      location={`${property.localisation?.city || ""}${property.localisation?.address ? ", " + property.localisation.address : ""}`}
      rating={property.rating?.average || 0}
      reviewCount={property.rating?.count || 0}
      mainImage={property.photos?.[0] || "/placeholder1.jpg"}
      photos={property.photos || []}
      host={hostData}
      checkInTime={property.checkInTime || "15:00"}
      features={features}
      associatedPacks={packs}
      mapImage={property.localisation}
      reviews={property.reviews || []}
      user={user}
      token={token}
    />
  );
}