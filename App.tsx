import { useCallback, useState, useEffect } from 'react';
import { I18nManager, Text, TextInput, View, Modal, StyleSheet, Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import TabNavigator from './src/navigation/TabNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { SemesterProvider } from './src/context/SemesterContext';
import { CVProvider } from './src/context/CVContext';
import { AppConfigProvider, useAppConfig } from './src/context/AppConfigContext';
import { NotificationsProvider } from './src/context/NotificationsContext';

import { APP_INFO } from './src/data/constants';
import { fonts } from './src/theme/fonts';

import { GluestackUIProvider } from '@/src/components/ui/gluestack-ui-provider';
import '@/global.css';

// ─── Force RTL globally ───
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// ─── Default RTL text style for ALL Text & TextInput ───
const defaultTextStyle = {
  textAlign: 'right' as const,
  fontFamily: fonts.regular,
};

// @ts-ignore – defaultProps is deprecated in types but still works at runtime in RN
Text.defaultProps = { ...Text.defaultProps, style: defaultTextStyle };
// @ts-ignore
TextInput.defaultProps = { ...TextInput.defaultProps, style: defaultTextStyle };

function isVersionOutdated(current: string, minimum: string): boolean {
  const cur = current.split('.').map(Number);
  const min = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const c = cur[i] ?? 0;
    const m = min[i] ?? 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false;
}

function AppInner() {
  const { themeMode } = useSettings();
  const { config, configReady } = useAppConfig();
  const needsUpdate = configReady && config.minAppVersion
    ? isVersionOutdated(APP_INFO.version, config.minAppVersion)
    : false;

  const storeUrl = Platform.OS === 'ios'
    ? config.rateIosLink
    : config.rateAndroidLink;

  return (
    <View style={{ flex: 1, direction: 'rtl' }}>
      <GluestackUIProvider mode={themeMode}>
        <SafeAreaProvider>
          <TabNavigator />
          <StatusBar style={themeMode === 'dark' ? 'light' : 'auto'} />

          {/* Force Update Modal */}
          <Modal visible={needsUpdate} transparent animationType="fade">
            <View style={fuStyles.overlay}>
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 160 }}
                style={fuStyles.card}
              >
                <View style={fuStyles.iconWrap}>
                  <Ionicons name="arrow-up-circle" size={48} color="#2D5A3D" />
                </View>
                <Text style={fuStyles.title}>تحديث مطلوب</Text>
                <Text style={fuStyles.message}>
                  يتوفر إصدار جديد من التطبيق. يرجى التحديث للاستمرار.
                </Text>
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: 200 }}
                >
                  <Text
                    style={fuStyles.button}
                    onPress={() => { if (storeUrl) Linking.openURL(storeUrl); }}
                  >
                    تحديث الآن
                  </Text>
                </MotiView>
              </MotiView>
            </View>
          </Modal>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </View>
  );
}

const fuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F0EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2D5A3D',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
});

// Keep the native splash visible until fonts + app are ready
SplashScreen.preventAutoHideAsync();

// Use Expo's built-in smooth fade (the standard way most apps do it)
SplashScreen.setOptions({
  duration: 2000,
  fade: true,
});

export default function App() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    ...Ionicons.font,
  });
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayDone(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const isReady = fontsLoaded && minDelayDone;

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <AppConfigProvider>
      <SettingsProvider>
        <SemesterProvider>
          <CVProvider>
            <NotificationsProvider>
              <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                <ErrorBoundary>
                  <AppInner />
                </ErrorBoundary>
              </View>
            </NotificationsProvider>
          </CVProvider>
        </SemesterProvider>
      </SettingsProvider>
    </AppConfigProvider>
  );
}
