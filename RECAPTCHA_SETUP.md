# reCAPTCHA Setup Guide

This application now uses Google reCAPTCHA for enhanced security during authentication.

## 🔧 Setup Instructions

### 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to add a new site
3. Choose reCAPTCHA type:
   - **reCAPTCHA v2** ("I'm not a robot" checkbox) - Recommended for login/signup
   - **reCAPTCHA v3** (invisible, score-based) - For advanced use cases
4. Add your domains:
   - `localhost` (for development)
   - Your production domain
5. Get your Site Key and Secret Key

### 2. Frontend Configuration

Create a `.env` file in the frontend root directory:

```env
# reCAPTCHA Configuration
REACT_APP_RECAPTCHA_SITE_KEY=your_site_key_here
REACT_APP_API_URL=http://localhost:4000
```

### 3. Backend Configuration

Add to your backend `.env` file:

```env
# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### 4. Test Keys (Development)

For development, you can use Google's test keys (already configured):

- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

These test keys will always pass verification.

## 🚀 Features

### Frontend Components
- **ReCaptcha.js**: Reusable reCAPTCHA component
- **Auto-refresh**: Reset functionality on errors
- **Error handling**: User-friendly error messages
- **Responsive design**: Works on all screen sizes

### Backend Middleware
- **verifyRecaptcha**: Basic reCAPTCHA verification
- **verifyRecaptchaV3**: Advanced v3 verification with score checking
- **Rate limiting**: Combined with existing rate limiting
- **Error handling**: Comprehensive error responses

### Security Features
- **Token verification**: Server-side validation with Google
- **Score checking**: For reCAPTCHA v3 (0.0 to 1.0)
- **IP validation**: Remote IP verification
- **Expiration handling**: Automatic token expiration

## 📝 Usage

### In React Components

```jsx
import ReCaptcha from '../../components/shared/ReCaptcha';
import { RECAPTCHA_CONFIG } from '../../config/recaptcha';

const [recaptchaToken, setRecaptchaToken] = useState('');

const handleRecaptchaChange = (token) => {
  setRecaptchaToken(token);
};

<ReCaptcha
  onCaptchaChange={handleRecaptchaChange}
  siteKey={RECAPTCHA_CONFIG.SITE_KEY}
  error={recaptchaError}
/>
```

### In Backend Routes

```javascript
import { verifyRecaptcha } from "../middleware/recaptcha.js";

router.post("/login", verifyRecaptcha, async (req, res) => {
  // req.recaptchaVerified = true
  // req.recaptchaScore = 0.9
  // req.recaptchaAction = "login"
});
```

## 🔒 Security Notes

1. **Never expose secret keys** in frontend code
2. **Use HTTPS** in production
3. **Validate on server-side** - never trust client-side validation
4. **Monitor scores** for reCAPTCHA v3 to detect suspicious activity
5. **Set appropriate score thresholds** (0.5+ recommended)

## 🐛 Troubleshooting

### Common Issues

1. **"reCAPTCHA verification failed"**
   - Check if secret key is correct
   - Verify domain is registered in reCAPTCHA console
   - Ensure token is not expired

2. **"reCAPTCHA not loading"**
   - Check if site key is correct
   - Verify domain is registered
   - Check browser console for errors

3. **"Low score" errors (v3 only)**
   - Adjust minimum score threshold
   - Check user behavior patterns
   - Consider using v2 for critical forms

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages in the backend.

## 📚 Resources

- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [reCAPTCHA v2 Guide](https://developers.google.com/recaptcha/docs/display)
- [reCAPTCHA v3 Guide](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Best Practices](https://developers.google.com/recaptcha/docs/faq)
