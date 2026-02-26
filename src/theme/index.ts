import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { lightColors, darkColors, type ThemeColors } from './colors';

export * from './colors';
export * from './typography';
export * from './fonts';
export * from './spacing';
export * from './shadows';
export * from './components';
export * from './rtl';

/**
 * Returns the resolved color palette based on the user's theme preference.
 * - 'light' → lightColors
 * - 'dark'  → darkColors
 * - 'system' → follows device color scheme
 */
export function useThemeColors(): ThemeColors {
  const { themeMode } = useSettings();
  const systemScheme = useColorScheme();

  if (themeMode === 'dark') return darkColors;
  if (themeMode === 'light') return lightColors;

  // system mode
  return systemScheme === 'dark' ? darkColors : lightColors;
}

/**
 * Convenience hook: returns memoized styles that recompute when theme changes.
 * Usage: const styles = useThemedStyles(createStyles);
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const colors = useThemeColors();
  return useMemo(() => factory(colors), [factory, colors]);
}
