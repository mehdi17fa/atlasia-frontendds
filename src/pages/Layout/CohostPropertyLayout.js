import React from "react";
import PropTypes from "prop-types";

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
  mapImage,
  reviews,
  user,
  onCoHostClick,
  requestSent,
  mode = "cohost",
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Property Header */}
      <h1 className="text-3xl font-bold mb-4">{title || "Propriété sans titre"}</h1>
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-gray-600">{location || "Localisation non spécifiée"}</p>
          <div className="flex items-center">
            <span className="text-yellow-500">★ {rating || 0}</span>
            <span className="ml-2 text-gray-500">({reviewCount || 0} avis)</span>
          </div>
        </div>
        {user && (
          <button
            onClick={onCoHostClick}
            disabled={requestSent}
            className={`px-6 py-2 rounded-full text-white ${
              mode === "block"
                ? requestSent
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-800"
                : requestSent
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800"
            }`}
          >
            {mode === "block"
              ? requestSent
                ? "Bloqué"
                : "Bloquer pour 15min"
              : requestSent
              ? "Demande envoyée"
              : "Co-héberger"}
          </button>
        )}
      </div>

      {/* Main Image */}
      <img
        src={mainImage || "/placeholder1.jpg"}
        alt={title || "Propriété"}
        className="w-full h-96 object-cover rounded-lg mb-4"
      />

      {/* Host Info */}
      {host && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Hôte: {host.name}</h2>
          {host.email && <p className="text-gray-600">{host.email}</p>}
          {host.photo && (
            <img
              src={host.photo}
              alt={host.name}
              className="w-16 h-16 rounded-full mt-2"
            />
          )}
        </div>
      )}

      {/* Features */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Caractéristiques</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              {feature.icon}
              <span className="ml-2">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Associated Packs */}
      {associatedPacks.length > 0 && (
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

      {/* Map */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Localisation</h2>
        <img
          src={mapImage}
          alt="Carte de localisation"
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
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
      <div>
        <h2 className="text-xl font-semibold mb-2">Heure d'arrivée</h2>
        <p>{checkInTime || "Non spécifiée"}</p>
      </div>
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
  mapImage: PropTypes.string,
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      comment: PropTypes.string,
      rating: PropTypes.number,
    })
  ),
  user: PropTypes.object,
  onCoHostClick: PropTypes.func,
  requestSent: PropTypes.bool,
  mode: PropTypes.oneOf(["cohost", "block"]),
};

export default CoHostPropertyLayout;