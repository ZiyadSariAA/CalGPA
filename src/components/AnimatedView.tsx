import { View, Platform } from 'react-native';
import { MotiView } from 'moti';

/**
 * MotiView on native, plain View on web.
 * Use this instead of repeating the platform check in every file.
 */
const AnimatedView = Platform.OS === 'web' ? View : MotiView;

export default AnimatedView;
