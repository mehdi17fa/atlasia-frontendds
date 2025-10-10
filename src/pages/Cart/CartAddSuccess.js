import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../api';
import S3Image from '../../components/S3Image';

export default function CartAddSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const from = location.state?.from || null;
  const propertyId = location.state?.propertyId || null;

  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [packages, setPackages] = useState([]);

  // Derive checkout CTA enablement
  const hasItems = useMemo(() => (cart.items?.length || 0) > 0, [cart.items]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoading(true);
        setError('');

        // If we know propertyId, fetch its public details to get city
        let reservationCity = '';
        if (propertyId) {
          try {
            const res = await api.get(`/api/property/public/${propertyId}`);
            reservationCity = res?.data?.property?.localisation?.city || '';
            setCity(reservationCity);
          } catch (_) {
            // ignore, city may remain empty
          }
        }

        // Fetch published packages (used for activities & offers carousels)
        const params = new URLSearchParams();
        params.append('limit', '100');
        const url = `/api/packages/published?${params.toString()}`;
        const response = await api.get(url);
        const allPackages = response?.data?.packages || [];

        // Filter by city if available
        const filtered = reservationCity
          ? allPackages.filter(p => {
              const pkgCity = p?.property?.localisation?.city || p?.city || '';
              return typeof pkgCity === 'string' && pkgCity.toLowerCase() === reservationCity.toLowerCase();
            })
          : allPackages;

        setPackages(filtered);
      } catch (e) {
        setError("Impossible de charger les suggestions.");
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [propertyId]);

  const handleGoBack = () => {
    if (from) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const goCheckout = () => navigate('/cart/checkout');
  const continueExplore = () => navigate('/');

  // Derive lists
  const restaurants = useMemo(() => {
    // Pull embedded restaurants from packages as proxies for restaurant suggestions
    const list = [];
    packages.forEach(pkg => {
      (pkg.restaurants || []).forEach(r => list.push({ ...r, _pkgId: pkg._id }));
    });
    return list.slice(0, 20);
  }, [packages]);

  const activities = useMemo(() => {
    const list = [];
    packages.forEach(pkg => {
      (pkg.activities || []).forEach(a => list.push({ ...a, _pkgId: pkg._id }));
    });
    return list.slice(0, 20);
  }, [packages]);

  const offers = useMemo(() => packages.slice(0, 20), [packages]);

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
            <h1 className="text-2xl font-bold text-gray-800">Réservation ajoutée</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Progress Indicator */}
        <div className="mb-4 text-sm text-gray-600">Étape 2 sur 3 — Personnalisez votre séjour</div>

        {/* Success Banner */}
        <div className="bg-white border border-green-200 rounded-xl p-6 md:p-8 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Votre hébergement est prêt — il ne manque plus qu’à choisir comment le rendre inoubliable!</h2>
              <p className="text-gray-600">🎉 Votre séjour commence ici ! Découvrez nos meilleures offres pour l’enrichir{city ? ` à ${city}` : ''}.</p>
            </div>
          </div>
        </div>

        {/* Carousels */}
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {/* Restaurants */}
            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-xl font-bold">🍽️ Restaurants {city ? `à ${city}` : 'à proximité'}</h3>
                <button onClick={() => navigate('/restauration')} className="text-green-700 hover:text-green-800 text-sm font-medium">Voir tout</button>
              </div>
              {restaurants.length === 0 ? (
                <p className="text-gray-500">Aucune recommandation trouvée pour le moment.</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {restaurants.map((r, idx) => (
                    <div key={`${r._pkgId}-r-${idx}`} className="w-[240px] bg-white border rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                      {r.thumbnail ? (
                        <S3Image src={r.thumbnail} alt={r.name} className="h-36 w-full object-cover" fallbackSrc="/placeholder.jpg" />
                      ) : (
                        <div className="h-36 w-full bg-gray-100" />)
                      }
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{r.name || 'Restaurant'}</h4>
                        <button onClick={() => navigate('/restauration')} className="mt-2 w-full bg-white border text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm font-medium">Découvrir</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Activities */}
            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-xl font-bold">🧭 Activités populaires {city ? `à ${city}` : ''}</h3>
                <button onClick={() => navigate('/activites')} className="text-green-700 hover:text-green-800 text-sm font-medium">Voir tout</button>
              </div>
              {activities.length === 0 ? (
                <p className="text-gray-500">Aucune activité trouvée pour le moment.</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {activities.map((a, idx) => (
                    <div key={`${a._pkgId}-a-${idx}`} className="w-[240px] bg-white border rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                      {a.thumbnail ? (
                        <S3Image src={a.thumbnail} alt={a.name} className="h-36 w-full object-cover" fallbackSrc="/placeholder.jpg" />
                      ) : (
                        <div className="h-36 w-full bg-gray-100" />)
                      }
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{a.name || 'Activité'}</h4>
                        <button onClick={() => navigate('/activites')} className="mt-2 w-full bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium">+ Ajouter</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Offers & Packages */}
            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-xl font-bold">💎 Offres & Packages exclusifs {city ? `à ${city}` : ''}</h3>
                <button onClick={() => navigate('/packages')} className="text-green-700 hover:text-green-800 text-sm font-medium">Voir tout</button>
              </div>
              {offers.length === 0 ? (
                <p className="text-gray-500">Aucun package trouvé pour le moment.</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {offers.map((pkg) => (
                    <div key={pkg._id} className="w-[260px] bg-white border rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                      <div className="h-36 w-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                        <div className="text-white text-center">
                          <h4 className="font-semibold text-lg mb-1 line-clamp-1">{pkg.name || 'Package'}</h4>
                          <p className="text-xs opacity-90">Par {pkg.partner?.fullName || 'Partenaire'}</p>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{pkg.description || 'Une combinaison parfaite pour votre séjour.'}</p>
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/packages/${pkg._id}`)} className="flex-1 bg-white border text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm font-medium">Découvrir</button>
                          <button onClick={() => navigate(`/packages/${pkg._id}/book`)} className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium">+ Ajouter</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Bottom CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button onClick={goCheckout} disabled={!hasItems} className={`flex-1 py-3 px-6 rounded-lg text-white font-semibold ${hasItems ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-400 cursor-not-allowed'}`}>Passer au paiement</button>
          <button onClick={continueExplore} className="flex-1 py-3 px-6 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50">Continuer à explorer</button>
        </div>
      </div>
    </div>
  );
}


