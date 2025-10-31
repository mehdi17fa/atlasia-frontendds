import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import CartIcon from '../CartIcon';
// import CartModal from '../CartModal';

const navItems = [
  {
    name: 'Découvrir',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      </svg>
    ),
    path: '/',
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
    name: 'My bookings',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    path: '/my-bookings',
  },
  {
    name: 'Ma liste',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    path: '/favorites',
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
  // const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);

  // Hide navbar on all routes like /chat/anything
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
                  ${isActive ? 'text-primary-700' : 'text-secondary-500 hover:text-primary-600'}
                  md:transition md:duration-300 md:transform ${isDesktopOpen ? 'md:opacity-100 md:translate-y-0' : 'md:opacity-0 md:-translate-y-2'}
                `}
                style={{ transitionDelay: isDesktopOpen ? `${idx * 80}ms` : '0ms' }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.name}
                type="button"
              >
                {React.cloneElement(item.icon, {
                  className: isActive
                    ? 'w-8 h-8 md:mr-3 mb-1 md:mb-0 stroke-primary-700'
                    : 'w-5 h-5 mb-1 stroke-secondary-500',
                })}
                <span className="md:ml-3">{item.name}</span>
              </button>
            );
          })}

          {/* Cart entry is now part of navItems */}
        </div>
      </nav>

      {/* Cart modal removed: Panier is now a regular nav item */}
    </>
  );
}