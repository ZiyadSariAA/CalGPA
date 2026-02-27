import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import AnimatedView from '../AnimatedView';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

type SkeletonCardProps = {
  index: number;
  cardWidth: number;
  numColumns: number;
  gridGap: number;
};

export default function SkeletonCard({ index, cardWidth, numColumns, gridGap }: SkeletonCardProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const isFirstInRow = index % numColumns === 0;

  return (
    <AnimatedView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 800, loop: true }}
      style={{ width: cardWidth, marginStart: isFirstInRow ? 0 : gridGap }}
    >
      <View style={s.card}>
        <View style={[s.logo, { backgroundColor: colors.border, opacity: 0.5 }]} />
        <View style={{ width: 40, height: 8, borderRadius: 4, backgroundColor: colors.border, opacity: 0.4, marginBottom: spacing.xs }} />
        <View style={{ width: 70, height: 8, borderRadius: 4, backgroundColor: colors.border, opacity: 0.4, marginBottom: spacing.xs }} />
        <View style={{ width: '80%', height: 12, borderRadius: 6, backgroundColor: colors.border, opacity: 0.5, marginBottom: 4 }} />
        <View style={{ width: '50%', height: 10, borderRadius: 5, backgroundColor: colors.border, opacity: 0.3 }} />
      </View>
    </AnimatedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      minHeight: 160,
      backgroundColor: colors.surface,
      ...shadows.sm,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
  });
