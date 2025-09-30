import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  EllipsisVerticalIcon, 
  PencilIcon, 
  TrashIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

const PropertyOptionsMenu = ({ property, onDelete, onEdit, onInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onEdit) {
      onEdit(property);
    } else {
      navigate(`/edit-property/${property._id}`);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onDelete) {
      try {
        await onDelete(property);
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Erreur lors de la suppression de la propriété. Veuillez réessayer.');
      }
    } else {
      // Default delete behavior - show confirmation
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer la propriété "${property.title || property.nom || 'cette propriété'}" ?`)) {
        console.log('Delete property:', property._id);
        // TODO: Implement delete API call
      }
    }
  };

  const handleInfo = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onInfo) {
      onInfo(property);
    } else {
      navigate(`/property/${property._id}`);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dots button */}
      <button
        onClick={toggleMenu}
        className="absolute top-2 right-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-1.5 shadow-md transform transition hover:scale-110 active:scale-95 z-20 hover:bg-opacity-100"
        title="Options de la propriété"
      >
        <EllipsisVerticalIcon className="w-4 h-4 text-gray-900 hover:text-black transition-colors duration-300" strokeWidth={3} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 min-w-[160px] overflow-visible">
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Modifier la propriété</span>
          </button>
          
          <button
            onClick={handleInfo}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <InformationCircleIcon className="w-4 h-4" />
            <span>Informations</span>
          </button>
          
          <hr className="my-1 border-gray-200" />
          
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200 bg-white"
          >
            <TrashIcon className="w-4 h-4 flex-shrink-0" />
            <span>Supprimer</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyOptionsMenu;
