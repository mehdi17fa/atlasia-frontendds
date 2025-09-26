// BookingRequest.js
import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

export default function BookingRequest() {
  const { propertyId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { bookingData, authToken, hostId, hostName, hostPhoto } = state || {};
  const { checkIn, checkOut, guests } = bookingData || {};

  const [step, setStep] = useState(1);
  const [guestMessage, setGuestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && !guestMessage.trim()) {
      setError("Veuillez entrer un message pour l'hôte.");
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
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
      // Step 1: Create booking
      const bookingPayload = {
        propertyId,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guests: Number(guests),
        guestMessage,
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

      console.log("Booking response:", bookingResponse.data);

      if (!bookingResponse.data.success) {
        throw new Error("Booking creation failed");
      }

      const bookingId = bookingResponse.data.bookingId;

      const senderId = bookingData.userId || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))._id : null);

      if (!senderId) {
        throw new Error("User ID not found");
      }

      // Step 2: Create or get conversation
      let conversationId = null;
      try {
        const conversationPayload = {
          senderId,
          receiverId: hostId,
        };

        console.log("Creating conversation with payload:", conversationPayload);
        console.log("Attempting POST to:", `${API_BASE_URL}/chat/conversation`);

        const conversationResponse = await axios.post(
          `${API_BASE_URL}/chat/conversation`,
          conversationPayload,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        console.log("Conversation response:", conversationResponse.data);
        conversationId = conversationResponse.data._id;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        console.warn("Proceeding without conversation creation");
      }

      // Step 3: Send guestMessage as chat message (if conversationId exists)
      if (conversationId) {
        try {
          const messagePayload = {
            conversationId,
            senderId,
            text: `Booking request for property ${propertyId}: ${guestMessage}`,
          };

          console.log("Sending chat message with payload:", messagePayload);
          console.log("Attempting POST to:", `${API_BASE_URL}/chat/message`);

          const messageResponse = await axios.post(
            `${API_BASE_URL}/chat/message`,
            messagePayload,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          console.log("Message response:", messageResponse.data);
        } catch (err) {
          console.error("Failed to send chat message:", err);
          console.warn("Proceeding to chat without sending message");
        }
      }

      // Step 4: Redirect to chat with updated chatData
      console.log("Navigating to chat with state:", {
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
      });

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
      setError(err?.response?.data?.message || "Failed to request booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">
          Demander une réservation
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
        )}

        {/* Step 1: Booking Details */}
        {step === 1 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Étape 1: Détails de la réservation</h2>
            <p><strong>Propriété ID:</strong> {propertyId}</p>
            <p><strong>Check-in:</strong> {checkIn || "N/A"}</p>
            <p><strong>Check-out:</strong> {checkOut || "N/A"}</p>
            <p><strong>Invités:</strong> {guests || "N/A"}</p>
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-full text-white font-semibold bg-green-800 hover:bg-green-900 transition mt-4"
            >
              Suivant
            </button>
          </div>
        )}

        {/* Step 2: Guest Message */}
        {step === 2 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Étape 2: Message à l'hôte</h2>
            <textarea
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              placeholder="Écrivez un message à l'hôte concernant votre demande de réservation..."
              className="w-full border p-2 rounded mb-4 h-32"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-full text-white font-semibold bg-gray-700 hover:bg-gray-800 transition"
              >
                Retour
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-full text-white font-semibold bg-green-800 hover:bg-green-900 transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Request */}
        {step === 3 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Étape 3: Confirmer la demande</h2>
            <p><strong>Check-in:</strong> {checkIn || "N/A"}</p>
            <p><strong>Check-out:</strong> {checkOut || "N/A"}</p>
            <p><strong>Invités:</strong> {guests || "N/A"}</p>
            <p><strong>Message à l'hôte:</strong> {guestMessage || "Aucun message"}</p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-full text-white font-semibold bg-gray-700 hover:bg-gray-800 transition"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-1 py-3 rounded-full text-white font-semibold ${
                  loading ? "bg-gray-400" : "bg-green-800 hover:bg-green-900"
                } transition`}
              >
                {loading ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}