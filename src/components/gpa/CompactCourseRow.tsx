import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../AnimatedView';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';

type Course = {
  id: string;
  name: string;
  creditHours: number | null;
  grade: string | null;
};

type Props = {
  course: Course;
  index: number;
  onEdit: () => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
};

export default function CompactCourseRow({ course, index, onEdit, onDelete, canDelete }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const isIncomplete = course.creditHours == null || course.grade == null;

  return (
    <AnimatedView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: index * 60 }}
    >
      <Pressable onPress={onEdit}>
        <View style={[s.compactRow, isIncomplete && s.compactRowIncomplete]}>
          <View style={s.compactRowInner}>
            <View style={s.compactInfo}>
              <RNText style={s.compactLabel}>مادة {index + 1}</RNText>
              {course.name !== '' && (
                <RNText style={s.compactName} numberOfLines={1}>{course.name}</RNText>
              )}
            </View>

            <View style={s.compactBadges}>
              <View style={[s.badge, course.grade != null && s.badgeFilled]}>
                <RNText style={[s.badgeText, course.grade != null && s.badgeTextFilled]}>
                  {course.grade ?? 'التقدير'}
                </RNText>
              </View>
              <View style={[s.badge, course.creditHours != null && s.badgeFilled]}>
                <RNText style={[s.badgeText, course.creditHours != null && s.badgeTextFilled]}>
                  {course.creditHours != null ? `${course.creditHours} س` : 'س'}
                </RNText>
              </View>
            </View>

            <View style={s.compactActions}>
              {canDelete && (
                <Pressable
                  onPress={(e) => {
                    (e as any)?.stopPropagation?.();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDelete(course.id);
                  }}
                  style={s.compactIconBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </Pressable>
              )}
              <Pressable
                onPress={(e) => {
                  (e as any)?.stopPropagation?.();
                  onEdit();
                }}
                style={s.compactIconBtn}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </AnimatedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    compactRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
    compactRowIncomplete: { borderStartWidth: 3, borderStartColor: colors.warning },
    compactRowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '100%' },
    compactInfo: { flex: 1, alignItems: 'flex-start' },
    compactLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, textAlign: 'right' },
    compactName: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
    compactBadges: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
    badge: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, minWidth: 36, alignItems: 'center' },
    badgeFilled: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    badgeText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.semibold, textAlign: 'center' },
    badgeTextFilled: { color: colors.primary },
    compactActions: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
    compactIconBtn: { padding: spacing.xs + 2 },
  });
