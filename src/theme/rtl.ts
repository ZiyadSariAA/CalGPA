import { I18nManager, type TextStyle, type ViewStyle } from 'react-native';

export const isRTL = I18nManager.isRTL;

/** RTL-aware chevron: points left in RTL (forward), right in LTR (forward) */
export const chevronForward = isRTL ? 'chevron-back' : 'chevron-forward';
/** RTL-aware chevron: points right in RTL (back), left in LTR (back) */
export const chevronBack = isRTL ? 'chevron-forward' : 'chevron-back';

export const rtlTextStyle: TextStyle = {
  textAlign: 'right',
  writingDirection: 'rtl',
};

/** When I18nManager.forceRTL(true) is active, use 'row' (RTL flips it). Use 'row-reverse' only when RTL is OFF. */
export const rtlRowStyle: ViewStyle = {
  flexDirection: 'row',
};

export const rtlContainerStyle: ViewStyle = {
  direction: 'rtl',
};

export const rtlStyles = {
  text: rtlTextStyle,
  row: rtlRowStyle,
  container: rtlContainerStyle,
} as const;
