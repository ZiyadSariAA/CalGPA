import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '../theme';
import { useResponsive } from '../theme/responsive';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Skip the max-width inner container (e.g. for screens that manage their own width) */
  fullWidth?: boolean;
};

export default function ScreenLayout({ children, style, fullWidth }: Props) {
  const colors = useThemeColors();
  const { isTablet, maxContentWidth } = useResponsive();

  if (fullWidth || !isTablet) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <View style={[styles.inner, { maxWidth: maxContentWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'rtl',
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
