import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// RevenueCat API key (test key — replace with production key later)
const REVENUECAT_API_KEY = 'test_FZKaIrgSmcwsukScBNUGqgQZsBj';

// Entitlement identifier configured in RevenueCat dashboard
export const ENTITLEMENT_ID = 'CalGPA Premium';

// Package identifiers from RevenueCat
export const PRODUCT_IDS = {
  monthly: 'monthly',
  threeMonth: 'three_month',
  yearly: 'yearly',
} as const;

// Premium features list (Arabic text + icons for display)
export const PREMIUM_FEATURES = [
  { icon: 'sparkles' as const, text: 'أدوات ذكاء اصطناعي بلا حدود' },
  { icon: 'briefcase' as const, text: 'تفاصيل الفرص الوظيفية' },
  { icon: 'git-compare' as const, text: 'تحليل توافق السيرة الذاتية مع الوظائف' },
  { icon: 'mail' as const, text: 'تنبيهات بريدية للفرص الجديدة' },
] as const;

let configured = false;

export async function configureRevenueCat(): Promise<void> {
  if (configured) return;
  if (Platform.OS === 'web') return;

  try {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] Configuration failed:', e);
  }
}
