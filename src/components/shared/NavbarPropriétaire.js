import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OwnerBottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      label: 'Accueil',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      </svg>
      ),
      path: '/',
    },
    {
      label: 'Activités',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 18V6a2 2 0 0 1 2-2h4m4 0h4a2 2 0 0 1 2 2v12m-6-4h.01M4 12h16" />
        </svg>
      ),
      path: '/',
    },
    {
      label: 'Mes propriétés',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-6 9 6v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" />
        </svg>
      ),
      path: '/',
    },
    {
      label: 'Inbox',
      icon: (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6.79a2 2 0 0 0 .79 1.58l6.86 5.5a2 2 0 0 0 2.7 0l6.86-5.5a2 2 0 0 0 .79-1.58z" />
          </svg>
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-600"></span>
        </div>
      ),
      path: '/',
    },
    {
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 0 1 12 15a9 9 0 0 1 6.879 2.804M15 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0z" />
        </svg>
      ),
      path: '/profile',
    },
  ];

  return (
    <nav className="hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center justify-center text-xs"
        >
          {item.icon}
          <span className={`mt-1 ${isActive(item.path) ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default OwnerBottomNavbar;
