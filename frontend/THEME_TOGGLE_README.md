# Theme Toggle Components

This project includes multiple theme toggle components for switching between dark and light modes.

## Components

### 1. ThemeToggle
A simple icon-based toggle button that switches between dark and light themes.

**Features:**
- Sun/Moon icons that change based on current theme
- Smooth hover animations
- Tooltip showing current action
- Automatically detects dark themes

**Usage:**
```jsx
import ThemeToggle from './components/ThemeToggle';

<ThemeToggle />
```

### 2. ThemeToggleAdvanced
An advanced toggle switch with animated slider and embedded icons.

**Features:**
- Animated sliding toggle
- Embedded sun/moon icons
- Smooth transitions
- Focus states for accessibility
- Color-coded icons (yellow sun, blue moon)

**Usage:**
```jsx
import ThemeToggleAdvanced from './components/ThemeToggleAdvanced';

<ThemeToggleAdvanced />
```

### 3. ThemeSelector
A comprehensive theme selector with all available themes.

**Features:**
- Dropdown with all available themes
- Color preview for each theme
- Current theme highlighting
- Scrollable list for many themes

**Usage:**
```jsx
import ThemeSelector from './components/ThemeSelector';

<ThemeSelector />
```

## Theme Detection

The toggle components automatically detect whether a theme is dark or light based on the `isDark` property in the `THEMES` constant.

**File:** `frontend/src/constants/index.js`

Each theme object now includes an `isDark` boolean property:

```js
{
  name: "dark",
  label: "Dark",
  isDark: true,
  colors: ["#1f2937", "#8b5cf6", "#ec4899", "#1a202c"],
},
{
  name: "cupcake",
  label: "Cupcake",
  isDark: false,
  colors: ["#f5f5f4", "#65c3c8", "#ef9fbc", "#291334"],
}
```

This central source of truth ensures that theme detection is always accurate and easy to maintain.

## Implementation

### Theme Store
Themes are managed using Zustand store (`useThemeStore`):

```jsx
import { useThemeStore } from '../store/useThemeStore';

const { theme, setTheme } = useThemeStore();
```

### Theme Application
Themes are applied using DaisyUI's `data-theme` attribute:

```jsx
<div data-theme={theme}>
  {/* Your app content */}
</div>
```

## Demo Page

Visit `/theme-demo` to see all theme toggle components in action and preview different themes.

## Styling

All components use Tailwind CSS and DaisyUI classes for consistent styling across themes.

## Accessibility

- All buttons include proper `title` attributes for tooltips
- Focus states are included for keyboard navigation
- Icons have appropriate colors for visual distinction
- Smooth transitions provide visual feedback

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- CSS transitions for smooth animations
- Local storage for theme persistence 