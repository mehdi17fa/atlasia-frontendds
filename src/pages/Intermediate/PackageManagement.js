import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaDollarSign, FaMapMarkerAlt, FaUsers, FaArrowLeft, FaUser } from 'react-icons/fa';
import S3Image from '../../components/S3Image';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function PackageManagement() {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, package: null });

  useEffect(() => {
    if (!user || user.role !== 'partner') {
      navigate('/');
      return;
    }
    fetchPackages();
  }, [user, navigate]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/api/packages/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Fetched packages:', data);
        setPackages(data.packages || []);
      } else {
        throw new Error(`Failed to fetch packages: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Erreur lors du chargement des packages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = () => {
    navigate('/create-package');
  };

  const handleEditPackage = (packageId) => {
    navigate(`/edit-package/${packageId}`);
  };

  const handleViewPackage = (packageId) => {
    navigate(`/package/${packageId}`);
  };

  const handleDeletePackage = async (packageId) => {
    try {
      const response = await fetch(`${API_BASE}/api/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPackages(prev => prev.filter(pkg => pkg._id !== packageId));
        setDeleteModal({ isOpen: false, package: null });
      } else {
        throw new Error('Failed to delete package');
      }
    } catch (err) {
      console.error('Error deleting package:', err);
      setError('Erreur lors de la suppression du package');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Brouillon' },
      published: { color: 'bg-green-100 text-green-800', text: 'Publié' },
      archived: { color: 'bg-red-100 text-red-800', text: 'Archivé' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'Prix non défini';
    if (typeof price === 'number') return `${price} MAD`;
    if (typeof price === 'object' && price.totalPrice) return `${price.totalPrice} MAD`;
    return `${price} MAD`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate('/acceuill')}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

            {/* Center: Atlasia Branding */}
            <div className="text-center">
              <div className="font-bold text-green-700 text-2xl">
                Atlasia
              </div>
            </div>

            {/* Right: Account Icon */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-10 h-10 bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors font-semibold text-sm"
            >
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Gestion des Packages</h1>
          <p className="text-gray-600">Créez, modifiez et gérez vos packages de services</p>
          
          <div className="mt-4">
            <button
              onClick={handleCreatePackage}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Créer un Package</span>
            </button>
          </div>
        </div>
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCalendarAlt className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Packages</p>
                <p className="text-2xl font-semibold text-gray-900">{packages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaEye className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Publiés</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {packages.filter(pkg => pkg && pkg.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaEdit className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Brouillons</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {packages.filter(pkg => pkg && pkg.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Packages List */}
        {packages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaCalendarAlt className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun package créé</h3>
            <p className="text-gray-500 mb-6">Commencez par créer votre premier package de services.</p>
            <button
              onClick={handleCreatePackage}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Créer mon premier package
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Mes Packages</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {packages.map((pkg) => (
                <div key={pkg._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    {/* Package Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                        {pkg.property?.photos?.[0] ? (
                          <S3Image
                            src={pkg.property.photos[0]}
                            alt={pkg.name}
                            className="w-full h-full object-cover"
                            fallbackSrc="/placeholder.jpg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <FaCalendarAlt className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Package Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {pkg.name || 'Package sans nom'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {pkg.description || 'Aucune description'}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            {pkg.property && (
                              <div className="flex items-center space-x-1">
                                <FaMapMarkerAlt className="w-4 h-4" />
                                <span>{pkg.property.title || 'Propriété'}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <FaDollarSign className="w-4 h-4" />
                              <span>{formatPrice(pkg.totalPrice)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FaCalendarAlt className="w-4 h-4" />
                              <span>{formatDate(pkg.startDate)} - {formatDate(pkg.endDate)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getStatusBadge(pkg.status)}
                            <span className="text-xs text-gray-500">
                              Créé le {formatDate(pkg.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleViewPackage(pkg._id)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Voir le package"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEditPackage(pkg._id)}
                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                            title="Modifier le package"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, package: pkg })}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer le package"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, package: null })}
        onConfirm={() => handleDeletePackage(deleteModal.package?._id)}
        title="Supprimer le Package"
        message={`Êtes-vous sûr de vouloir supprimer le package "${deleteModal.package?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmButtonColor="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
