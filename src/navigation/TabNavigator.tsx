import { createRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { useThemeColors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GPACalculatorScreen from '../screens/GPACalculatorScreen';
import OpportunitiesScreen from '../screens/OpportunitiesScreen';
import OpportunityDetailScreen from '../screens/OpportunityDetailScreen';
import CVListScreen from '../screens/CVListScreen';
import CVFormScreen from '../screens/CVFormScreen';
import CVPreviewScreen from '../screens/CVPreviewScreen';
import CVJobMatchScreen from '../screens/CVJobMatchScreen';
import LegalScreen from '../screens/LegalScreen';
import ContactScreen from '../screens/ContactScreen';
import NotificationsScreen from '../screens/NotificationsScreen';


export const navigationRef = createRef<NavigationContainerRef<any>>();

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function TabsNavigator() {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'متابعة',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Opportunities"
        component={OpportunitiesScreen}
        options={{
          tabBarLabel: 'فرص',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'الإعدادات',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      >
        <RootStack.Screen name="Tabs" component={TabsNavigator} />
        <RootStack.Screen name="GPACalculator" component={GPACalculatorScreen} />
        <RootStack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
        <RootStack.Screen name="CVList" component={CVListScreen} />
        <RootStack.Screen name="CVForm" component={CVFormScreen} />
        <RootStack.Screen name="CVPreview" component={CVPreviewScreen} />
        <RootStack.Screen name="CVJobMatch" component={CVJobMatchScreen} />
        <RootStack.Screen name="Legal" component={LegalScreen} />
        <RootStack.Screen name="Contact" component={ContactScreen} />
        <RootStack.Screen name="Notifications" component={NotificationsScreen} />

      </RootStack.Navigator>
    </NavigationContainer>
  );
}
