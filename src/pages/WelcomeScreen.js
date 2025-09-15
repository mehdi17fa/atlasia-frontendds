import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4"
      style={{ backgroundImage: `url('/getstarted2.jpg')` }}
    >
      {/* Background Blur Overlay (optional) */}
      <div className="absolute inset-0 bg-opacity-50"></div>

      {/* Language Selector */}
      <div className="absolute top-6 right-6 bg-atlasia-dark text-white px-4 py-2 rounded-full text-sm font-medium z-10">
        Eng
      </div>

      {/* Branding */}
      <div className="absolute top-16 text-center px-4 z-10">
        <h1 className="text-6xl sm:text-5xl font-bold text-atlasia-dark mb-4">Atlasia</h1>
        <p className="text-xl sm:text-2xl font-semibold text-gray-500">Stay, Explore, Savor!</p>
      </div>

      {/* Buttons Container */}
      <div className="absolute bottom-20 sm:bottom-28 w-full max-w-2xl mx-auto px-4 sm:px-0 flex flex-col items-center gap-4 bg-white/30 rounded-3xl py-8 min-h-[300px] z-10">
        <button
          className="w-3/5 mx-auto bg-atlasia-dark hover:bg-green-800 text-white py-4 rounded-full text-lg font-semibold"
          onClick={() => navigate('/login')} // ✅ Navigate to /login
        >
          Log in
        </button>


        <button
          onClick={() => navigate('/explore')}
          className="w-3/5 mx-auto bg-atlasia-sage hover:bg-teal-600 text-white py-4 rounded-full text-lg font-semibold transition"
        >
          Continue as a guest
        </button>


        <button
          onClick={() => navigate('/signup')}
          className="w-3/5 mx-auto bg-gray-400 hover:bg-gray-500 text-white border border-gray-400 py-4 rounded-full text-lg font-semibold shadow-lg transition-colors duration-200"
        >
          Sign up
        </button>

      </div>




      {/* Footer Text */}
      <p className="absolute bottom-8 text-xs sm:text-sm text-white-500 text-center mb-4 px-6 w-full z-10">
        By creating an account or logging in, you agree to Atlasia’s{' '}
        <span className="underline">Terms & Conditions</span> and{' '}
        <span className="underline">Privacy Policy</span>.
      </p>
    </div>
  );
}
