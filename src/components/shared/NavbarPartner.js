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
    path: '/acceuill',
  },
  {
    name: 'Panier',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13l-2 7h12M7 13L5.4 5M17 21a1 1 0 100-2 1 1 0 000 2zM9 21a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
    path: '/cart/checkout',
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
  },
  {
    name: 'Mes Services',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    path: '/package-management',
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

  // ✅ Hide navbar on all routes like /chat/anything
  const isChatPage = /^\/chat\/[^/]+$/.test(location.pathname);
  if (isChatPage) return null;

  return (
    <>
      {/* Desktop hamburger toggle (top-left) */}
      <button
        type="button"
        aria-label="Open menu"
        className="hidden md:flex fixed top-5 left-3 z-[60] items-center justify-center w-10 h-10 rounded-md border border-gray-300 bg-white shadow"
        onClick={() => setIsDesktopOpen((v) => !v)}
      >
        <svg
          className="w-5 h-5 text-gray-800"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dark overlay when desktop nav is open */}
      {isDesktopOpen && (
        <div
          className="hidden md:block fixed inset-0 bg-black/40 z-[55]"
          onClick={() => setIsDesktopOpen(false)}
        />
      )}

      <nav className={`fixed md:top-0 md:left-0 md:min-h-screen md:bg-white md:border-r md:border-gray-200 bottom-0 w-full bg-white border-t border-gray-200 z-[70] md:transition-all md:duration-300 md:transform ${isDesktopOpen ? 'md:translate-x-0 md:w-64' : 'md:-translate-x-full md:w-0'}`}>
      <div className="flex md:flex-col flex justify-around md:h-full md:py-4 py-2">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => { navigate(item.path); setIsDesktopOpen(false); }}
              className={`
                flex md:flex-row flex-col items-center justify-center md:justify-start md:px-4 ${isActive ? 'text-base' : 'text-sm'}
                transition-colors duration-200
                focus:outline-none
                ${isActive ? 'text-green-700' : 'text-gray-500 hover:text-green-600'}
                md:transition md:duration-300 md:transform
                ${isDesktopOpen ? 'md:opacity-100 md:translate-y-0' : 'md:opacity-0 md:-translate-y-2'}
              `}
              style={{ transitionDelay: isDesktopOpen ? `${idx * 80}ms` : '0ms' }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.name}
              type="button"
            >
              {React.cloneElement(item.icon, {
                className: isActive
                  ? 'w-8 h-8 md:mr-3 mb-1 md:mb-0 stroke-green-700'
                  : 'w-5 h-5 mb-1 stroke-gray-500',
              })}
              <span className="md:ml-3">{item.name}</span>
            </button>
          );
        })}
      </div>
      </nav>
    </>
  );
}