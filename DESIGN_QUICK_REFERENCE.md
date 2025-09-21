# Atlasia Design System - Quick Reference

## 🎨 Color Classes

### Primary (Atlasia Green)
```css
bg-primary-500    /* Main brand color */
bg-primary-600    /* Hover state */
bg-primary-700    /* Dark variant */
text-primary-600  /* Links and accents */
text-primary-700  /* Headings */
```

### Secondary (Neutral Grays)
```css
bg-secondary-50   /* Light backgrounds */
bg-secondary-100  /* Card backgrounds */
bg-secondary-200  /* Borders */
text-secondary-900 /* Primary text */
text-secondary-600 /* Secondary text */
text-secondary-500 /* Placeholders */
```

### Status Colors
```css
bg-success-500    /* Success states */
bg-warning-500    /* Warning states */
bg-error-500      /* Error states */
text-success-700  /* Success text */
text-warning-700  /* Warning text */
text-error-700    /* Error text */
```

## 🔤 Typography

### Font Families
```css
font-sans         /* Primary font (Inter) */
font-display      /* Headings */
font-mono         /* Code */
```

### Text Sizes
```css
text-xs           /* 12px */
text-sm           /* 14px */
text-base         /* 16px */
text-lg           /* 18px */
text-xl           /* 20px */
text-2xl          /* 24px */
text-3xl          /* 30px */
text-4xl          /* 36px */
```

## 🎯 Common Patterns

### Buttons
```jsx
// Primary Button
<button className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-atlasia">
  Primary Action
</button>

// Secondary Button
<button className="bg-secondary-100 hover:bg-secondary-200 text-secondary-900 font-semibold px-6 py-3 rounded-lg transition-colors">
  Secondary Action
</button>
```

### Form Inputs
```jsx
<input className="w-full px-4 py-3 border border-secondary-300 rounded-lg text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
```

### Cards
```jsx
<div className="bg-white border border-secondary-200 rounded-xl shadow-sm p-6">
  <h3 className="text-lg font-semibold text-secondary-900 mb-2">Card Title</h3>
  <p className="text-secondary-600">Card content</p>
</div>
```

### Status Messages
```jsx
// Success
<div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
  Success message
</div>

// Error
<div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
  Error message
</div>
```

## 🎨 Shadows
```css
shadow-sm         /* Subtle shadow */
shadow            /* Default shadow */
shadow-md         /* Medium shadow */
shadow-lg         /* Large shadow */
shadow-atlasia    /* Brand shadow with green tint */
```

## 🎭 Animations
```css
animate-fade-in   /* Fade in */
animate-slide-up  /* Slide up */
animate-slide-down /* Slide down */
transition-colors /* Color transitions */
```

## 📱 Responsive Design
```css
sm:text-lg        /* Small screens and up */
md:text-xl        /* Medium screens and up */
lg:text-2xl       /* Large screens and up */
xl:text-3xl       /* Extra large screens and up */
```

## 🔄 Migration from Old Colors

| Old Class | New Class |
|-----------|-----------|
| `text-green-800` | `text-primary-700` |
| `bg-green-800` | `bg-primary-700` |
| `text-gray-900` | `text-secondary-900` |
| `text-gray-600` | `text-secondary-600` |
| `text-red-500` | `text-error-500` |
| `bg-red-50` | `bg-error-50` |
| `border-gray-300` | `border-secondary-300` |

## 🎯 Best Practices

1. **Always use design system colors** instead of arbitrary values
2. **Include hover and focus states** for interactive elements
3. **Use consistent spacing** with the spacing scale
4. **Add transitions** for smooth interactions
5. **Test accessibility** with sufficient contrast ratios
