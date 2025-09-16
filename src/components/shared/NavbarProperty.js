import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  {
    name: 'Acceuil',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      </svg>
    ),
    path: '/owner-welcome',
  },
  {
    name: 'Activités',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    path: '/owner/income',
  },
  {
    name: 'Mes propriétés',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
        <path d="M 24.962891 1.0546875 A 1.0001 1.0001 0 0 0 24.384766 1.2636719 L 1.3847656 19.210938 A 1.0005659 1.0005659 0 0 0 2.6152344 20.789062 L 4 19.708984 L 4 46 A 1.0001 1.0001 0 0 0 5 47 L 18.832031 47 A 1.0001 1.0001 0 0 0 19.158203 47 L 30.832031 47 A 1.0001 1.0001 0 0 0 31.158203 47 L 45 47 A 1.0001 1.0001 0 0 0 46 46 L 46 19.708984 L 47.384766 20.789062 A 1.0005657 1.0005657 0 1 0 48.615234 19.210938 L 41 13.269531 L 41 6 L 35 6 L 35 8.5859375 L 25.615234 1.2636719 A 1.0001 1.0001 0 0 0 24.962891 1.0546875 z M 25 3.3222656 L 44 18.148438 L 44 45 L 32 45 L 32 26 L 18 26 L 18 45 L 6 45 L 6 18.148438 L 25 3.3222656 z M 37 8 L 39 8 L 39 11.708984 L 37 10.146484 L 37 8 z M 20 28 L 30 28 L 30 45 L 20 45 L 20 28 z"></path>
      </svg>
    ),
    path: '/my-properties',
  },
  {
    name: 'Inbox',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13V5a2 2 0 00-2-2H6a2 2 0 00-2 2v8m16 0l-8 5-8-5m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
      </svg>
    ),
    path: '/inbox',
  },
  {
    name: 'Profile',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 11a3 3 0 10-6 0 3 3 0 006 0z" />
      </svg>
    ),
    path: '/profile',
  },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Hide navbar on all routes like /chat/anything
  const isChatPage = /^\/chat\/[^/]+$/.test(location.pathname);
  if (isChatPage) return null;

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center justify-center text-xs
                transition-colors duration-200
                focus:outline-none
                ${isActive ? 'text-green-700' : 'text-gray-500 hover:text-green-600'}
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.name}
              type="button"
            >
              {React.cloneElement(item.icon, {
                className: isActive
                  ? 'w-5 h-5 mb-1 stroke-green-700'
                  : 'w-5 h-5 mb-1 stroke-gray-500',
              })}
              {item.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
