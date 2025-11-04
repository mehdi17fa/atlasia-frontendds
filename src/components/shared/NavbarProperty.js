import React, { useState } from 'react';
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
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);

  const homePath = '/owner-welcome';
  const toggleDesktopNav = () => setIsDesktopOpen((v) => !v);
  const handleLogoClick = () => {
    navigate(homePath);
    setIsDesktopOpen(false);
  };

  // ✅ Hide navbar on all routes like /chat/anything
  const isChatPage = /^\/chat\/[^/]+$/.test(location.pathname);
  if (isChatPage) return null;

  return (
    <>
      {/* Dark overlay when desktop nav is open */}
      {isDesktopOpen && (
        <div
          className="hidden md:block fixed inset-0 bg-black/40 z-[55]"
          onClick={() => setIsDesktopOpen(false)}
        />
      )}

      <nav
        className={`fixed md:top-0 md:left-0 md:min-h-screen md:bg-white md:border-r md:border-gray-200 bottom-0 w-full bg-white border-t border-gray-200 z-[70] md:transition-all md:duration-300 md:transform ${
          isDesktopOpen ? 'md:translate-x-0 md:w-64' : 'md:-translate-x-full md:w-0'
        }`}
      >
        <div className="hidden md:flex items-center gap-4 px-5 py-6 border-b border-gray-200">
          <button
            type="button"
            aria-label={isDesktopOpen ? 'Close menu' : 'Open menu'}
            className="flex items-center justify-center w-12 h-12 min-w-12 flex-shrink-0 rounded-lg border border-gray-300 bg-white shadow transition-colors hover:border-gray-400"
            onClick={toggleDesktopNav}
          >
            <svg
              className="w-6 h-6 text-gray-800"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleLogoClick}
            className="text-2xl font-bold tracking-wide text-green-700"
            aria-label="Aller à l'accueil propriétaire"
          >
            ATLASIA
          </button>
        </div>

        <div className="flex md:flex-col md:items-stretch md:justify-start flex justify-around md:py-4 py-2 md:space-y-1">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsDesktopOpen(false);
                }}
                className={`
                  flex md:flex-row flex-col items-center justify-center md:justify-start md:w-full md:px-5 md:py-3 ${isActive ? 'text-base' : 'text-sm'}
                  transition-colors duration-200
                  focus:outline-none
                  ${isActive ? 'text-green-700' : 'text-gray-500 hover:text-green-600'}
                  md:transition md:duration-300 md:transform ${isDesktopOpen ? 'md:opacity-100 md:translate-y-0' : 'md:opacity-0 md:-translate-y-2'}
                  md:gap-3
                `}
                style={{ transitionDelay: isDesktopOpen ? `${idx * 80}ms` : '0ms' }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.name}
                type="button"
              >
                {React.cloneElement(item.icon, {
                  className: isActive
                    ? 'w-8 h-8 mb-1 md:mb-0 stroke-green-700'
                    : 'w-5 h-5 mb-1 md:mb-0 stroke-gray-500',
                })}
                <span className="md:text-left md:font-medium md:uppercase md:text-[13px] md:leading-none">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}