import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../AnimatedView';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';
import { shadows } from '../../theme/shadows';
import type { SavedSemester } from '../../context/SemesterContext';

type Props = {
  semester: SavedSemester;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

export default function SemesterCard({ semester, index, onEdit, onDelete }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const date = new Date(semester.createdAt);
  const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

  return (
    <AnimatedView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: Math.min(index * 60, 300) }}
    >
      <View style={s.semesterCard}>
        <View style={s.semesterCardInner}>
          <View style={s.cardActions}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(); }} style={s.actionBtn}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDelete(); }} style={s.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <RNText style={s.semesterLabel}>{semester.label}</RNText>
            <View style={s.semesterMeta}>
              <RNText style={s.semesterMetaText}>المعدل: {semester.gpa.toFixed(2)}</RNText>
              <RNText style={s.semesterMetaText}>|</RNText>
              <RNText style={s.semesterMetaText}>{semester.creditHours} ساعة</RNText>
              <RNText style={s.semesterMetaText}>|</RNText>
              <RNText style={s.semesterMetaText}>{dateStr}</RNText>
            </View>
          </View>
        </View>
      </View>
    </AnimatedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    semesterCard: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, ...shadows.sm },
    semesterCardInner: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
    semesterLabel: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, textAlign: 'right', writingDirection: 'rtl' },
    semesterMeta: { flexDirection: 'row-reverse', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap', justifyContent: 'flex-end' },
    semesterMetaText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, writingDirection: 'rtl' },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    actionBtn: { padding: spacing.sm },
  });
