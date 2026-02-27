import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';

type FilterTabButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function FilterTabButton({ label, active, onPress }: FilterTabButtonProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={[s.filterTab, active && s.filterTabActive]}>
        <RNText style={[s.filterTabText, active && s.filterTabTextActive]}>
          {label}
        </RNText>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    filterTab: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterTabText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
    },
    filterTabTextActive: {
      color: colors.white,
    },
  });
