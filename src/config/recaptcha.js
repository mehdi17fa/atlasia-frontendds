// reCAPTCHA Configuration
export const RECAPTCHA_CONFIG = {
  // Test keys for development (these are Google's test keys)
  SITE_KEY: process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
  SECRET_KEY: process.env.REACT_APP_RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
  
  // Production keys should be set in environment variables
  // REACT_APP_RECAPTCHA_SITE_KEY=your_production_site_key
  // REACT_APP_RECAPTCHA_SECRET_KEY=your_production_secret_key
};

export default RECAPTCHA_CONFIG;
