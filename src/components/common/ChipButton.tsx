import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';

type ChipButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  minWidth?: number;
};

export default function ChipButton({ label, selected, onPress, minWidth }: ChipButtonProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View
        style={[
          s.chip,
          selected && { backgroundColor: colors.primary, borderColor: colors.primary },
          minWidth != null && { minWidth },
        ]}
      >
        <RNText style={[s.chipText, selected && { color: colors.white }]}>
          {label}
        </RNText>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: fonts.semibold,
      textAlign: 'right',
    },
  });
