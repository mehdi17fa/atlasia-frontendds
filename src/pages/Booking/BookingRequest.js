// BookingRequest.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import S3ImageUpload from "../../components/S3ImageUpload";
import ReservationCalendar from "../../components/ReservationCalendar";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

export default function BookingRequest() {
  const { propertyId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { bookingData, authToken, hostId, hostName, hostPhoto } = state || {};
  const { guests } = bookingData || {};
  const [localCheckIn, setLocalCheckIn] = useState(bookingData?.checkIn || "");
  const [localCheckOut, setLocalCheckOut] = useState(bookingData?.checkOut || "");

  const [guestMessage, setGuestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [propertyName, setPropertyName] = useState("");
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [idPhotos, setIdPhotos] = useState([]);
  const [idPhotosUploading, setIdPhotosUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: ""
  });
  const [fieldErrors, setFieldErrors] = useState({
    guestMessage: false,
    idPhotos: false,
    paymentMethod: false,
    cardDetails: false
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch property details on component mount
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!propertyId) {
        setPropertyLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/property/public/${propertyId}`);
        if (response.data && response.data.property) {
          const property = response.data.property;
          setPropertyDetails(property);
          setPropertyName(property.title || "Propriété");
        } else {
          setPropertyName("Propriété");
        }
      } catch (err) {
        console.error("Error fetching property details:", err);
        setPropertyName("Propriété");
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
    setLocalCheckIn(checkInDate);
    setLocalCheckOut(checkOutDate);
    setShowCalendar(false);
  };

  const handleIdPhotoUpload = (results) => {
    try {
      setIdPhotosUploading(true);
      
      // Handle single or multiple upload results
      const uploadResults = Array.isArray(results) ? results : [results];
      
      const newPhotos = uploadResults.map(result => {
        // Ensure we have the required fields
        if (!result || (!result.url && !result.key)) {
          throw new Error("Invalid upload result received");
        }
        
        return {
          url: result.url || result.key,
          key: result.key || result.url,
          name: result.fileName || result.name || "uploaded-photo",
          size: result.size || 0
        };
      });
      
      // Update state with functional update to ensure we get the latest state
      setIdPhotos(prev => [...prev, ...newPhotos]);
      
      // Clear field errors when photos are uploaded
      setFieldErrors(prev => ({ ...prev, idPhotos: false }));
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error processing uploaded photos:", error);
      setError("Failed to process uploaded photos. Please try again.");
    } finally {
      setIdPhotosUploading(false);
    }
  };

  const removePhoto = (index) => {
    setIdPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    // Clear payment method error when user selects a method
    setFieldErrors(prev => ({ ...prev, paymentMethod: false, cardDetails: false }));
    
    // Reset card details when switching to cash or no method
    if (method === "cash" || method === "") {
      setCardDetails({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardholderName: ""
      });
    }
  };

  const handleCardDetailsChange = (field, value) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear card details error when user starts typing
    setFieldErrors(prev => ({ ...prev, cardDetails: false }));
  };

  const handleGuestMessageChange = (value) => {
    setGuestMessage(value);
    // Clear guest message error when user starts typing
    setFieldErrors(prev => ({ ...prev, guestMessage: false }));
  };

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
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

  const handleSubmit = async () => {
    // Reset all field errors
    setFieldErrors({
      guestMessage: false,
      idPhotos: false,
      paymentMethod: false,
      cardDetails: false
    });

    let hasErrors = false;
    const newFieldErrors = { ...fieldErrors };

    // Validate guest message
    if (!guestMessage.trim()) {
      newFieldErrors.guestMessage = true;
      hasErrors = true;
    }

    // Validate ID photos
    if (idPhotos.length === 0) {
      newFieldErrors.idPhotos = true;
      hasErrors = true;
    }

    // Validate payment details
    if (!paymentMethod) {
      newFieldErrors.paymentMethod = true;
      hasErrors = true;
    }
    
    if (paymentMethod === "card") {
      if (!cardDetails.cardNumber.trim() || !cardDetails.expiryDate.trim() || 
          !cardDetails.cvv.trim() || !cardDetails.cardholderName.trim()) {
        newFieldErrors.cardDetails = true;
        hasErrors = true;
      } else {
        // Additional card validation
        const cardNumberDigits = cardDetails.cardNumber.replace(/\s/g, '');
        if (cardNumberDigits.length !== 16) {
          newFieldErrors.cardDetails = true;
          hasErrors = true;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
          newFieldErrors.cardDetails = true;
          hasErrors = true;
        }
        if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
          newFieldErrors.cardDetails = true;
          hasErrors = true;
        }
      }
    }

    // Update field errors and show general error if any fields are invalid
    setFieldErrors(newFieldErrors);
    
    if (hasErrors) {
      setError("Veuillez corriger les champs marqués en rouge avant de continuer.");
      return;
    }

    // Try to get token from state first, then from localStorage as fallback
    const token = authToken || 
                 localStorage.getItem("accessToken");
    
    console.log("Auth Debug:", {
      authTokenFromState: authToken,
      tokenFromLocalStorage: localStorage.getItem("accessToken"),
      finalToken: token ? token.substring(0, 20) + "..." : "No token"
    });
    
    if (!token || !bookingData || !hostId) {
      setError("Missing authentication, booking data, or host information.");
      console.error("Missing data:", { token: !!token, bookingData: !!bookingData, hostId: !!hostId });
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create booking (critical path)
      const bookingPayload = {
        propertyId,
        checkIn: new Date(localCheckIn).toISOString(),
        checkOut: new Date(localCheckOut).toISOString(),
        guests: Number(guests),
        guestMessage,
        idPhotos: idPhotos.map(photo => photo.key || photo.url),
        paymentMethod,
        ...(paymentMethod === "card" && {
          cardDetails: {
            cardNumber: cardDetails.cardNumber.replace(/\s/g, ''), // Remove spaces for storage
            expiryDate: cardDetails.expiryDate,
            cvv: cardDetails.cvv,
            cardholderName: cardDetails.cardholderName
          }
        })
      };

      console.log("Submitting booking request with payload:", bookingPayload);
      console.log("Using token:", token ? `${token.substring(0, 20)}...` : "No token");

      const bookingResponse = await axios.post(
        `${API_BASE_URL}/booking`,
        bookingPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Booking response:", bookingResponse.status, bookingResponse.data);

      const bookingData = bookingResponse?.data || {};
      const httpOk = bookingResponse?.status >= 200 && bookingResponse?.status < 300;
      const createdOk = bookingData.success === true || Boolean(bookingData.bookingId) || Boolean(bookingData.booking && bookingData.booking._id) || Boolean(bookingData._id || bookingData.id);
      if (!httpOk) {
        throw new Error(bookingData.message || "Booking creation failed");
      }
      if (!createdOk) {
        console.warn("Booking created (HTTP OK) but response body missing identifiers; proceeding without bookingId");
      }

      const bookingId = bookingData.bookingId || bookingData.booking?._id || bookingData._id || bookingData.id || null;

      const senderId = bookingData.userId || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))._id : null);

      if (!senderId) {
        console.warn("User ID not found for conversation; booking created but chat will be skipped");
      }

      // Step 2 (best-effort): Create conversation
      let conversationId = null;
      try {
        if (senderId && hostId) {
          const conversationPayload = { senderId, receiverId: hostId };
          console.log("Creating conversation with payload:", conversationPayload);
          const conversationResponse = await axios.post(
            `${API_BASE_URL}/chat/conversation`,
            conversationPayload,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          conversationId = conversationResponse.data._id;
        }
      } catch (err) {
        console.warn("Non-blocking: failed to create conversation", err?.response?.data || err.message);
      }

      // Step 3 (best-effort): Send guest message
      if (conversationId) {
        try {
          const messagePayload = {
            conversationId,
            senderId,
            text: `Booking request for property ${propertyId}: ${guestMessage}`,
          };
          await axios.post(
            `${API_BASE_URL}/chat/message`,
            messagePayload,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } catch (err) {
          console.warn("Non-blocking: failed to send chat message", err?.response?.data || err.message);
        }
      }

      // Step 4: Always navigate after successful booking
      navigate(`/chat/${hostId}`, {
        state: {
          chatData: {
            recipientId: hostId,
            avatar: hostPhoto || "A",
            sender: hostName || "Hôte",
          },
          conversationId,
          bookingId,
          propertyId,
          guestMessage,
          message: "Booking request sent successfully!",
        },
      });
    } catch (err) {
      console.error("Booking error:", err);
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error;
      const friendly = backendMsg || err?.message || "Failed to request booking. Please try again.";
      setError(friendly);
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
              <button
                  onClick={() => setShowCalendar(true)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                  Modifier
              </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium text-gray-800">{localCheckIn || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium text-gray-800">{localCheckOut || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Invités:</span>
                  <span className="font-medium text-gray-800">{guests || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* ID Photos Upload */}
            <div className={`bg-white p-6 rounded-lg shadow-sm ${fieldErrors.idPhotos ? 'border-2 border-red-500' : ''}`}>
              <h2 className={`text-xl font-semibold mb-4 ${fieldErrors.idPhotos ? 'text-red-600' : 'text-gray-800'}`}>
                Pièce d'identité {fieldErrors.idPhotos && <span className="text-red-500">*</span>}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Veuillez télécharger une photo de votre pièce d'identité (carte d'identité, passeport, etc.)
              </p>
              
              <S3ImageUpload
                onUpload={handleIdPhotoUpload}
                multiple={true}
                folder="id-documents"
                maxFiles={5}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png']}
                acceptedExtensions={['jpg', 'jpeg', 'png']}
                maxSize={5 * 1024 * 1024} // 5MB
                showPreview={true}
                disabled={idPhotosUploading}
                className="mb-4"
              />
              
              {idPhotosUploading && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <div className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing uploaded photos...
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
                          alt={`ID photo ${index + 1}`}
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
                Message à l'hôte {fieldErrors.guestMessage && <span className="text-red-500">*</span>}
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

            {/* Payment Section */}
            <div className={`bg-white p-6 rounded-lg shadow-sm ${fieldErrors.paymentMethod ? 'border-2 border-red-500' : ''}`}>
              <h2 className={`text-xl font-semibold mb-4 ${fieldErrors.paymentMethod ? 'text-red-600' : 'text-gray-800'}`}>
                Méthode de paiement {fieldErrors.paymentMethod && <span className="text-red-500">*</span>}
              </h2>
              
              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                <div className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === "cash" 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`} onClick={() => handlePaymentMethodChange("cash")}>
                  <input
                    type="radio"
                    id="cash"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="cash" className="ml-3 flex items-center cursor-pointer">
                    <svg className={`w-5 h-5 mr-2 ${paymentMethod === "cash" ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className={`font-medium ${paymentMethod === "cash" ? "text-green-800" : "text-gray-700"}`}>
                      Paiement en espèces
                    </span>
                  </label>
                </div>
                <div className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === "card" 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`} onClick={() => handlePaymentMethodChange("card")}>
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="card" className="ml-3 flex items-center cursor-pointer">
                    <svg className={`w-5 h-5 mr-2 ${paymentMethod === "card" ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className={`font-medium ${paymentMethod === "card" ? "text-green-800" : "text-gray-700"}`}>
                      Paiement par carte
                    </span>
                  </label>
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === "card" && (
                <div className={`border-t pt-6 ${fieldErrors.cardDetails ? 'border-red-200' : ''}`}>
                  <h3 className={`text-lg font-medium mb-4 ${fieldErrors.cardDetails ? 'text-red-600' : 'text-gray-800'}`}>
                    Détails de la carte {fieldErrors.cardDetails && <span className="text-red-500">*</span>}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de carte
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardDetailsChange('cardNumber', formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Date d'expiration
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={(e) => handleCardDetailsChange('expiryDate', formatExpiryDate(e.target.value))}
                        placeholder="MM/AA"
                        maxLength="5"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        value={cardDetails.cvv}
                        onChange={(e) => handleCardDetailsChange('cvv', e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        maxLength="4"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du titulaire
                      </label>
                      <input
                        type="text"
                        id="cardholderName"
                        value={cardDetails.cardholderName}
                        onChange={(e) => handleCardDetailsChange('cardholderName', e.target.value)}
                        placeholder="Nom comme indiqué sur la carte"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Vos informations de paiement sont sécurisées et chiffrées.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirmation</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium">{localCheckIn || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">{localCheckOut || "N/A"}</span>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paiement:</span>
                    <span className="font-medium text-sm">
                      {paymentMethod === "cash" ? "En espèces" : 
                       paymentMethod === "card" ? "Par carte" : "Non sélectionné"}
                      {paymentMethod === "card" && cardDetails.cardNumber && (
                        <span className="ml-2 text-xs text-gray-500">
                          (****{cardDetails.cardNumber.slice(-4)})
                        </span>
                      )}
                    </span>
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
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-1 py-3 px-6 rounded-lg text-white font-semibold ${
                  loading ? "bg-gray-400" : "bg-green-800 hover:bg-green-900"
                } transition`}
              >
                {loading ? "Envoi..." : "Confirmer la demande"}
              </button>
            </div>
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
                      <span className="font-medium text-gray-800">{localCheckIn || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium text-gray-800">{localCheckOut || "N/A"}</span>
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
        <ReservationCalendar
          propertyId={propertyId}
          onDateSelect={handleDateSelection}
          onClose={() => setShowCalendar(false)}
          initialCheckIn={localCheckIn}
          initialCheckOut={localCheckOut}
        />
      )}
    </div>
  );
}