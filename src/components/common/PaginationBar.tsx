import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';

type PaginationBarProps = {
  page: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
};

export default function PaginationBar({ page, totalPages, onNext, onPrev }: PaginationBarProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  if (totalPages <= 1) return null;

  return (
    <View style={s.paginationBar}>
      <Pressable
        onPress={() => {
          if (page > 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPrev();
          }
        }}
        disabled={page <= 1}
      >
        <View style={[s.pageBtn, { backgroundColor: page > 1 ? colors.primary : colors.border }]}>
          <RNText style={s.pageBtnText}>السابق</RNText>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </View>
      </Pressable>

      <View style={s.pageIndicator}>
        <RNText style={s.pageIndicatorText}>
          {page} / {totalPages}
        </RNText>
      </View>

      <Pressable
        onPress={() => {
          if (page < totalPages) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }
        }}
        disabled={page >= totalPages}
      >
        <View style={[s.pageBtn, { backgroundColor: page < totalPages ? colors.primary : colors.border }]}>
          <Ionicons name="chevron-back" size={18} color={colors.white} />
          <RNText style={s.pageBtnText}>التالي</RNText>
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    paginationBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingVertical: spacing.lg,
      width: '100%',
    },
    pageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: 12,
    },
    pageBtnText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    pageIndicator: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
    },
    pageIndicatorText: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
  });
