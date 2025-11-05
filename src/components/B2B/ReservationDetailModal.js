import React from 'react';
import { XMarkIcon, CalendarDaysIcon, ClockIcon, CurrencyDollarIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function ReservationDetailModal({ reservation, onClose }) {
  if (!reservation) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmée' },
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'À venir' },
      past: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Passée' },
      canceled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' }
    };

    const config = statusConfig[status] || statusConfig.past;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Détails de la réservation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Booking ID and Status */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-600">ID de réservation</p>
              <p className="text-lg font-semibold text-gray-900">{reservation._id || 'N/A'}</p>
            </div>
            {getStatusBadge(reservation.status)}
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-green-700" />
              Informations client
            </h3>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Nom:</span> {reservation.customer?.fullName || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {reservation.customer?.email || 'N/A'}</p>
              <p><span className="font-medium">Téléphone:</span> {reservation.customer?.phoneNumber || 'N/A'}</p>
            </div>
          </div>

          {/* Service/Item Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-green-700" />
              Détails du service
            </h3>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Nom:</span> {reservation.serviceItem?.name || 'N/A'}</p>
              <p><span className="font-medium">Type:</span> {reservation.serviceItem?.type || 'N/A'}</p>
              {reservation.serviceItem?.description && (
                <p><span className="font-medium">Description:</span> {reservation.serviceItem.description}</p>
              )}
            </div>
          </div>

          {/* Dates and Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                Date de réservation
              </h4>
              <p className="text-gray-700">{formatDate(reservation.bookingDate)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-green-600" />
                Début du service
              </h4>
              <p className="text-gray-700">{formatDate(reservation.serviceStartTime)}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-700" />
              Montant
            </h3>
            <p className="text-3xl font-bold text-green-800">{formatCurrency(reservation.totalAmount)}</p>
          </div>

          {/* Notes/Messages */}
          {reservation.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{reservation.notes}</p>
            </div>
          )}

          {/* Additional Info */}
          {reservation.createdAt && (
            <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
              Réservation créée le {formatDate(reservation.createdAt)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

