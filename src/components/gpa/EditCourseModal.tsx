import { useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, Modal, useWindowDimensions, KeyboardAvoidingView, Platform, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../AnimatedView';
import * as Haptics from '../../utils/haptics';
import { ChipButton } from '../common';
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

const CREDIT_OPTIONS = [1, 2, 3, 4, 5, 6];

type Props = {
  visible: boolean;
  course: Course | null;
  courseIndex: number;
  grades: { label: string; points: number }[];
  onUpdate: (id: string, updates: Partial<Course>) => void;
  onClose: () => void;
};

export default function EditCourseModal({ visible, course, courseIndex, grades, onUpdate, onClose }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 768;

  if (!course) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={[s.modalOverlay, isWide && { justifyContent: 'center', alignItems: 'center' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[s.modalKeyboardView, isWide && { justifyContent: 'center', alignItems: 'center' }]}
        >
          <Pressable>
            <AnimatedView
              from={{ opacity: 0, translateY: isWide ? 0 : 40, scale: isWide ? 0.95 : 1 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 160 }}
            >
              <View style={[
                s.modalContent,
                { maxHeight: screenHeight * 0.75 },
                isWide && { borderRadius: 20, maxWidth: Math.min(screenWidth * 0.7, 500), width: Math.min(screenWidth * 0.7, 500) },
              ]}>
                <View style={s.modalHeader}>
                  <RNText style={s.modalTitle}>مادة {courseIndex + 1}</RNText>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} style={s.modalCloseBtn}>
                    <Ionicons name="checkmark" size={22} color={colors.white} />
                  </Pressable>
                </View>

                <TextInput
                  style={s.nameInput}
                  placeholder="اسم المادة (اختياري)"
                  placeholderTextColor={colors.textSecondary}
                  value={course.name}
                  onChangeText={(text) => onUpdate(course.id, { name: text })}
                  textAlign="right"
                />

                <RNText style={s.fieldLabel}>الساعات</RNText>
                <View style={s.chipsRow}>
                  {CREDIT_OPTIONS.map((h) => (
                    <ChipButton
                      key={h}
                      label={String(h)}
                      selected={course.creditHours === h}
                      onPress={() => onUpdate(course.id, { creditHours: h })}
                      minWidth={40}
                    />
                  ))}
                </View>

                <RNText style={s.fieldLabel}>التقدير</RNText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.gradeScrollContent}>
                  {grades.map((g) => (
                    <ChipButton
                      key={g.label}
                      label={g.label}
                      selected={course.grade === g.label}
                      onPress={() => onUpdate(course.id, { grade: g.label })}
                    />
                  ))}
                </ScrollView>

                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}>
                  <View style={s.doneButton}>
                    <RNText style={s.doneButtonText}>تم</RNText>
                  </View>
                </Pressable>
              </View>
            </AnimatedView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalKeyboardView: { justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing['2xl'] },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, textAlign: 'right' },
    modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    nameInput: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, fontFamily: fonts.regular, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, textAlign: 'right' },
    fieldLabel: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'right', marginBottom: spacing.sm },
    chipsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
    gradeScrollContent: { gap: spacing.sm, paddingEnd: spacing.sm },
    doneButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: spacing.md + 2, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
    doneButtonText: { fontSize: 16, fontFamily: fonts.bold, color: colors.white },
  });
