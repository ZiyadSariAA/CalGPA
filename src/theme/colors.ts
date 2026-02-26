export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  red: string;
  orange: string;
  overlay: string;
  white: string;
};

export const lightColors: ThemeColors = {
  // Brand
  primary: '#2D5A3D',
  primaryLight: '#E8F0EA',
  primaryDark: '#1E3D2A',

  // Secondary
  secondary: '#3B82F6',
  secondaryLight: '#DBEAFE',

  // Backgrounds
  background: '#FAF9F6',
  surface: '#FFFFFF',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',

  // Borders
  border: '#E5E5E5',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Legacy aliases
  red: '#EF4444',
  orange: '#F59E0B',

  // Utility
  overlay: 'rgba(0,0,0,0.4)',
  white: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  // Brand
  primary: '#4ADE80',
  primaryLight: '#1A3A2A',
  primaryDark: '#2D5A3D',

  // Secondary
  secondary: '#60A5FA',
  secondaryLight: '#1E3A5F',

  // Backgrounds
  background: '#121212',
  surface: '#1E1E1E',

  // Text
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',

  // Borders
  border: '#333333',

  // Status
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  // Legacy aliases
  red: '#F87171',
  orange: '#FBBF24',

  // Utility
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
};

/** Backward-compatible default export (= light palette) */
export const colors = lightColors;
