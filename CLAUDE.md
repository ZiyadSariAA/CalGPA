# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CalGPA is a React Native mobile GPA calculator app built with Expo and TypeScript. It targets iOS, Android, and Web. The app is configured for RTL (right-to-left) layout via `I18nManager.forceRTL(true)` in App.tsx, indicating Arabic language support.

## Commands

- `npm start` — Start Expo dev server
- `npm run android` — Run on Android
- `npm run ios` — Run on iOS
- `npm run web` — Run on Web

No test or lint commands are configured.

## Architecture

**Entry:** `index.ts` → `App.tsx` (wraps app in SafeAreaProvider, forces RTL) → `TabNavigator`

**Source layout (`src/`):**
- `screens/` — Five tab screens: Home, GPACalculator, GPAType, Opportunities, Settings
- `navigation/TabNavigator.tsx` — Bottom tab navigator using @react-navigation/bottom-tabs
- `components/` — Reusable components (e.g., CircleButton)
- `theme/colors.ts` — Centralized color palette (primary: `#2D5A3D` forest green, background: `#FAF9F6`)

**Key patterns:**
- Functional components with explicit TypeScript prop types
- Styles via `StyleSheet.create()` co-located in each file
- Theme colors imported from `src/theme/colors.ts` — always use these, don't hardcode colors
- RTL layout is force-enabled globally; all UI must work in RTL direction

**Key dependencies:** Expo 54, React 19, React Navigation 7, Moti + Lottie + react-native-animatable for animations, AsyncStorage for local persistence, expo-haptics for haptic feedback.
