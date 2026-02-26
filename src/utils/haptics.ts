import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export async function impactAsync(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS !== 'web') {
    return Haptics.impactAsync(style);
  }
}

export async function notificationAsync(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
  if (Platform.OS !== 'web') {
    return Haptics.notificationAsync(type);
  }
}

export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
