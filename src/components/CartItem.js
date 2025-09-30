import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
// Removed date-fns dependency - using native JavaScript date formatting
import S3Image from './S3Image';

const CartItem = ({ item, onEdit, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    checkIn: item.checkIn ? new Date(item.checkIn).toISOString().split('T')[0] : '',
    checkOut: item.checkOut ? new Date(item.checkOut).toISOString().split('T')[0] : '',
    guests: item.guests || 1
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await onEdit(item._id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      checkIn: item.checkIn ? new Date(item.checkIn).toISOString().split('T')[0] : '',
      checkOut: item.checkOut ? new Date(item.checkOut).toISOString().split('T')[0] : '',
      guests: item.guests || 1
    });
    setIsEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getItemTypeLabel = () => {
    return item.itemType === 'property' ? '🏠 Propriété' : '📦 Package';
  };

  const getItemTypeColor = () => {
    return item.itemType === 'property' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start space-x-4">
        {/* Item Image */}
        <div className="flex-shrink-0">
          {item.itemSnapshot?.thumbnail ? (
            <S3Image
              src={item.itemSnapshot.thumbnail}
              alt={item.itemSnapshot.name || 'Item'}
              className="w-20 h-20 object-cover rounded-lg"
              fallbackSrc="/placeholder.jpg"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-2xl">
                {item.itemType === 'property' ? '🏠' : '📦'}
              </span>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          {/* Item Type Badge */}
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getItemTypeColor()}`}>
            {getItemTypeLabel()}
          </div>

          {/* Item Name */}
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {item.itemSnapshot?.name || 'Item'}
          </h3>

          {/* Item Description */}
          {item.itemSnapshot?.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {item.itemSnapshot.description}
            </p>
          )}

          {/* Location */}
          {item.itemSnapshot?.location && (
            <p className="text-sm text-gray-500 mt-1">
              📍 {item.itemSnapshot.location}
            </p>
          )}

          {/* Booking Details */}
          {!isEditing ? (
            <div className="mt-3 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Dates:</span>
                <span className="ml-2">
                  {formatDate(item.checkIn)} - {formatDate(item.checkOut)}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Voyageurs:</span>
                <span className="ml-2">{item.guests}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Nuits:</span>
                <span className="ml-2">{item.totalNights || 1}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'arrivée
                  </label>
                  <input
                    type="date"
                    value={editData.checkIn}
                    onChange={(e) => setEditData({ ...editData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de départ
                  </label>
                  <input
                    type="date"
                    value={editData.checkOut}
                    onChange={(e) => setEditData({ ...editData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de voyageurs
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editData.guests}
                  onChange={(e) => setEditData({ ...editData, guests: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition-colors"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-bold text-gray-900">
            {item.subtotal ? `${item.subtotal} MAD` : 'N/A'}
          </div>
          {item.pricePerNight && (
            <div className="text-sm text-gray-500">
              {item.pricePerNight} MAD/nuit
            </div>
          )}
          
          <div className="flex items-center space-x-2 mt-3">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Modifier"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onRemove(item._id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Supprimer"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Guest Message */}
      {item.guestMessage && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Message:</span> {item.guestMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default CartItem;
