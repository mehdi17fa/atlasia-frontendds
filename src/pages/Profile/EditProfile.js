// src/pages/Profile/EditProfile.js
import React, { useContext, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import defaultProfilePic from '../assets/default-pp.png';
import { ReactComponent as MyEditIcon } from '../../assets/icons/pen.svg';
import { FaArrowLeft, FaUser, FaSave } from 'react-icons/fa';
import axios from 'axios';

export default function EditProfileScreen() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: '',
  });
  const [profileImage, setProfileImage] = useState(defaultProfilePic);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
      });
      setProfileImage(user.profilePic || defaultProfilePic);
    }
  }, [user]);

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!profile.fullName.trim()) return alert("Full name cannot be empty.");
    if (profile.fullName.length > 50) return alert("Full name is too long.");
    if (!/^[a-zA-Z\s'-]+$/.test(profile.fullName)) return alert("Full name contains invalid characters.");

    if (profile.phoneNumber && !/^[0-9+\s-]{6,20}$/.test(profile.phoneNumber)) {
      return alert("Phone number format is invalid.");
    }

    if (profile.gender && !['Male','Female','Other'].includes(profile.gender)) {
      return alert("Gender must be Male, Female or Other.");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', user.email);
      formData.append('fullName', profile.fullName.trim());
      formData.append('phoneNumber', profile.phoneNumber.trim());
      formData.append('gender', profile.gender);

      if (selectedFile) formData.append('profilePic', selectedFile);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/complete-profile`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('Profile update response:', response.data);
      console.log('Updated user profilePic:', response.data.user?.profilePic);
      
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center mt-20">Please log in to edit profile.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate('/profile')}
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Modifier mon profil</h1>
          <p className="text-gray-600">Mettez à jour vos informations personnelles</p>
        </div>

        {/* Profile photo */}
        <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <img
            src={profileImage}
            alt="Profil"
            className="w-28 h-28 rounded-full border-4 border-white object-cover"
          />
          <button
            className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-md border"
            onClick={handleImageClick}
          >
            <MyEditIcon className="w-4 h-4 text-gray-600" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
        <p className="mt-2 font-medium flex text-lg items-center gap-1">
          Modifier la photo de profil
        </p>
      </div>

        {/* Form fields */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 mb-8">
        {[
          { label: 'Nom complet', value: profile.fullName, key: 'fullName' },
          { label: 'Adresse email', value: profile.email, key: 'email', disabled: true },
          { label: 'Numéro de téléphone', value: profile.phoneNumber, key: 'phoneNumber' },
          { label: 'Genre', value: profile.gender, key: 'gender' },
        ].map((field) => (
          <div key={field.key}>
            <label className="block text-lg font-medium text-gray-700">{field.label}</label>
            <div className="flex items-center mt-1 bg-white border rounded-lg px-3 py-2">
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className={`flex-1 outline-none text-gray-900 text-lg ${field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={field.disabled || false}
              />
              {!field.disabled && <MyEditIcon className="w-5 h-5 text-gray-400 ml-2" />}
            </div>
          </div>
        ))}
        </div>

        {/* Save button - More prominent */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mettre à jour le profil</h3>
            <p className="text-gray-600 text-sm">Cliquez sur le bouton ci-dessous pour sauvegarder vos modifications</p>
          </div>
          <button
            onClick={handleSave}
            className={`w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg hover:shadow-xl ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            <FaSave className="w-5 h-5" />
            {loading ? 'Sauvegarde en cours...' : 'Mettre à jour le profil'}
          </button>
        </div>
      </div>
    </div>
  );
}
