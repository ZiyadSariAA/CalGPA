import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import AnimatedView from '../AnimatedView';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';

type ProgressBarProps = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={s.progressWrap}>
      <View style={s.progressTrack}>
        <AnimatedView
          animate={{ width: `${((current + 1) / total) * 100}%` as any }}
          transition={{ type: 'timing', duration: 300 }}
          style={s.progressFill}
        />
      </View>
      <RNText style={s.progressText}>
        {current + 1} / {total}
      </RNText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    progressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    progressText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
  });
