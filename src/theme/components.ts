import { type ViewStyle, type TextStyle } from 'react-native';
import { lightColors } from './colors';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { rtlTextStyle } from './rtl';

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const componentStyles = {
  card: {
    backgroundColor: lightColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  } as ViewStyle,

  cardLarge: {
    backgroundColor: lightColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  } as ViewStyle,

  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightColors.border,
    paddingHorizontal: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as ViewStyle & TextStyle,

  buttonSm: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  buttonMd: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  buttonLg: {
    height: 56,
    borderRadius: radius.lg,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
} as const;
