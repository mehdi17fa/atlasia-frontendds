import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import S3Image from "../../components/S3Image";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

function CoHostingPropertyCard({ property, onManage }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <S3Image
          src={property.photos?.[0] || "/placeholder1.jpg"}
          alt={property.title}
          className="w-20 h-16 rounded-lg object-cover border border-gray-200"
          fallbackSrc="/placeholder1.jpg"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg">
                {property.title || "Titre non disponible"}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                📍 {property.localisation?.city || "Localisation non spécifiée"}
                {property.localisation?.address && `, ${property.localisation.address}`}
              </p>
              
              {/* Property Features */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                {property.info?.bedrooms && (
                  <span className="flex items-center">
                    🛏️ {property.info.bedrooms} chambres
                  </span>
                )}
                {property.info?.guests && (
                  <span className="flex items-center">
                    👥 {property.info.guests} invités
                  </span>
                )}
                {property.info?.bathrooms && (
                  <span className="flex items-center">
                    🚿 {property.info.bathrooms} sdb
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-3">
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                  ✅ Co-hôte actif
                </span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={() => onManage(property)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
              >
                📊 Gérer
              </button>
              <button
                onClick={() => window.open(`/property/${property._id}`, '_blank')}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors font-medium"
              >
                👁️ Voir
              </button>
            </div>
          </div>
          
          {/* Owner Info */}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Propriétaire:</strong> {property.owner?.fullName || property.owner?.displayName || "Nom non disponible"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color = "green" }) {
  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-${color}-600 text-sm font-medium`}>{title}</p>
          <p className={`text-2xl font-bold text-${color}-900 mt-1`}>{value}</p>
        </div>
        <div className={`text-${color}-500 text-2xl`}>{icon}</div>
      </div>
    </div>
  );
}

// Add this to your App.js routes:
// <Route path="/partner/cohosting-management" element={<PartnerCohostingManagement />} />

// Update the HomeIntermédiaire component:
const handleGererHosting = () => {
  navigate('/partner/cohosting-management');
};
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalReservations: 0,
    totalRevenue: 0
  });
  
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchCohostingProperties();
  }, []);

  const fetchCohostingProperties = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      
      if (!token) {
        toast.error("Veuillez vous reconnecter");
        navigate("/login");
        return;
      }

      console.log("🔍 Fetching cohosting properties...");

      const response = await axios.get(`${API_BASE}/api/partner/my-properties`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("📡 API Response:", response.data);
      
      if (response.data.success) {
        const propertiesData = response.data.properties || [];
        setProperties(propertiesData);
        
        // Calculate stats
        setStats({
          totalProperties: propertiesData.length,
          totalReservations: propertiesData.reduce((sum, prop) => sum + (prop.reservations?.length || 0), 0),
          totalRevenue: propertiesData.reduce((sum, prop) => sum + (prop.totalRevenue || 0), 0)
        });
        
        console.log("✅ Properties loaded:", propertiesData.length);
      } else {
        console.log("⚠️ API returned success: false");
      }
    } catch (err) {
      console.error("❌ Error fetching cohosting properties:", err);
      
      if (err.response?.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
        navigate("/login");
      } else if (err.response?.status === 403) {
        toast.error("Accès non autorisé - Vous devez être un partenaire");
      } else {
        toast.error("Erreur lors du chargement des propriétés");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManageProperty = (property) => {
    // Navigate to property management page or open modal
    console.log("Managing property:", property);
    toast.success(`Gestion de ${property.title} (à implémenter)`);
    // You can navigate to a specific property management page
    // navigate(`/partner/manage-property/${property._id}`);
  };

  const handleGoBack = () => {
    navigate("/home-intermediaire");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Chargement de vos co-hébergements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={handleGoBack}
                className="text-green-600 hover:text-green-800 font-medium text-sm mb-2 flex items-center"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Mes Co-hébergements
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenue {user?.fullName || user?.displayName || "Partenaire"} 👋
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-2">🤝</div>
              <p className="text-sm text-gray-500">Statut: Partenaire actif</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="Propriétés gérées"
            value={stats.totalProperties}
            icon="🏠"
            color="green"
          />
          <StatsCard
            title="Réservations totales"
            value={stats.totalReservations}
            icon="📅"
            color="blue"
          />
          <StatsCard
            title="Revenus générés"
            value={`${stats.totalRevenue.toLocaleString()} DH`}
            icon="💰"
            color="yellow"
          />
        </div>

        {/* Properties Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              🏠 Propriétés en Co-hébergement
              {properties.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                  {properties.length}
                </span>
              )}
            </h2>
            <button
              onClick={fetchCohostingProperties}
              className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
            >
              🔄 Actualiser
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Aucun co-hébergement actif
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Vous n'avez pas encore de propriétés en co-hébergement.<br />
                Explorez les propriétés disponibles et envoyez des demandes !
              </p>
              <button
                onClick={() => navigate("/cohosting-explore")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                🔍 Explorer les propriétés
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <CoHostingPropertyCard
                  key={property._id}
                  property={property}
                  onManage={handleManageProperty}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {properties.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/cohosting-explore")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                ➕ Demander plus de propriétés
              </button>
              <button
                onClick={() => toast.info("Fonctionnalité à venir")}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                📊 Voir les statistiques détaillées
              </button>
              <button
                onClick={() => toast.info("Fonctionnalité à venir")}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                📧 Contacter les propriétaires
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
