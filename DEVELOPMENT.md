# CalGPA Development Guide

## Overview

CalGPA is a React Native mobile GPA calculator with premium subscription features powered by RevenueCat. This guide explains the native dependencies, development environments, and how to test different features.

---

## Native Dependencies Analysis

### 🔐 **RevenueCat (In-App Purchases)** — Requires Development Build

**Packages:**
- `react-native-purchases` (v9.10.4)
- `react-native-purchases-ui` (v9.10.4)

**Location in codebase:**
- Context: `src/context/SubscriptionContext.tsx`
- Configuration: `src/constants/subscription.ts`
- API Key: Test key configured (`test_FZKaIrgSmcwsukScBNUGqgQZsBj`)

**Why Development Build is required:**
- Native iOS StoreKit and Google Play Billing integration
- Paywall UI uses native components
- **Does NOT work in Expo Go**

**Current Expo Go behavior:**
- App detects Expo Go environment (line 78-84 in SubscriptionContext)
- Shows Arabic alert: "غير متاح في Expo Go"
- Suggests using `npx expo run:android` or `npx expo run:ios`

---

### ✅ **Other Native Modules (Compatible with Expo Go)**

| Package | Version | Expo Go Support | Notes |
|---------|---------|-----------------|-------|
| `react-native-reanimated` | 4.1.0 | ⚠️ Limited | Development Build recommended for advanced animations |
| `react-native-gesture-handler` | 2.28.0 | ✅ Yes | Pre-installed in Expo Go |
| `lottie-react-native` | 7.0.0 | ✅ Yes | Pre-installed in Expo Go |
| `@react-native-async-storage/async-storage` | 1.23.1 | ✅ Yes | Pre-installed in Expo Go |
| `expo-file-system` | — | ✅ Yes | Expo native module |
| `expo-print` | — | ✅ Yes | Expo native module |
| `expo-sharing` | — | ✅ Yes | Expo native module |
| `expo-haptics` | — | ✅ Yes | Expo native module |
| `expo-font` | — | ✅ Yes | Expo native module |

---

## Development Environments

### Option 1: Expo Go (Quick Testing)

**What works:**
- ✅ All UI screens and navigation
- ✅ GPA calculator features
- ✅ CV creation and PDF export
- ✅ Firebase remote config
- ✅ All animations (Lottie, Moti, Reanimated)
- ✅ Gesture handling
- ✅ Local storage (AsyncStorage)
- ✅ Mock paywall flow (shows alert instead of real paywall)

**What DOESN'T work:**
- ❌ Real RevenueCat paywall UI
- ❌ Real in-app purchases
- ❌ Subscription status checking with App Store/Play Store

**How to run:**

```bash
# 1. Launch Android emulator (if using Pixel 7a)
emulator -avd Pixel_7a

# 2. Start Expo dev server
npm start

# 3. Press 'a' to open on Android (or 'i' for iOS)
```

**Best for:**
- UI development and testing
- Feature development (non-payment)
- Quick iteration cycles
- Testing layout, navigation, animations

---

### Option 2: Development Build (Full Testing)

**What works:**
- ✅ Everything from Option 1
- ✅ Real RevenueCat paywall UI
- ✅ Subscription testing with test accounts
- ✅ Full native module support
- ✅ Production-like environment

**How to create:**

```bash
# Local build (Android)
npx expo run:android

# Local build (iOS, macOS only)
npx expo run:ios

# Cloud build with EAS (recommended for iOS on Windows)
npx expo install eas-cli
eas build --profile development --platform android
eas build --profile development --platform ios
```

**Additional setup for real payments:**

1. **Google Play Console** (Android)
   - Developer account required ($25 one-time fee)
   - Create subscription products in Play Console
   - Configure license testers for free test purchases
   - Link to RevenueCat in Play Console settings

2. **App Store Connect** (iOS)
   - Apple Developer account required ($99/year)
   - Create subscription products in App Store Connect
   - Configure sandbox testers
   - Link to RevenueCat in App Store settings

3. **RevenueCat Dashboard**
   - Replace test API key with production key in `src/constants/subscription.ts`
   - Configure products to match store IDs
   - Set up entitlements

**Best for:**
- Testing real in-app purchases
- Testing paywall UI
- Production builds
- Full feature testing before release

---

## Testing Subscriptions

### Test Mode (Current Configuration)

The app is currently configured with RevenueCat test key:
```typescript
// src/constants/subscription.ts
export const REVENUECAT_API_KEY = 'test_FZKaIrgSmcwsukScBNUGqgQZsBj';
```

**To test payments:**
1. Create Development Build (Option 2)
2. Set up test products in Google Play Console / App Store Connect
3. Configure matching products in RevenueCat dashboard
4. Use test accounts to make purchases

### Mock Mode (Expo Go)

When running in Expo Go, the app shows an alert instead of the paywall:
```typescript
// src/context/SubscriptionContext.tsx (lines 78-84)
if (__DEV__ && Constants.appOwnership === 'expo') {
  Alert.alert(
    'غير متاح في Expo Go',
    'صفحة الاشتراكات تعمل فقط في التطبيق الكامل...'
  );
  return;
}
```

---

## Recommended Workflow

### 1. Start with Expo Go
```bash
npm start
```
- Develop UI and features
- Test navigation and animations
- Fast iteration cycles

### 2. Test with Development Build
```bash
npx expo run:android
```
- Test real paywall UI
- Verify subscription flows
- Test production-like behavior

### 3. Production Build
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```
- Final testing before release
- Submit to stores

---

## Common Issues

### "Subscription page only works in full app"
**Cause:** Running in Expo Go
**Solution:** Create Development Build with `npx expo run:android`

### RevenueCat initialization fails
**Cause:** Invalid API key or network issues
**Solution:** Check `REVENUECAT_API_KEY` in `src/constants/subscription.ts`

### Purchases not working in development
**Cause:** Products not configured in store
**Solution:** Create subscription products in Google Play Console / App Store Connect

---

## Firebase Configuration

The app uses Firebase for remote config only (not authentication):
- Config file: `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
- Features: Remote feature flags, A/B testing
- No Google Sign-In implemented

---

## Next Steps

1. **For quick testing:** Run in Expo Go with `npm start`
2. **For paywall testing:** Create Development Build with `npx expo run:android`
3. **For store submission:** Set up EAS Build and create production builds

---

## Additional Resources

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)
