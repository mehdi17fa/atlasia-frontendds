// pages/Restauration/Restauration.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurationCardGrid from '../../components/RestaurationCard/RestaurationCardGrid';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api';

const serviceLabels = {
  restaurant: 'Restaurant',
  catering: 'Traiteur',
  transportation: 'Transport',
  tours: 'Tours',
  activities: 'Activités',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
  'event-planning': 'Planification d\'événements',
  photography: 'Photographie',
  other: 'Autre'
};

export default function Restauration() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [b2bServices, setB2bServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hardcoded restaurant data (keeping existing)
  const partenaires = [
    {
      image: '../../Foodie.jpg',
      title: 'Foodie',
      location: 'Ifrane, Downtown',
      typelocation: '• City',
      fastfood: true,
      delivery: true,
    },
    {
      image: '../../Bonzai.jpeg',
      title: 'Bonsai',
      location: 'Ifrane, Downtown',
      typelocation: '• City',
      fastfood: false,
      delivery: true,
    },
  ];

  const matins = [
    {
      image: '../../LaPaix.jpg',
      title: 'La Paix',
      location: 'Ifrane, Centre',
      typelocation: '• Café',
      fastfood: false,
      delivery: true,
    },
    {
      image: '../../Frosty.jpeg',
      title: 'Fruity Bar',
      location: 'Ifrane, Avenue Atlas',
      typelocation: '• Bar à jus',
      fastfood: true,
      delivery: false,
    },
  ];

  // Fetch B2B services
  useEffect(() => {
    const fetchB2BServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/api/b2b/search', {
          params: { limit: 20 }
        });

        if (response.data.success && response.data.services) {
          // Map B2B services to the format expected by RestaurationCard
          const mappedServices = response.data.services.map(service => ({
            _id: service._id,
            image: service.profilePic || service.images?.[0] || '../../Foodie.jpg',
            title: service.title || service.businessName,
            location: service.location || 'Location non spécifiée',
            typelocation: `• ${serviceLabels[service.serviceType] || service.serviceType || 'Service'}`,
            serviceType: service.serviceType,
            price: service.price,
            priceUnit: service.priceUnit,
            isB2BService: true
          }));
          setB2bServices(mappedServices);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des services B2B:', err);
        setError('Erreur lors du chargement des services');
      } finally {
        setLoading(false);
      }
    };

    fetchB2BServices();
  }, []);

  // Handle service click - navigate to B2B service detail
  const handleServiceClick = (service) => {
    if (service.isB2BService && service._id) {
      navigate(`/service/${service._id}`, {
        state: { from: 'restauration' }
      });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-28 px-4 md:px-20">
      {/* B2B Services Section */}
      {loading ? (
        <div className="mt-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Chargement des services...</p>
        </div>
      ) : error ? (
        <div className="mt-6 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : b2bServices.length > 0 ? (
        <RestaurationCardGrid 
          title="Services disponibles:" 
          listings={b2bServices}
          onServiceClick={handleServiceClick}
        />
      ) : null}

      {/* Existing hardcoded sections */}
      <RestaurationCardGrid title="Partenaire Atlasia:" listings={partenaires} />
      <RestaurationCardGrid title="Pour vos bon matins:" listings={matins} />
    </div>
  );
}
