import React from "react";
import PropTypes from "prop-types";
import S3Image from "../../components/S3Image";
import SinglePropertyMap from "../../components/SinglePropertyMap";

const CoHostPropertyLayout = ({
  title,
  location,
  rating,
  reviewCount,
  mainImage,
  host,
  checkInTime,
  features,
  associatedPacks,
  mapLocation,
  reviews,
  user,
  onCoHostClick,
  requestSent,
  mode = "cohost",
  blockCheckIn,
  blockCheckOut,
  onBlockDatesChange,
  blockDatesError,
}) => {
  const resolvedMapLocation = mapLocation || location;
  return (
    <div className="max-w-7xl mx-auto p-6 pb-28">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => window.history.back()} className="p-2 bg-gray-200 rounded-full">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold">{title || "Propriété sans titre"}</h1>
      </div>

      <p className="text-gray-600 mb-2">{location || "Localisation non spécifiée"}</p>
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <span>⭐ {rating || 0}</span>
        <span>·</span>
        <span>{reviewCount || 0} avis</span>
      </div>

      {/* Main Image */}
      <S3Image
        src={mainImage || "/villa1.jpg"}
        alt={title}
        className="w-full h-96 object-cover rounded-2xl shadow mb-6"
        fallbackSrc="/villa1.jpg"
      />

      {/* Features */}
      {features?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {features.map((f, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              {f.icon}
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Host */}
      {host && (
        <div className="flex items-center space-x-4 mb-6">
          <S3Image
            src={host.profilePic || host.profileImage || host.photo || "/profilepic.jpg"}
            alt={host.name}
            className="w-14 h-14 rounded-full object-cover"
            fallbackSrc="/profilepic.jpg"
          />
          <div>
            <p className="font-semibold">{host.name}</p>
            <p className="text-sm text-gray-500">{host.email || host.name}</p>
          </div>
        </div>
      )}

      {/* Co-Host Button */}
      <div className="text-center mb-6">
        <button
          onClick={onCoHostClick}
          disabled={mode === 'block' && requestSent}
          className={`rounded-2xl px-6 py-3 font-semibold shadow flex items-center justify-center mx-auto transition-colors ${
            mode === 'booking'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : mode === 'block' && requestSent
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : mode === 'block'
              ? 'bg-red-700 hover:bg-red-800 text-white'
              : 'bg-blue-700 hover:bg-blue-800 text-white'
          }`}
        >
          {mode === 'booking'
            ? 'Réserver maintenant'
            : mode === 'block'
            ? (requestSent ? 'Bloqué' : 'Bloquer pour 15min')
            : (requestSent ? 'Demande envoyée' : 'Co-héberger')}
        </button>
      </div>

      {/* Associated Packs */}
      {associatedPacks?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Forfaits associés</h2>
          <ul>
            {associatedPacks.map((pack) => (
              <li key={pack._id} className="mb-2">
                {pack.name}: {pack.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === 'block' && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-3">Sélectionnez vos dates</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choisissez les dates d'arrivée et de départ souhaitées avant de bloquer cette propriété pendant 15 minutes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="block-check-in">
                Date d'arrivée
              </label>
              <input
                id="block-check-in"
                type="date"
                value={blockCheckIn || ""}
                onChange={(e) => onBlockDatesChange?.({ checkIn: e.target.value, checkOut: blockCheckOut })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="block-check-out">
                Date de départ
              </label>
              <input
                id="block-check-out"
                type="date"
                value={blockCheckOut || ""}
                onChange={(e) => onBlockDatesChange?.({ checkIn: blockCheckIn, checkOut: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          {blockDatesError && (
            <p className="mt-3 text-sm text-red-600">{blockDatesError}</p>
          )}
        </div>
      )}

      {/* Map */}
      {resolvedMapLocation && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Localisation</h2>
          <SinglePropertyMap location={resolvedMapLocation} />
        </div>
      )}

      {/* Reviews */}
      {reviews?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Avis</h2>
          <ul>
            {reviews.map((review, index) => (
              <li key={index} className="mb-2">
                {review.comment} - {review.rating} ★
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Check-in Time */}
      {checkInTime && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Heure d'arrivée</h2>
          <p>{checkInTime}</p>
        </div>
      )}
    </div>
  );
};

CoHostPropertyLayout.propTypes = {
  title: PropTypes.string,
  location: PropTypes.string,
  rating: PropTypes.number,
  reviewCount: PropTypes.number,
  mainImage: PropTypes.string,
  host: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    photo: PropTypes.string,
    email: PropTypes.string,
  }),
  checkInTime: PropTypes.string,
  features: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.element,
      label: PropTypes.string,
    })
  ),
  associatedPacks: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
    })
  ),
  mapLocation: PropTypes.string,
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      comment: PropTypes.string,
      rating: PropTypes.number,
    })
  ),
  user: PropTypes.object,
  onCoHostClick: PropTypes.func,
  requestSent: PropTypes.bool,
  mode: PropTypes.oneOf(["cohost", "block", "booking", "blocked"]),
  blockCheckIn: PropTypes.string,
  blockCheckOut: PropTypes.string,
  onBlockDatesChange: PropTypes.func,
  blockDatesError: PropTypes.string,
};

export default CoHostPropertyLayout;
