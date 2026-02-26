import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/config';
import { DEFAULT_APP_CONFIG, type AppConfig } from '../types/appConfig';

const CACHE_KEY = 'app_config_cache';

type AppConfigContextType = {
  config: AppConfig;
  loaded: boolean;
  /** true once Firestore has actually responded (for optional skeleton UI) */
  configReady: boolean;
};

const AppConfigContext = createContext<AppConfigContextType>({
  config: DEFAULT_APP_CONFIG,
  loaded: true,
  configReady: false,
});

function parseConfig(data: Record<string, any>): AppConfig {
  return {
    maintenanceMode: data.maintenanceMode ?? DEFAULT_APP_CONFIG.maintenanceMode,
    maintenanceMessage: data.maintenanceMessage ?? DEFAULT_APP_CONFIG.maintenanceMessage,
    minAppVersion: data.minAppVersion ?? DEFAULT_APP_CONFIG.minAppVersion,
    cvEnabled: data.cvEnabled ?? DEFAULT_APP_CONFIG.cvEnabled,
    bannerEnabled: data.bannerEnabled ?? DEFAULT_APP_CONFIG.bannerEnabled,
    bannerType: data.bannerType ?? DEFAULT_APP_CONFIG.bannerType,
    bannerText: data.bannerText ?? DEFAULT_APP_CONFIG.bannerText,
    bannerBgColor: data.bannerBgColor ?? DEFAULT_APP_CONFIG.bannerBgColor,
    bannerTextColor: data.bannerTextColor ?? DEFAULT_APP_CONFIG.bannerTextColor,
    bannerImageUrl: data.bannerImageUrl ?? DEFAULT_APP_CONFIG.bannerImageUrl,
    bannerImagePath: data.bannerImagePath ?? DEFAULT_APP_CONFIG.bannerImagePath,
    bannerLink: data.bannerLink ?? DEFAULT_APP_CONFIG.bannerLink,
    rateIosLink: data.rateIosLink ?? DEFAULT_APP_CONFIG.rateIosLink,
    rateAndroidLink: data.rateAndroidLink ?? DEFAULT_APP_CONFIG.rateAndroidLink,
  };
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [configReady, setConfigReady] = useState(false);

  // Hydrate from local cache first (instant, no flicker)
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(CACHE_KEY).then((raw) => {
      if (raw && isMounted) {
        try {
          setConfig(parseConfig(JSON.parse(raw)));
        } catch (e) {
          if (__DEV__) console.warn('[AppConfig] Failed to parse cached config:', e);
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Then listen to Firestore and cache every update
  useEffect(() => {
    const ref = doc(db, 'settings', 'appConfig');

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const parsed = parseConfig(data);
          setConfig(parsed);
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        }
        setConfigReady(true);
      },
      (error) => {
        if (__DEV__) console.warn('[AppConfig] Firestore listener error:', error.message);
        setConfigReady(true);
      },
    );

    return unsubscribe;
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, loaded: configReady, configReady }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
