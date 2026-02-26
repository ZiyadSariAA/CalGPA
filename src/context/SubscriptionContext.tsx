import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { configureRevenueCat, ENTITLEMENT_ID } from '../constants/subscription';
import { navigationRef } from '../navigation/TabNavigator';

const PREMIUM_CACHE_KEY = 'premium_status';

type SubscriptionContextType = {
  isPremium: boolean;
  isLoading: boolean;
  presentPaywall: () => Promise<boolean>;
  checkStatus: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  isLoading: true,
  presentPaywall: async () => false,
  checkStatus: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updatePremiumStatus = useCallback(async (status: boolean) => {
    setIsPremium(status);
    await AsyncStorage.setItem(PREMIUM_CACHE_KEY, JSON.stringify(status));
  }, []);

  const checkStatus = useCallback(async () => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      await updatePremiumStatus(active);
    } catch (e) {
      if (__DEV__) console.warn('[Subscription] Failed to check status:', e);
    } finally {
      setIsLoading(false);
    }
  }, [updatePremiumStatus]);

  // Initialize: load cache first, then sync with RevenueCat
  useEffect(() => {
    (async () => {
      // Load cached status for instant display
      try {
        const cached = await AsyncStorage.getItem(PREMIUM_CACHE_KEY);
        if (cached !== null) {
          setIsPremium(JSON.parse(cached));
        }
      } catch {}

      // Configure RevenueCat and sync real status
      await configureRevenueCat();
      await checkStatus();
    })();
  }, [checkStatus]);

  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    try {
      navigationRef.current?.navigate('Paywall' as never);
    } catch (e: any) {
      Alert.alert(
        'تعذر فتح صفحة الاشتراك',
        'يرجى المحاولة مرة أخرى لاحقاً',
      );
      if (__DEV__) console.warn('[Subscription] Paywall error:', e);
    }
    return false;
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading, presentPaywall, checkStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
