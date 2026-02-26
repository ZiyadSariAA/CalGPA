import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GpaScale = '4' | '5';
export type ThemeMode = 'light' | 'dark' | 'system';

type Settings = {
  gpaScale: GpaScale;
  themeMode: ThemeMode;
  university: string;
};

type SettingsContextType = Settings & {
  setGpaScale: (v: GpaScale) => void;
  setThemeMode: (v: ThemeMode) => void;
  setUniversity: (v: string) => void;
  loaded: boolean;
};

const SettingsContext = createContext<SettingsContextType>({
  gpaScale: '5',
  themeMode: 'system',
  university: '',
  setGpaScale: () => {},
  setThemeMode: () => {},
  setUniversity: () => {},
  loaded: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [gpaScale, setGpaScaleState] = useState<GpaScale>('5');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [university, setUniversityState] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Load on mount — single batch read
  useEffect(() => {
    AsyncStorage.multiGet(['gpa_scale', 'theme_mode', 'university']).then((pairs) => {
      const map = Object.fromEntries(pairs);
      const scale = map['gpa_scale'];
      const theme = map['theme_mode'];
      const uni = map['university'];
      if (scale === '4' || scale === '5') setGpaScaleState(scale);
      if (theme === 'light' || theme === 'dark' || theme === 'system')
        setThemeModeState(theme);
      if (uni) setUniversityState(uni);
      setLoaded(true);
    }).catch((e) => {
      if (__DEV__) console.warn('[SettingsContext] Failed to load settings:', e);
      setLoaded(true);
    });
  }, []);

  const setGpaScale = (v: GpaScale) => {
    setGpaScaleState(v);
    AsyncStorage.setItem('gpa_scale', v);
  };
  const setThemeMode = (v: ThemeMode) => {
    setThemeModeState(v);
    AsyncStorage.setItem('theme_mode', v);
  };
  const setUniversity = (v: string) => {
    setUniversityState(v);
    AsyncStorage.setItem('university', v);
  };

  return (
    <SettingsContext.Provider
      value={{ gpaScale, themeMode, university, setGpaScale, setThemeMode, setUniversity, loaded }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
