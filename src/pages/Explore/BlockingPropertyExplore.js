import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { AuthContext } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function BlockingPropertyExplore() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperties = async () => {
    try {
      console.log("Fetching properties for blocking...");
      const res = await api.get("/api/property/available-for-blocking", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API response:", res.data);
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error("❌ Error fetching properties:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.message || "Failed to load properties");
      if (err.response?.status === 401 || !token) {
        console.warn("Unauthorized, redirecting to /login");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      console.warn("No token found, redirecting to /login");
      navigate("/login");
      return;
    }
    fetchProperties();
  }, [token, navigate]);

  // Refresh properties every 10 seconds to reflect bookings and expired blocks
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Refreshing properties to check for bookings...");
      fetchProperties();
    }, 10000); // 10 seconds - faster refresh to show booking changes
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = (id) => {
    navigate(`/blocking-preview/${id}`);
  };

  if (loading) {
    return (
      <>
        {/* White background bar at top for desktop - prevents content overlap when scrolling */}
        <div className="hidden md:block fixed top-0 left-0 right-0 h-20 bg-white z-30"></div>
        <p className="text-center md:pt-28 mt-20">Chargement...</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* White background bar at top for desktop - prevents content overlap when scrolling */}
        <div className="hidden md:block fixed top-0 left-0 right-0 h-20 bg-white z-30"></div>
        
        <div className="px-4 md:pt-28 py-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-semibold mb-2">Erreur</h3>
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate("/partner-dashboard")}
          className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800"
        >
          Retour au tableau de bord
        </button>
      </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {/* White background bar at top for desktop - prevents content overlap when scrolling */}
      <div className="hidden md:block fixed top-0 left-0 right-0 h-20 bg-white z-30"></div>
      
      <div className="max-w-6xl mx-auto px-4 md:pt-28 py-8">
        <h1 className="text-3xl font-bold mb-6">Explorer les propriétés pour blocage</h1>
        {properties.length === 0 ? (
          <p className="text-gray-500">Aucune propriété disponible pour le blocage.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property._id}
                className="border rounded-lg overflow-hidden shadow-md cursor-pointer"
                onClick={() => handleCardClick(property._id)}
              >
                <img
                  src={property.image || "/placeholder1.jpg"}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{property.title}</h2>
                  <p className="text-gray-600">{property.location}</p>
                  <p className="text-gray-600">{property.price} MAD/nuit</p>
                  <div className="flex items-center mt-2">
                    <span className="text-yellow-500">★ {property.rating || 0}</span>
                    <span className="ml-2 text-gray-500">({property.reviewCount || 0} avis)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}