import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : "http://localhost:4000/api";

export default function BookingConfirm() {
  const { propertyId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { bookingData, authToken } = state || {};
  const { checkIn, checkOut, guests } = bookingData || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    // Try to get token from state first, then from localStorage as fallback
    const token = authToken || 
                 localStorage.getItem("accessToken");
    
    console.log("Auth Debug (Confirm):", {
      authTokenFromState: authToken,
      tokenFromLocalStorage: localStorage.getItem("accessToken"),
      finalToken: token ? token.substring(0, 20) + "..." : "No token"
    });
    
    if (!token || !bookingData) {
      setError("Missing authentication or booking data.");
      console.error("Missing data:", { token: !!token, bookingData: !!bookingData });
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        propertyId,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guests: Number(guests),
        guestMessage: "", // No message for instant booking
      };

      console.log("Confirming booking with payload:", payload);

      const response = await axios.post(`${API_BASE_URL}/booking`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Booking response:", response.data);

      if (response.data.success) {
        navigate("/my-bookings", {
          state: { message: "Booking confirmed successfully!" },
        });
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err?.response?.data?.message || "Failed to confirm booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Confirmer votre réservation</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Détails de la réservation</h2>
          <p><strong>Propriété ID:</strong> {propertyId}</p>
          <p><strong>Check-in:</strong> {checkIn || "N/A"}</p>
          <p><strong>Check-out:</strong> {checkOut || "N/A"}</p>
          <p><strong>Invités:</strong> {guests || "N/A"}</p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`w-full py-3 rounded-full text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-green-800 hover:bg-green-900"
          } transition`}
        >
          {loading ? "Confirmation..." : "Confirmer réservation"}
        </button>
      </div>
    </div>
  );
}