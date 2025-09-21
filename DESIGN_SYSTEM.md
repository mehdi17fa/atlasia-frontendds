# Atlasia Design System

This document outlines the unified design system for the Atlasia application using Tailwind CSS.

## 🎨 Color Palette

### Primary Colors (Atlasia Green)
- `primary-50` to `primary-950` - Main brand color variations
- **Main Brand**: `primary-500` (#2d9a5c)
- **Dark Brand**: `primary-700` (#1e613c)
- **Light Brand**: `primary-300` (#8dd1a8)

### Secondary Colors (Slate)
- `secondary-50` to `secondary-950` - Neutral grays for text and backgrounds
- **Text Primary**: `secondary-900` (#0f172a)
- **Text Secondary**: `secondary-600` (#475569)
- **Background**: `secondary-50` (#f8fafc)

### Accent Colors (Orange)
- `accent-50` to `accent-950` - Warm orange for highlights and CTAs
- **Accent**: `accent-500` (#f0731a)

### Status Colors
- **Success**: `success-500` (#22c55e)
- **Warning**: `warning-500` (#f59e0b)
- **Error**: `error-500` (#ef4444)

### Neutral Colors
- `neutral-50` to `neutral-950` - Pure grays for borders and subtle elements

## 🔤 Typography

### Font Families
- **Primary**: `font-sans` (Inter with system fallbacks)
- **Display**: `font-display` (Inter for headings)
- **Monospace**: `font-mono` (JetBrains Mono for code)

### Font Sizes
- `text-xs` - 0.75rem (12px)
- `text-sm` - 0.875rem (14px)
- `text-base` - 1rem (16px)
- `text-lg` - 1.125rem (18px)
- `text-xl` - 1.25rem (20px)
- `text-2xl` - 1.5rem (24px)
- `text-3xl` - 1.875rem (30px)
- `text-4xl` - 2.25rem (36px)

## 🎯 Usage Guidelines

### Buttons
```jsx
// Primary Button
<button className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg transition-colors">
  Primary Action
</button>

// Secondary Button
<button className="bg-secondary-100 hover:bg-secondary-200 text-secondary-900 font-medium px-6 py-3 rounded-lg transition-colors">
  Secondary Action
</button>

// Accent Button
<button className="bg-accent-500 hover:bg-accent-600 text-white font-medium px-6 py-3 rounded-lg transition-colors">
  Accent Action
</button>
```

### Cards
```jsx
<div className="bg-white border border-secondary-200 rounded-xl shadow-sm p-6">
  <h3 className="text-lg font-semibold text-secondary-900 mb-2">Card Title</h3>
  <p className="text-secondary-600">Card content goes here.</p>
</div>
```

### Forms
```jsx
<input className="w-full px-4 py-3 border border-secondary-300 rounded-lg text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
```

### Status Messages
```jsx
// Success
<div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
  Success message
</div>

// Warning
<div className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-lg">
  Warning message
</div>

// Error
<div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
  Error message
</div>
```

## 🎨 Shadows

- `shadow-sm` - Subtle shadow
- `shadow` - Default shadow
- `shadow-md` - Medium shadow
- `shadow-lg` - Large shadow
- `shadow-atlasia` - Brand-specific shadow with green tint
- `shadow-atlasia-lg` - Large brand shadow

## 🎭 Animations

- `animate-fade-in` - Fade in animation
- `animate-slide-up` - Slide up animation
- `animate-slide-down` - Slide down animation
- `animate-bounce-gentle` - Gentle bounce animation

## 📐 Spacing

- `space-18` - 4.5rem (72px)
- `space-88` - 22rem (352px)
- `space-128` - 32rem (512px)

## 🔄 Migration Guide

### Old Colors → New Colors
- `green-800` → `primary-700`
- `green-700` → `primary-600`
- `green-500` → `primary-500`
- `gray-900` → `secondary-900`
- `gray-600` → `secondary-600`
- `gray-300` → `secondary-300`
- `red-500` → `error-500`
- `yellow-500` → `warning-500`

### Old Classes → New Classes
- `text-green-800` → `text-primary-700`
- `bg-green-800` → `bg-primary-700`
- `border-green-200` → `border-primary-200`
- `hover:bg-green-700` → `hover:bg-primary-600`

## 🎯 Best Practices

1. **Consistency**: Always use the design system colors instead of arbitrary values
2. **Accessibility**: Ensure sufficient contrast ratios (4.5:1 for normal text)
3. **Responsiveness**: Use responsive prefixes (sm:, md:, lg:, xl:)
4. **States**: Include hover, focus, and active states
5. **Transitions**: Add smooth transitions for interactive elements

## 📱 Component Examples

### Navigation
```jsx
<nav className="bg-white border-b border-secondary-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <span className="text-xl font-bold text-primary-700">Atlasia</span>
      </div>
    </div>
  </div>
</nav>
```

### Hero Section
```jsx
<section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
      Welcome to Atlasia
    </h1>
    <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
      Discover amazing places and create unforgettable memories.
    </p>
    <button className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors shadow-atlasia">
      Get Started
    </button>
  </div>
</section>
```
