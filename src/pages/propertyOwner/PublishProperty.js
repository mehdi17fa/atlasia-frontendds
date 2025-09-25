import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { usePropertyCreation } from "../../context/PropertyCreationContext";

const API_BASE = process.env.REACT_APP_API_URL;

export default function PublishProperty() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const { clearPropertyData } = usePropertyCreation();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingType, setBookingType] = useState("normal"); // default: normal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authToken =
    token ||
    localStorage.getItem("atlasia_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    user?.accessToken ||
    user?.token;

  // Debug bookingType state
  useEffect(() => {
    console.log("Current bookingType:", bookingType);
    console.log("instantBooking value to send:", bookingType === "instant");
  }, [bookingType]);

  const handlePublish = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!authToken) {
      console.log("🚨 No auth token found for publish:", {
        hasUser: !!user,
        hasToken: !!token,
        localStorage: {
          atlasia_access_token: !!localStorage.getItem("atlasia_access_token"),
          accessToken: !!localStorage.getItem("accessToken")
        }
      });
      setError("Veuillez vous connecter pour publier.");
      setLoading(false);
      return;
    }

    if (!startDate || !endDate) {
      setError("Veuillez sélectionner les deux dates.");
      setLoading(false);
      return;
    }

    const payload = {
      start: startDate,
      end: endDate,
      instantBooking: bookingType === "instant",
    };

    console.log("Sending payload to /api/property/:id/publish:", payload);

    try {
      // Step 1: Call the publish endpoint
      const publishResponse = await axios.patch(
        `${API_BASE}/api/property/${id}/publish`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log("Publish response:", publishResponse.data);

      // Step 2: Update instantBooking separately using /api/property/:id
      // This is a fallback since the publish endpoint ignores instantBooking
      const updateResponse = await axios.patch(
        `${API_BASE}/api/property/${id}`,
        { instantBooking: bookingType === "instant" },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log("Update instantBooking response:", updateResponse.data);

      setSuccess("Propriété publiée avec succès !");
      
      // Clear the property creation context after successful publication
      clearPropertyData();
      
      setTimeout(() => navigate("/my-properties"), 1500);
    } catch (err) {
      console.error("Publish error:", err);
      setError(err?.response?.data?.message || "Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!authToken) {
      console.log("🚨 No auth token found for save draft:", {
        hasUser: !!user,
        hasToken: !!token,
        localStorage: {
          atlasia_access_token: !!localStorage.getItem("atlasia_access_token"),
          accessToken: !!localStorage.getItem("accessToken")
        }
      });
      setError("Veuillez vous connecter pour enregistrer en brouillon.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.patch(
        `${API_BASE}/api/property/${id}`,
        { status: "draft" },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log("Draft response:", response.data);

      setSuccess("Propriété sauvegardée en brouillon !");
      setTimeout(() => navigate("/my-properties"), 1000);
    } catch (err) {
      console.error("Draft error:", err);
      setError(err?.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">
          Publier votre propriété
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{success}</div>
        )}

        <label className="block mb-2 font-semibold">Date de début</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        <label className="block mb-2 font-semibold">Date de fin</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        {/* Booking type selection */}
        <label className="block mb-2 font-semibold">Type de réservation</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="bookingType"
              value="normal"
              checked={bookingType === "normal"}
              onChange={(e) => setBookingType(e.target.value)}
            />
            Normal
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="bookingType"
              value="instant"
              checked={bookingType === "instant"}
              onChange={(e) => setBookingType(e.target.value)}
            />
            Instantané
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePublish}
            disabled={loading}
            className={`flex-1 py-3 rounded-full text-white font-semibold ${
              loading ? "bg-gray-400" : "bg-green-800 hover:bg-green-900"
            } transition`}
          >
            {loading ? "Publication..." : "Publier"}
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className={`flex-1 py-3 rounded-full text-white font-semibold ${
              loading ? "bg-gray-400" : "bg-gray-700 hover:bg-gray-800"
            } transition`}
          >
            {loading ? "Enregistrement..." : "Sauvegarder en brouillon"}
          </button>
        </div>
      </div>
    </div>
  );
}