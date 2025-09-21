import React, { useEffect, useRef } from 'react';

const ReCaptcha = ({ onCaptchaChange, siteKey, error }) => {
  const recaptchaRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        initializeRecaptcha();
      };
    } else {
      initializeRecaptcha();
    }

    return () => {
      // Cleanup: reset reCAPTCHA when component unmounts
      if (widgetIdRef.current && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  const initializeRecaptcha = () => {
    if (window.grecaptcha && recaptchaRef.current) {
      try {
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: siteKey,
          callback: (response) => {
            onCaptchaChange(response);
          },
          'expired-callback': () => {
            onCaptchaChange('');
          },
          'error-callback': () => {
            onCaptchaChange('');
          }
        });
        widgetIdRef.current = widgetId;
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }
  };

  const resetCaptcha = () => {
    if (widgetIdRef.current && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Security Verification
        </label>
        <button
          type="button"
          onClick={resetCaptcha}
          className="text-xs text-green-700 hover:text-green-800 underline"
        >
          Refresh
        </button>
      </div>
      
      <div className="flex justify-center">
        <div ref={recaptchaRef}></div>
      </div>
      
      {error && (
        <p className="text-red-500 text-xs text-center">{error}</p>
      )}
      
      <p className="text-xs text-gray-500 text-center">
        This site is protected by reCAPTCHA and the Google 
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> Privacy Policy</a> and 
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> Terms of Service</a> apply.
      </p>
    </div>
  );
};

export default ReCaptcha;
