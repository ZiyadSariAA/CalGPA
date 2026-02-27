import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../AnimatedView';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';
import { shadows } from '../../theme/shadows';

type StatCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  delay: number;
};

export default function StatCard({ label, value, icon, delay }: StatCardProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <AnimatedView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay }}
      style={{ flex: 1 }}
    >
      <View style={s.statCard}>
        <Ionicons name={icon} size={20} color={colors.primary} style={{ marginBottom: spacing.xs }} />
        <RNText style={s.statValue}>{value}</RNText>
        <RNText style={s.statLabel}>{label}</RNText>
      </View>
    </AnimatedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.md,
      alignItems: 'center',
      ...shadows.sm,
    },
    statValue: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
  });
