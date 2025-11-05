// BookingRequest.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { api } from "../../api";
import S3ImageUpload from "../../components/S3ImageUpload";
import ReservationCalendar from "../../components/ReservationCalendar";
import DateRangeCalendar from "../../components/DateRangeCalendar";
import { useCart } from "../../context/CartContext";
import { formatDateForDisplay } from "../../utils/dateUtils";

// Use relative paths with centralized api client
const API_BASE_URL = `/api`;

export default function BookingRequest() {
  const { propertyId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // Check if coming from blocked flow
  const fromBlocked = state?.fromBlocked || false;
  const blockedCheckIn = state?.checkIn;
  const blockedCheckOut = state?.checkOut;
  
  const { bookingData, authToken, hostId, hostName, hostPhoto } = state || {};
  const { guests } = bookingData || {};
  
  // Initialize dates from blocked flow if available, otherwise from bookingData
  const [localCheckIn, setLocalCheckIn] = useState(
    fromBlocked ? blockedCheckIn : (bookingData?.checkIn || "")
  );
  const [localCheckOut, setLocalCheckOut] = useState(
    fromBlocked ? blockedCheckOut : (bookingData?.checkOut || "")
  );
  const { addToCart } = useCart();

  const formatIsoDate = (iso) => {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      // Render as UTC date to avoid timezone shifting the displayed day
      return d.toLocaleDateString('fr-FR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) {
      return iso;
    }
  };

  const [guestMessage, setGuestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [propertyName, setPropertyName] = useState(""); // removed unused state
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [idPhotos, setIdPhotos] = useState([]);
  const [idPhotosUploading, setIdPhotosUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    guestMessage: false,
    idPhotos: false
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch property details on component mount
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!propertyId) {
        setPropertyLoading(false);
        return;
      }

      try {
        const response = await api.get(`${API_BASE_URL}/property/public/${propertyId}`);
        if (response.data && response.data.property) {
          const property = response.data.property;
          setPropertyDetails(property);
          // property title available if needed: property.title
        }
      } catch (err) {
        console.error("Error fetching property details:", err);
        // fallback property title not used in UI
      } finally {
        setPropertyLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId]);

  const handleGoBack = () => {
    // Navigate back to the property preview page
    navigate(`/property/${propertyId}`);
  };

  const handleDateSelection = (checkInDate, checkOutDate) => {
    console.log('Date selection received:', { checkInDate, checkOutDate });
    console.log('Formatted dates:', { 
      checkIn: formatDateForDisplay(checkInDate), 
      checkOut: formatDateForDisplay(checkOutDate) 
    });
    setLocalCheckIn(checkInDate);
    setLocalCheckOut(checkOutDate);
    setShowCalendar(false);
  };

  // Note: formatDateForDisplay is now imported from utils/dateUtils

  const handleIdPhotoUpload = (results) => {
    try {
      setIdPhotosUploading(true);
      
      // Handle single or multiple upload results
      const uploadResults = Array.isArray(results) ? results : [results];
      
      const normalize = (res) => {
        try {
          if (!res) return null;
          // If backend returned a string URL/key
          if (typeof res === 'string') {
            return {
              url: res,
              key: res,
              name: res.split('/').pop() || 'uploaded-photo',
              size: 0
            };
          }
          // Common shapes
          const urlCandidate = res.url || res.fileUrl || res.location || res.downloadUrl || res.uploadUrl;
          const keyCandidate = res.key || res.path || res.upload_path || urlCandidate;
          const nameCandidate = res.fileName || res.originalName || res.name || (typeof urlCandidate === 'string' ? urlCandidate.split('/').pop() : 'uploaded-photo');
          if (urlCandidate || keyCandidate) {
            return {
              url: urlCandidate || keyCandidate,
              key: keyCandidate || urlCandidate,
              name: nameCandidate || 'uploaded-photo',
              size: res.size || 0
            };
          }
          return null;
        } catch (_) {
          return null;
        }
      };

      const newPhotos = uploadResults
        .map(normalize)
        .filter(Boolean);

      if (newPhotos.length === 0) {
        console.error("❌ Upload failed: No valid photos after normalization", uploadResults);
        throw new Error("Upload terminé mais aucune URL n'a été retournée par le serveur");
      }

      // Validate that all photos have valid keys/URLs
      const invalidPhotos = newPhotos.filter(photo => {
        const key = photo?.key || photo?.url;
        return !key || typeof key !== 'string' || key.trim().length === 0;
      });

      if (invalidPhotos.length > 0) {
        console.error("❌ Some photos are missing valid keys/URLs:", invalidPhotos);
        throw new Error("Certaines photos n'ont pas de clé ou URL valide. Veuillez réessayer.");
      }

      console.log("✅ Valid photos to add:", newPhotos.map(p => ({ key: p.key, url: p.url, name: p.name })));
      
      // Update state with functional update to ensure we get the latest state
      setIdPhotos(prev => {
        const updated = [...prev, ...newPhotos];
        console.log("📸 Total photos after update:", updated.length, updated.map(p => ({ key: p.key, url: p.url })));
        return updated;
      });
      
      // Clear field errors when photos are uploaded
      setFieldErrors(prev => ({ ...prev, idPhotos: false }));
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error processing uploaded photos:", error);
      setError("Failed to process uploaded photos. Please try again.");
    } finally {
      // Use micro delay to ensure state consumers see updated idPhotos before setting uploading false
      setTimeout(() => setIdPhotosUploading(false), 50);
    }
  };

  const removePhoto = (index) => {
    setIdPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuestMessageChange = (value) => {
    setGuestMessage(value);
    // Clear guest message error when user starts typing
    setFieldErrors(prev => ({ ...prev, guestMessage: false }));
  };

  const calculateTotal = () => {
    if (!localCheckIn || !localCheckOut || !propertyDetails?.price?.weekdays) {
      return { nights: 0, pricePerNight: 0, total: 0 };
    }

    const checkInDate = new Date(localCheckIn);
    const checkOutDate = new Date(localCheckOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const pricePerNight = propertyDetails.price.weekdays;
    const total = nights * pricePerNight;

    return { nights, pricePerNight, total };
  };

  const handleAddToCart = async () => {
    setError(null);
    setFieldErrors({ guestMessage: false, idPhotos: false });

    // Get guests from bookingData or state (for blocked flow)
    const guestCount = guests || state?.guests || 1;

    if (!localCheckIn || !localCheckOut) {
      setError("Veuillez sélectionner les dates.");
      return;
    }

    if (idPhotosUploading) {
      setError("Téléchargement de la pièce d'identité en cours. Veuillez patienter.");
      return;
    }

    // Require at least one CIN/ID photo
    if (!idPhotos || idPhotos.length === 0) {
      setFieldErrors(prev => ({ ...prev, idPhotos: true }));
      setError("Veuillez télécharger une photo de votre CIN pour continuer.");
      return;
    }

    // Require a message to the host
    if (!guestMessage || guestMessage.trim().length === 0) {
      setFieldErrors(prev => ({ ...prev, guestMessage: true }));
      setError("Veuillez ajouter un message à l'hôte pour continuer.");
      return;
    }

    const { nights, pricePerNight, total } = calculateTotal();

    try {
      setLoading(true);

      // Build a snapshot for cart display
      const itemSnapshot = {
        name: propertyDetails?.title || 'Propriété',
        description: propertyDetails?.description || '',
        thumbnail: propertyDetails?.photos?.[0] || '',
        location: propertyDetails?.localisation ? `${propertyDetails.localisation.city}, ${propertyDetails.localisation.address}` : 'Localisation non disponible',
        owner: propertyDetails?.owner
      };

      await addToCart({
        itemType: 'property',
        itemId: propertyId,
        checkIn: localCheckIn,
        checkOut: localCheckOut,
        guests: Number(guestCount),
        guestMessage,
        subtotal: total,
        totalNights: nights,
        pricePerNight,
        itemSnapshot
      });

      setAddedToCart(true);
      navigate('/cart/add-success', { state: { from: 'booking-request', propertyId } });
    } catch (e) {
      console.error('Add to cart failed:', e);
      setError(e.message || "Échec de l'ajout au panier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Demander une réservation
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-20 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-end">
          
          {/* Left Section - Booking Form */}
          <div className="space-y-6 lg:sticky lg:bottom-4 lg:self-end">
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
            )}

            {/* Dates Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Dates de séjour</h3>
                {!fromBlocked && (
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {localCheckIn && localCheckOut ? 'Modifier' : 'Sélectionner'}
                  </button>
                )}
              </div>
              
              {/* Show info message for blocked dates */}
              {fromBlocked && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Dates pré-réservées</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Ces dates proviennent de votre blocage. Confirmez votre réservation pour finaliser.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {localCheckIn && localCheckOut ? (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium text-gray-800">{formatDateForDisplay(localCheckIn)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium text-gray-800">{formatDateForDisplay(localCheckOut)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Invités:</span>
                      <span className="font-medium text-gray-800">{guests || state?.guests || 1}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Aucune date sélectionnée</p>
                    <p className="text-gray-400 text-xs mt-1">Cliquez sur "Sélectionner" pour choisir vos dates</p>
                  </div>
                )}
              </div>
            </div>

            {/* ID Photos Upload */}
            <div className={`bg-white p-6 rounded-lg shadow-sm ${fieldErrors.idPhotos ? 'border-2 border-red-500' : ''}`}>
              <h2 className={`text-xl font-semibold mb-4 ${fieldErrors.idPhotos ? 'text-red-600' : 'text-gray-800'}`}>
                Pièce d'identité <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Veuillez télécharger une photo de votre pièce d'identité (carte d'identité, passeport, etc.)
              </p>
              
              <S3ImageUpload
                onUpload={handleIdPhotoUpload}
                multiple={true}
                folder="id-documents"
                maxFiles={5}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
                acceptedExtensions={['jpg', 'jpeg', 'png', 'pdf']}
                maxSize={5 * 1024 * 1024} // 5MB
                showPreview={true}
                disabled={idPhotosUploading}
                className="mb-4"
              />
              
              {(idPhotosUploading || idPhotos.length > 0) && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <div className="flex items-center">
                    {idPhotosUploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Téléversement en cours...
                      </>
                    ) : (
                      <>✔️ Pièce d'identité ajoutée</>
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded Photos Preview */}
              {idPhotos.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Photos téléchargées ({idPhotos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {idPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={`ID ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
              <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                          ×
              </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                          {photo.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Guest Message */}
            <div className={`bg-white p-6 rounded-lg shadow-sm ${fieldErrors.guestMessage ? 'border-2 border-red-500' : ''}`}>
              <h2 className={`text-xl font-semibold mb-4 ${fieldErrors.guestMessage ? 'text-red-600' : 'text-gray-800'}`}>
                Message à l'hôte <span className="text-red-500">*</span>
              </h2>
              <textarea
                value={guestMessage}
                onChange={(e) => handleGuestMessageChange(e.target.value)}
                placeholder="Écrivez un message à l'hôte concernant votre demande de réservation..."
                className={`w-full border p-3 rounded-lg h-32 resize-none focus:ring-2 focus:border-transparent ${
                  fieldErrors.guestMessage 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-green-500'
                }`}
              />
            </div>

            {/* Payment Section removed: reservation now added to cart */}

            {/* Confirmation */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirmation</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium">{localCheckIn ? formatIsoDate(localCheckIn) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">{localCheckOut ? formatIsoDate(localCheckOut) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Invités:</span>
                  <span className="font-medium">{guests || "N/A"}</span>
                </div>
                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Message:</span>
                    <span className="font-medium text-sm max-w-xs text-right">{guestMessage || "Aucun message"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Photos d'identité:</span>
                    <span className="font-medium text-sm">{idPhotos.length} photo{idPhotos.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
            </div>
          </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleGoBack}
                className="flex-1 py-3 px-6 rounded-lg text-white font-semibold bg-gray-700 hover:bg-gray-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleAddToCart}
                disabled={
                  loading ||
                  !localCheckIn ||
                  !localCheckOut ||
                  (!guests && !state?.guests) ||
                  idPhotosUploading ||
                  !idPhotos || idPhotos.length === 0 ||
                  !guestMessage || guestMessage.trim().length === 0
                }
                className={`flex-1 py-3 px-6 rounded-lg text-white font-semibold transition ${
                  loading ||
                  !localCheckIn ||
                  !localCheckOut ||
                  (!guests && !state?.guests) ||
                  idPhotosUploading ||
                  !idPhotos || idPhotos.length === 0 ||
                  !guestMessage || guestMessage.trim().length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-800 hover:bg-green-900'
                }`}
              >
                {loading ? "Ajout..." : "Ajouter au panier"}
              </button>
            </div>

            {/* Success prompt moved to dedicated page */}
          </div>

          {/* Right Section - Property Information */}
          <div className="space-y-6 lg:sticky lg:bottom-4 lg:self-end">
            {propertyLoading ? (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : propertyDetails ? (
              <>
                {/* Property Image */}
                {propertyDetails.photos && propertyDetails.photos.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <img
                      src={propertyDetails.photos[0]}
                      alt={propertyDetails.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Property Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">{propertyDetails.title}</h2>
                  
                  {propertyDetails.description && (
                    <p className="text-gray-600 mb-4">{propertyDetails.description}</p>
                  )}

                  <div className="space-y-3">
                    {propertyDetails.localisation && (
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-gray-400 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-800">
                            {propertyDetails.localisation.city}, {propertyDetails.localisation.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {propertyDetails.info && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-600">
                          {propertyDetails.info.guests} invité{propertyDetails.info.guests > 1 ? 's' : ''} • {propertyDetails.info.bedrooms} chambre{propertyDetails.info.bedrooms > 1 ? 's' : ''} • {propertyDetails.info.bathrooms} salle{propertyDetails.info.bathrooms > 1 ? 's' : ''} de bain
                        </span>
                      </div>
                    )}

                    {propertyDetails.price && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-gray-600">
                          {propertyDetails.price.weekdays ? `${propertyDetails.price.weekdays} MAD/nuit` : 'Prix sur demande'}
                        </span>
                      </div>
                    )}

                    {propertyDetails.propertyType && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-gray-600 capitalize">{propertyDetails.propertyType}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Host Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Hôte</h3>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                      {hostPhoto && hostPhoto !== "A" ? (
                        <img src={hostPhoto} alt="Host" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-gray-600 font-semibold text-lg">
                          {hostName ? hostName.charAt(0).toUpperCase() : "H"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{hostName || "Hôte"}</p>
                      <p className="text-sm text-gray-600">Propriétaire</p>
                    </div>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Détails de la réservation</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium text-gray-800">{localCheckIn ? formatIsoDate(localCheckIn) : "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium text-gray-800">{localCheckOut ? formatIsoDate(localCheckOut) : "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Invités:</span>
                      <span className="font-medium text-gray-800">{guests || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Durée:</span>
                      <span className="font-medium text-gray-800">
                        {localCheckIn && localCheckOut ? 
                          `${Math.ceil((new Date(localCheckOut) - new Date(localCheckIn)) / (1000 * 60 * 60 * 24))} nuit${Math.ceil((new Date(localCheckOut) - new Date(localCheckIn)) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}` : 
                          "N/A"
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Détail des prix</h3>
                  {(() => {
                    const { nights, pricePerNight, total } = calculateTotal();
                    return (
                      <div className="space-y-3">
                        {nights > 0 && pricePerNight > 0 ? (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">
                                {propertyDetails.price.weekdays} MAD × {nights} nuit{nights > 1 ? 's' : ''}
                              </span>
                              <span className="font-medium text-gray-800">
                                {(pricePerNight * nights).toLocaleString()} MAD
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-t-2 border-gray-200">
                              <span className="text-lg font-semibold text-gray-800">Total</span>
                              <span className="text-xl font-bold text-green-600">
                                {total.toLocaleString()} MAD
                              </span>
                            </div>
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-700">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                Prix final - Aucun frais supplémentaire
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">
                              {!propertyDetails?.price?.weekdays 
                                ? "Prix non disponible" 
                                : "Sélectionnez vos dates pour voir le prix"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-500">Impossible de charger les détails de la propriété</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <DateRangeCalendar
              title="Sélectionner les dates"
              initialCheckIn={localCheckIn}
              initialCheckOut={localCheckOut}
              fetchAvailability={async () => {
                try {
                  // Use booking status endpoint to get active booking ranges
                  const res = await api.get(`/api/booking/status/${propertyId}`);
                  const ranges = res?.data?.unavailableDates || [];
                  const blocked = [];
                  const boundaryCheckIns = [];
                  const fullyBlockedBoundaries = [];
                  for (const r of ranges) {
                    const start = new Date(r.checkIn);
                    const end = new Date(r.checkOut);
                    boundaryCheckIns.push(new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())).toISOString());
                    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                      blocked.push(new Date(d).toISOString());
                    }
                  }
                  const starts = new Set(boundaryCheckIns);
                  for (const r of ranges) {
                    const out = new Date(r.checkOut);
                    const outIso = new Date(Date.UTC(out.getFullYear(), out.getMonth(), out.getDate())).toISOString();
                    if (starts.has(outIso)) fullyBlockedBoundaries.push(outIso);
                  }
                  return { blockedDates: blocked, boundaryCheckIns, fullyBlockedBoundaries };
                } catch (_) {
                  return [];
                }
              }}
              onApply={(startIso, endIso) => handleDateSelection(startIso, endIso)}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}