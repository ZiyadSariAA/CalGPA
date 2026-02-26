# CalGPA - Native Dependencies & Expo Compatibility Analysis

**Date:** 2026-02-26
**Project:** CalGPA - React Native GPA Calculator with In-App Purchases
**Framework:** Expo 54 + React Native 0.81.5

---

## 🎯 Quick Answer Summary

### Critical Finding: RevenueCat Requires Development Build

**YES**, this app uses **RevenueCat** for in-app purchases and subscriptions. This is a **native module** that:
- ❌ **Does NOT work in Expo Go**
- ✅ **Requires an Expo Development Build** to function
- ✅ **Already fully implemented** in the codebase

### Google Sign-In Status
**NO**, this app does NOT use Google Sign-In. No Google authentication libraries are present.

---

## 📦 Complete Native Dependencies Analysis

### 1. **RevenueCat (In-App Purchases) - REQUIRES DEV BUILD**

**Packages:**
```json
"react-native-purchases": "^9.10.4"
"react-native-purchases-ui": "^9.10.4"
```

**Implementation Files:**
- `src/context/SubscriptionContext.tsx` - Main subscription logic
- `src/constants/subscription.ts` - RevenueCat configuration
- `src/screens/SettingsScreen.tsx` - Subscription management UI
- `src/screens/OpportunitiesScreen.tsx` - Paywall trigger
- `src/screens/EmailAlertsScreen.tsx` - Premium feature

**Configuration Details:**
```typescript
// From src/constants/subscription.ts
REVENUECAT_API_KEY = 'test_FZKaIrgSmcwsukScBNUGqgQZsBj' // Test key
ENTITLEMENT_ID = 'CalGPA Premium'
PRODUCT_IDS = {
  monthly: 'monthly',
  threeMonth: 'three_month',
  yearly: 'yearly'
}
```

**Premium Features Locked Behind Paywall:**
1. Opportunity details view
2. Email alerts
3. AI job matching (CV-to-job compatibility)
4. Unlimited AI tools

**Expo Go Detection Code:**
```typescript
// From SubscriptionContext.tsx (lines 13-14, 78-84)
function isExpoGo(): boolean {
  return !NativeModules.RNPurchases && !!(globalThis as any).expo?.modules?.ExpoGo;
}

// When user tries to access paywall in Expo Go:
if (isExpoGo()) {
  Alert.alert(
    'غير متاح في Expo Go',
    'صفحة الاشتراك تعمل فقط في نسخة التطبيق الكاملة (Development Build). استخدم "npx expo run:ios" أو "npx expo run:android" لتجربة الاشتراك.',
  );
  return false;
}
```

**Why it needs Development Build:**
- Uses native iOS StoreKit APIs
- Uses native Android Google Play Billing APIs
- Native UI components for paywall display
- Requires access to app store subscription infrastructure

---

### 2. **Other Native Modules (Varying Compatibility)**

#### **React Native Reanimated** - Development Build Recommended
```json
"react-native-reanimated": "~4.1.0"
```
- **Status:** ⚠️ Partially works in Expo Go
- **Used for:** Advanced animations throughout the app
- **Recommendation:** Works with limitations in Expo Go; Development Build gives full performance
- **Used in:** Multiple components with Moti animations

---

#### **React Native Gesture Handler** - ✅ Works in Expo Go
```json
"react-native-gesture-handler": "~2.28.0"
```
- **Status:** ✅ Fully works in Expo Go
- **Why:** Pre-installed in Expo Go client
- **Used for:** Touch gestures, swipe actions, navigation gestures

---

#### **Lottie React Native** - ✅ Works in Expo Go
```json
"lottie-react-native": "7.0.0"
```
- **Status:** ✅ Fully works in Expo Go
- **Why:** Pre-installed in Expo Go client
- **Used for:** Complex animations (loading states, success animations)

---

#### **AsyncStorage** - ✅ Works in Expo Go
```json
"@react-native-async-storage/async-storage": "1.23.1"
```
- **Status:** ✅ Fully works in Expo Go
- **Why:** Pre-installed in Expo Go client
- **Used for:**
  - Caching premium subscription status
  - Storing GPA calculation history
  - Saving CV data
  - Theme preferences
  - App configuration cache

---

#### **React Native Screens** - ✅ Works in Expo Go
```json
"react-native-screens": "~4.4.0"
```
- **Status:** ✅ Fully works in Expo Go
- **Why:** Pre-installed in Expo Go client
- **Used for:** Native screen optimization for React Navigation

---

#### **React Native SVG** - ✅ Works in Expo Go
```json
"react-native-svg": "^15.13.0"
```
- **Status:** ✅ Fully works in Expo Go
- **Why:** Pre-installed in Expo Go client
- **Used for:** Vector graphics and icons

---

#### **React Native Safe Area Context** - ✅ Works in Expo Go
```json
"react-native-safe-area-context": "^5.6.1"
```
- **Status:** ✅ Fully works in Expo Go
- **Why:** Pre-installed in Expo Go client
- **Used for:** Safe area insets (notch, status bar, home indicator)

---

#### **React Native Draggable FlatList** - ✅ Works in Expo Go
```json
"react-native-draggable-flatlist": "^4.0.3"
```
- **Status:** ✅ Works in Expo Go
- **Used for:** Drag-and-drop reordering in CV sections

---

### 3. **Expo Native Modules (All Work in Expo Go)**

All Expo modules work natively in Expo Go:

```json
"expo-file-system": "~19.0.21"      // ✅ File operations
"expo-font": "~14.0.11"             // ✅ Custom font loading
"expo-haptics": "~14.0.0"           // ✅ Haptic feedback
"expo-print": "~15.0.8"             // ✅ PDF printing
"expo-sharing": "~14.0.8"           // ✅ Share sheet
"expo-splash-screen": "~31.0.13"    // ✅ Splash screen
"expo-status-bar": "~3.0.9"         // ✅ Status bar styling
```

**Usage in app:**
- `expo-file-system` + `expo-print` - CV PDF export
- `expo-sharing` - Share CVs and reports
- `expo-haptics` - Tactile feedback on button presses
- `expo-font` - Arabic font loading (IBM Plex Sans Arabic)

---

### 4. **Firebase** - ✅ Works in Expo Go

```json
"firebase": "^12.9.0"
```

- **Status:** ✅ Fully works in Expo Go (JavaScript SDK)
- **Not using:** Firebase Authentication (no Google Sign-In)
- **Using:** Firestore for remote configuration only
- **Implementation:** `src/firebase/config.ts` + `src/context/AppConfigContext.tsx`

**Remote Config Features:**
- Maintenance mode toggle
- Feature flags (e.g., CV tool enable/disable)
- Promotional banners
- Dynamic content updates
- App version enforcement

---

### 5. **Animation Libraries** - ✅ Work in Expo Go

```json
"moti": "^0.30.0"                      // ✅ Animation library
"react-native-animatable": "^1.4.0"    // ✅ Additional animations
"@legendapp/motion": "^2.3.0"          // ✅ Motion primitives
"react-native-worklets": "^0.5.1"      // ⚠️ Works but limited
```

All animation libraries work in Expo Go with varying performance levels.

---

### 6. **UI Libraries** - ✅ All Work in Expo Go

```json
"nativewind": "^4.1.23"                // ✅ Tailwind CSS
"@gluestack-ui/core": "^3.0.10"        // ✅ UI components
"react-aria": "^3.33.0"                // ✅ Accessibility
"tailwind-variants": "^0.1.20"         // ✅ Variant management
```

All UI libraries are JavaScript-based and work perfectly in Expo Go.

---

## 📊 Comprehensive Compatibility Matrix

| Package | Version | Expo Go | Dev Build | Notes |
|---------|---------|---------|-----------|-------|
| **react-native-purchases** | 9.10.4 | ❌ No | ✅ Yes | **CRITICAL: Main blocker** |
| **react-native-purchases-ui** | 9.10.4 | ❌ No | ✅ Yes | **CRITICAL: Main blocker** |
| react-native-reanimated | 4.1.0 | ⚠️ Limited | ✅ Yes | Works but slower |
| react-native-gesture-handler | 2.28.0 | ✅ Yes | ✅ Yes | Pre-installed |
| react-native-screens | 4.4.0 | ✅ Yes | ✅ Yes | Pre-installed |
| lottie-react-native | 7.0.0 | ✅ Yes | ✅ Yes | Pre-installed |
| react-native-svg | 15.13.0 | ✅ Yes | ✅ Yes | Pre-installed |
| react-native-safe-area-context | 5.6.1 | ✅ Yes | ✅ Yes | Pre-installed |
| react-native-draggable-flatlist | 4.0.3 | ✅ Yes | ✅ Yes | JS-based |
| @react-native-async-storage | 1.23.1 | ✅ Yes | ✅ Yes | Pre-installed |
| All expo-* modules | Various | ✅ Yes | ✅ Yes | Expo managed |
| firebase | 12.9.0 | ✅ Yes | ✅ Yes | JS SDK |
| moti | 0.30.0 | ✅ Yes | ✅ Yes | JS-based |
| nativewind | 4.1.23 | ✅ Yes | ✅ Yes | JS-based |

**Legend:**
- ✅ Fully supported
- ⚠️ Partial support (works with limitations)
- ❌ Not supported (requires Development Build)

---

## 🚫 What Does NOT Work in Expo Go

### RevenueCat In-App Purchases (The Only Blocker)

**What breaks:**
1. **Paywall UI** - `RevenueCatUI.presentPaywall()` will not work
2. **Subscription status** - Cannot check real App Store/Play Store entitlements
3. **Purchase flow** - Cannot process real payments
4. **Restoration** - Cannot restore previous purchases

**What the app does:**
- Detects Expo Go environment automatically
- Shows Arabic alert explaining limitation
- Suggests running `npx expo run:android` or `npx expo run:ios`
- Prevents crashes by graceful fallback

**Code evidence:**
```typescript
// src/context/SubscriptionContext.tsx
const presentPaywall = useCallback(async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  if (isExpoGo()) {
    Alert.alert(
      'غير متاح في Expo Go',
      'صفحة الاشتراك تعمل فقط في نسخة التطبيق الكاملة...'
    );
    return false;
  }

  try {
    const result = await RevenueCatUI.presentPaywall();
    // ... handle purchase
  } catch (e) {
    // ... error handling
  }
}, [updatePremiumStatus]);
```

---

## ✅ What DOES Work in Expo Go

Everything else works perfectly:

### Core Features
- ✅ All navigation (bottom tabs + stack navigation)
- ✅ GPA calculator (semester & cumulative)
- ✅ GPA history tracking
- ✅ GPA trend charts
- ✅ CV creation and editing
- ✅ CV preview
- ✅ CV PDF export
- ✅ Opportunities list and filtering
- ✅ Notifications system
- ✅ Settings (theme, GPA scale)
- ✅ Firebase remote config
- ✅ All animations and transitions
- ✅ Haptic feedback
- ✅ RTL layout support
- ✅ Dark mode theming

### What appears but doesn't work fully
- ⚠️ Paywall UI trigger (shows alert instead of real paywall)
- ⚠️ Premium status (always shows as free user in Expo Go)
- ⚠️ Subscription management (shows but cannot process)

---

## 🔐 Google Sign-In Analysis

### Is Google Sign-In Implemented?
**NO** ❌

### Proof - Package.json Check:
```bash
# NOT in dependencies:
❌ @react-native-google-signin/google-signin
❌ expo-auth-session (with Google provider)
❌ expo-google-app-auth (deprecated)
❌ react-native-google-sign-in
```

### Firebase Usage Analysis:
```typescript
// src/firebase/config.ts - Only remote config, NO auth
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// NO imports for:
// ❌ import { getAuth } from 'firebase/auth';
// ❌ import { GoogleAuthProvider } from 'firebase/auth';
```

### Authentication Status:
- **No authentication system** implemented
- **No login/signup screens**
- **No user accounts**
- App works entirely offline after initial Firebase config fetch
- All data stored locally in AsyncStorage

### Could Google Sign-In be added?
Yes, but would require:
1. Adding `@react-native-google-signin/google-signin` package
2. Creating Development Build (native module)
3. Google Cloud Console setup
4. Firebase Authentication configuration
5. iOS/Android app registration

**Current state:** Not planned, not needed for current features.

---

## 📱 App Configuration Analysis

### From app.json:
```json
{
  "expo": {
    "name": "CalGPA",
    "version": "1.0.0",
    "newArchEnabled": true,
    "plugins": ["expo-font"],
    "android": {
      "supportsRTL": true,
      "edgeToEdgeEnabled": true
    }
  }
}
```

**Key points:**
- ✅ New Architecture enabled (React Native 0.81.5)
- ✅ RTL support enabled for Arabic
- ✅ Only one plugin: `expo-font` (works in Expo Go)
- ❌ No RevenueCat plugin configured (would need: `react-native-purchases` in plugins array for EAS Build)

---

## 🛠️ Development Workflow Recommendations

### For UI/UX Development (Expo Go)
**Recommended when:**
- Building new screens
- Designing layouts
- Testing animations
- Implementing non-payment features
- Testing Firebase remote config
- Arabic/RTL layout testing

**Command:**
```bash
npm start
# Then press 'a' for Android or 'i' for iOS
```

---

### For Payment Testing (Development Build)
**Required when:**
- Testing paywall UI
- Testing subscription purchases
- Testing payment restoration
- Testing premium feature unlocking
- Preparing for production release

**Commands:**
```bash
# Local Development Build
npx expo run:android  # For Android
npx expo run:ios      # For iOS (requires macOS)

# Or cloud build with EAS
npx eas-cli install
eas build --profile development --platform android
```

**Additional setup needed:**
1. Google Play Developer account ($25 USD one-time fee)
2. Create subscription products in Play Console
3. Replace test RevenueCat key with production key
4. Set up license testers for free test purchases
5. Configure RevenueCat dashboard with product IDs

---

## 📋 Complete Package.json Breakdown

### Dependencies (51 total)

**Navigation (3):**
```json
"@react-navigation/bottom-tabs": "^7.0.0"
"@react-navigation/native": "^7.0.0"
"@react-navigation/native-stack": "^7.0.0"
```

**Monetization (2) - REQUIRES DEV BUILD:**
```json
"react-native-purchases": "^9.10.4"
"react-native-purchases-ui": "^9.10.4"
```

**Storage (1):**
```json
"@react-native-async-storage/async-storage": "1.23.1"
```

**Firebase (1):**
```json
"firebase": "^12.9.0"
```

**Animations (6):**
```json
"moti": "^0.30.0"
"lottie-react-native": "7.0.0"
"react-native-animatable": "^1.4.0"
"@legendapp/motion": "^2.3.0"
"react-native-reanimated": "~4.1.0"
"react-native-worklets": "^0.5.1"
```

**UI/Styling (7):**
```json
"nativewind": "^4.1.23"
"@gluestack-ui/core": "^3.0.10"
"@gluestack-ui/utils": "^3.0.11"
"tailwind-variants": "^0.1.20"
"react-aria": "^3.33.0"
"react-stately": "^3.39.0"
"@expo/html-elements": "^0.10.1"
```

**Core React Native (9):**
```json
"react": "19.1.0"
"react-dom": "^19.1.0"
"react-native": "0.81.5"
"react-native-web": "^0.21.2"
"react-native-gesture-handler": "~2.28.0"
"react-native-reanimated": "~4.1.0"
"react-native-screens": "~4.4.0"
"react-native-svg": "^15.13.0"
"react-native-safe-area-context": "^5.6.1"
```

**Expo Core (10):**
```json
"expo": "~54.0.33"
"expo-file-system": "~19.0.21"
"expo-font": "~14.0.11"
"expo-haptics": "~14.0.0"
"expo-print": "~15.0.8"
"expo-sharing": "~14.0.8"
"expo-splash-screen": "~31.0.13"
"expo-status-bar": "~3.0.9"
"@expo/metro-runtime": "^6.1.2"
"@expo/vector-icons": "^14.0.0"
```

**Fonts (1):**
```json
"@expo-google-fonts/ibm-plex-sans-arabic": "^0.4.1"
```

**Utilities (2):**
```json
"react-native-draggable-flatlist": "^4.0.3"
```

### Dev Dependencies (6)

```json
"@types/react": "~19.1.0"
"babel-plugin-module-resolver": "^5.0.0"
"prettier-plugin-tailwindcss": "^0.5.11"
"tailwindcss": "^3.4.17"
"typescript": "~5.9.2"
```

---

## 🎯 Final Summary

### Question 1: What requires Development Build?
**Answer:** Only **RevenueCat** (`react-native-purchases` + `react-native-purchases-ui`)

### Question 2: Is Google Sign-In implemented?
**Answer:** **NO** - No Google authentication libraries or Firebase Auth implementation

### Question 3: Is RevenueCat/IAP implemented?
**Answer:** **YES** - Fully implemented with:
- Test API key configured
- 4 premium features locked
- 3 subscription tiers (monthly, 3-month, yearly)
- Paywall UI integration
- Subscription status caching

### Question 4: Other native modules that won't work in Expo Go?
**Answer:** **None** - RevenueCat is the only blocker. Everything else works.

### Bottom Line:
- **99% of the app works in Expo Go**
- Only payment/subscription features require Development Build
- Can develop and test most features with `npm start` → Expo Go
- Need Development Build only when ready to test actual payments

---

## 📞 Contact & Context

This analysis is for AI assistants working on the CalGPA project. If you need to understand:
- Why certain features don't work in Expo Go → RevenueCat is the reason
- Whether to recommend Development Build → Only if testing payments
- What the user can test immediately → Everything except RevenueCat paywall

**Environment:**
- Platform: Windows 11
- Shell: bash
- Android SDK: Installed at `C:\Users\Ziyad\AppData\Local\Android\Sdk`
- Android Emulator: Pixel 7a AVD exists
- Current branch: master

---

**Last Updated:** 2026-02-26
**Document Version:** 1.0
**Project Version:** 1.0.0
