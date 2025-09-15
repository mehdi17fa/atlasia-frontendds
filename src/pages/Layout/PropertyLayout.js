import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactComponent as ArrowLeftIcon } from '../../assets/icons/arrow-left.svg';
import axios from 'axios';
import S3Image from "../../components/S3Image";
import ImageCarousel from "../../components/ImageCarousel";
import SinglePropertyMap from "../../components/SinglePropertyMap";

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

export default function PropertyLayout({
  title,
  location,
  rating,
  reviewCount,
  mainImage,
  host,
  checkInTime,
  features,
  associatedPacks,
  mapImage,
  reviews,
  user,
  token,
}) {
  const navigate = useNavigate();
  const { id: propertyId } = useParams();

  const fallbackToken = localStorage.getItem('accessToken');
  const isLoggedIn = !!user && !!(token || fallbackToken);
  const authToken = token || fallbackToken;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [instantBooking, setInstantBooking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('User object:', user);
    console.log('Token prop:', token);
    console.log('Fallback token (localStorage):', fallbackToken);
    console.log('Is logged in:', isLoggedIn);
    console.log('Loading state:', loading);
  }, [user, token, fallbackToken, isLoggedIn, loading]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        console.log('Fetching property from:', `${API_BASE_URL}/property/public/${propertyId}`);
        const response = await axios.get(`${API_BASE_URL}/property/public/${propertyId}`);
        setInstantBooking(response.data.property?.instantBooking || false);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details. Please try again.');
      }
    };
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const handleBooking = () => {
    console.log('handleBooking called. User:', user, 'Token:', authToken, 'isLoggedIn:', isLoggedIn, 'InstantBooking:', instantBooking);

    if (!isLoggedIn) {
      console.log('Redirecting to login because user or token is missing');
      setError('Please log in to book this property.');
      navigate('/login');
      return;
    }

    if (!checkIn || !checkOut || guests < 1) {
      setError('Please provide valid check-in, check-out dates, and number of guests.');
      return;
    }

    const bookingData = {
      propertyId,
      checkIn,
      checkOut,
      guests: Number(guests),
      userId: user._id,
    };

    if (instantBooking) {
      navigate(`/booking/confirm/${propertyId}`, {
        state: {
          bookingData,
          authToken,
          hostId: host?.id,
          hostName: host?.name || "Hôte",
          hostPhoto: host?.photo || "A",
        },
      });
    } else {
      try {
        axios.get(`${API_BASE_URL}/property/public/${propertyId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }).then(() => {
          navigate(`/booking/request/${propertyId}`, {
            state: {
              bookingData,
              authToken,
              hostId: host?.id,
              hostName: host?.name || "Hôte",
              hostPhoto: host?.photo || "A",
            },
          });
        }).catch((err) => {
          console.error('Property validation error:', err);
          setError('Property is not available for booking.');
        });
      } catch (err) {
        console.error('Error checking property:', err);
        setError('Failed to validate property. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <S3Image 
          src={mainImage} 
          alt={title} 
          className="w-full h-96 object-cover" 
          fallbackSrc="/villa1.jpg"
        />
        <button
          className="absolute top-4 left-4 p-3 bg-black bg-opacity-30 rounded-full text-white flex items-center justify-center shadow-md"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="w-5 h-5" fill="white" stroke="white" />
        </button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-600 mt-1">{location}</p>
        <div className="flex items-center space-x-2 text-gray-500 mt-1">
          <span className="text-green-600 font-medium">★ {rating}</span>
          <span>·</span>
          <span>{reviewCount} reviews</span>
        </div>
      </div>
      {host ? (
        <div className="flex items-center space-x-4 mt-4">
          <S3Image
            src={host.photo || "/profilepic.jpg"}
            alt={host.name || 'Host'}
            className="w-14 h-14 rounded-full object-cover shadow"
            fallbackSrc="/profilepic.jpg"
          />
          <div>
            <p className="font-medium">{host.name || 'Unknown Host'}</p>
            <p className="text-sm text-gray-500">Superhôte · Hôte depuis 7 ans</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 italic mt-4">Informations sur l'hôte non disponibles.</p>
      )}
      <div className="border rounded-2xl p-4 shadow-sm">
        <p className="font-medium">🕒 Check-in</p>
        <p className="text-sm text-gray-500">à partir de {checkInTime}</p>
      </div>
      <div className="border rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">Book This Property</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min={checkIn || new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Guests</label>
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-semibold text-lg mb-3">Ce que propose ce logement</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 font-medium">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              {feature.icon}
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
        <button className="text-green-600 text-sm mt-2 float-right">Afficher plus →</button>
      </div>
      <div>
        <h2 className="font-semibold text-lg mb-3">Les packs associés</h2>
        <div className="space-y-3">
          {associatedPacks.map((pack, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 rounded-xl shadow hover:shadow-lg transition">
              <img
                src={pack.image || '/placeholder-image.jpg'}
                alt={pack.name || 'Pack image'}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium">{pack.name || 'Unnamed Pack'}</p>
                <p className="text-sm text-gray-500">{pack.location || 'No location'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-semibold text-lg mb-3">Localisation</h2>
        <SinglePropertyMap location={location} />
      </div>
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-green-600 font-medium">★ {rating}</span>
          <span className="text-sm text-gray-500">{reviewCount} reviews</span>
        </div>
        {reviews.map((review, index) => (
          <div key={index} className="mt-2 bg-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="font-medium">{review.name}</p>
            <p className="text-sm text-gray-500">{review.date}</p>
            <p className="mt-2 text-sm">"{review.comment}"</p>
          </div>
        ))}
      </div>
      <div className="border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {host && (
          <div className="flex items-center space-x-3">
            <img
              src={host.photo || '/placeholder-profile.jpg'}
              alt={host.name || 'Host'}
              className="w-12 h-12 rounded-full object-cover"
            />
            <p className="font-medium">{host.name || 'Unknown Host'}</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => host?.id && navigate(`/owner/${host.id}`)}
            disabled={!host?.id}
            className={`px-4 py-2 rounded-2xl text-white font-semibold ${host?.id ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
          >
            Voir plus
          </button>
          <button
            onClick={handleBooking}
            disabled={!isLoggedIn || loading}
            className={`px-4 py-2 rounded-2xl text-white font-semibold ${isLoggedIn && !loading ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
          >
            {loading ? 'Processing...' : 'Réserver maintenant'}
          </button>
        </div>
      </div>
    </div>
  );
}