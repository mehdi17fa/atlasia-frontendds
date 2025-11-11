import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  {
    name: 'Acceuil',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      </svg>
    ),
    path: '/acceuill',
  },
  {
    name: 'Blocking',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    ),
    path: '/blocking-explore',
  },
  {
    name: 'Performance',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    path: '/performance',
    mobilePanel: true,
  },
  {
    name: 'Mes Services',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    path: '/package-management',
    mobilePanel: true,
  },
  {
    name: 'Inbox',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13V5a2 2 0 00-2-2H6a2 2 0 00-2 2v8m16 0l-8 5-8-5m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
      </svg>
    ),
    path: '/inbox',
    mobilePanel: true,
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const homePath = '/acceuill';

  const mobileMenuItems = navItems.filter((item) => item.mobilePanel);
  const profilePanelItem = {
    name: 'Paramètres',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 11a3 3 0 10-6 0 3 3 0 006 0z" />
      </svg>
    ),
    path: '/profile',
  };
  const panelItems = [...mobileMenuItems, profilePanelItem];

  useEffect(() => {
    setShowProfileMenu(false);
  }, [location.pathname]);

  const isMobileViewport = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  const toggleDesktopNav = () => setIsDesktopOpen((v) => !v);

  const handleLogoClick = () => {
    navigate(homePath);
    setIsDesktopOpen(false);
  };

  const handleNavClick = (item) => {
    const isMobile = isMobileViewport();

    if (item.name === 'Profile' && isMobile) {
      setShowProfileMenu((prev) => !prev);
      return;
    }

    setShowProfileMenu(false);
    setIsDesktopOpen(false);
    navigate(item.path);
  };

  const handlePanelItemClick = (item) => {
    setShowProfileMenu(false);
    setIsDesktopOpen(false);
    navigate(item.path);
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

      {showProfileMenu && (
        <div className="md:hidden fixed bottom-24 left-0 right-0 z-[69] px-4 pb-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-3 space-y-2">
            {panelItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handlePanelItemClick(item)}
                className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-green-50 hover:text-green-700 transition-colors"
                aria-label={`${item.name} menu option`}
              >
                <span className="flex items-center gap-3">
                  {React.cloneElement(item.icon, { className: 'w-5 h-5 stroke-current' })}
                  {item.name}
                </span>
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className={`fixed md:top-0 md:left-0 md:min-h-screen md:bg-white md:border-r md:border-gray-200 bottom-0 w-full bg-white border-t border-gray-200 z-[70] md:transition-all md:duration-300 md:transform ${isDesktopOpen ? 'md:translate-x-0 md:w-64' : 'md:-translate-x-full md:w-0'}`}>
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
            aria-label="Aller à l'accueil partenaire"
          >
            ATLASIA
          </button>
        </div>

        <div className="flex md:flex-col md:items-stretch md:justify-start flex justify-around md:py-4 py-2 md:space-y-1">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const mobileHiddenClass = item.mobilePanel ? 'hidden md:flex' : '';

            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`
                  flex md:flex-row flex-col items-center justify-center md:justify-start md:w-full md:px-5 md:py-3 ${isActive ? 'text-base' : 'text-sm'}
                  transition-colors duration-200
                  focus:outline-none
                  ${isActive ? 'text-green-700' : 'text-gray-500 hover:text-green-600'}
                  md:transition md:duration-300 md:transform
                  ${isDesktopOpen ? 'md:opacity-100 md:translate-y-0 md:pointer-events-auto' : 'md:opacity-0 md:-translate-y-2 md:pointer-events-none'}
                  ${mobileHiddenClass} md:gap-3
                `}
                style={{ transitionDelay: isDesktopOpen ? `${idx * 80}ms` : '0ms' }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.name}
                type="button"
              >
                {React.cloneElement(item.icon, {
                  className: isActive
                    ? 'w-8 h-8 md:mr-0 mb-1 md:mb-0 stroke-green-700'
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