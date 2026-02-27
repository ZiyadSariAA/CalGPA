import { useState, useMemo } from 'react';
import { StyleSheet, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, View, Text as RNText } from 'react-native';
import AnimatedView from '../AnimatedView';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';
import { useSettings } from '../../context/SettingsContext';
import type { SavedSemester } from '../../context/SemesterContext';

type Props = {
  semester: SavedSemester;
  onSave: (updates: { label: string; gpa: number; creditHours: number }) => void;
  onClose: () => void;
};

export default function EditSemesterModal({ semester, onSave, onClose }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { gpaScale } = useSettings();
  const [label, setLabel] = useState(semester.label);
  const [gpaText, setGpaText] = useState(String(semester.gpa));
  const [hoursText, setHoursText] = useState(String(semester.creditHours));

  const maxGpa = gpaScale === '4' ? 4 : 5;

  const handleSave = () => {
    const gpa = parseFloat(gpaText);
    const creditHours = parseInt(hoursText, 10);
    if (isNaN(gpa) || gpa < 0 || gpa > maxGpa) {
      Alert.alert('خطأ', `المعدل يجب أن يكون بين 0 و ${maxGpa}`);
      return;
    }
    if (isNaN(creditHours) || creditHours < 1) {
      Alert.alert('خطأ', 'عدد الساعات يجب أن يكون 1 على الأقل');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({ label: label.trim() || semester.label, gpa, creditHours });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={s.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalKeyboardView}>
          <Pressable>
            <AnimatedView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 160 }}>
              <View style={s.modalContent}>
                <RNText style={s.modalTitle}>تعديل الفصل</RNText>
                <RNText style={s.modalFieldLabel}>اسم الفصل</RNText>
                <TextInput style={s.modalInput} placeholder="اسم الفصل" placeholderTextColor={colors.textSecondary} value={label} onChangeText={setLabel} textAlign="right" autoFocus />
                <RNText style={s.modalFieldLabel}>المعدل (0 - {maxGpa})</RNText>
                <TextInput style={s.modalInput} placeholder={`0 - ${maxGpa}`} placeholderTextColor={colors.textSecondary} value={gpaText} onChangeText={setGpaText} textAlign="right" keyboardType="decimal-pad" />
                <RNText style={s.modalFieldLabel}>عدد الساعات</RNText>
                <TextInput style={s.modalInput} placeholder="عدد الساعات" placeholderTextColor={colors.textSecondary} value={hoursText} onChangeText={setHoursText} textAlign="right" keyboardType="number-pad" />
                <View style={s.modalActions}>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} style={s.modalCancelBtn}>
                    <RNText style={[s.modalBtnText, { color: colors.textSecondary }]}>إلغاء</RNText>
                  </Pressable>
                  <Pressable onPress={handleSave} style={[s.modalSaveBtn, { backgroundColor: colors.primary }]}>
                    <RNText style={[s.modalBtnText, { color: colors.white }]}>حفظ</RNText>
                  </Pressable>
                </View>
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
    modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, textAlign: 'right', marginBottom: spacing.lg },
    modalFieldLabel: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.xs },
    modalInput: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, fontFamily: fonts.regular, color: colors.text, borderWidth: 1, borderColor: colors.border, textAlign: 'right', marginBottom: spacing.lg },
    modalActions: { flexDirection: 'row', gap: spacing.md },
    modalCancelBtn: { flex: 1, paddingVertical: spacing.md + 2, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center' },
    modalSaveBtn: { flex: 1, paddingVertical: spacing.md + 2, borderRadius: 14, alignItems: 'center' },
    modalBtnText: { fontSize: 15, fontFamily: fonts.bold },
  });
