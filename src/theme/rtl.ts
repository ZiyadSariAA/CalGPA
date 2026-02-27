import { I18nManager } from 'react-native';

const isRTL = I18nManager.isRTL;

/** RTL-aware chevron: points left in RTL (forward), right in LTR (forward) */
export const chevronForward = isRTL ? 'chevron-back' : 'chevron-forward';
/** RTL-aware chevron: points right in RTL (back), left in LTR (back) */
export const chevronBack = isRTL ? 'chevron-forward' : 'chevron-back';
