import { useMemo } from 'react';
import { StyleSheet, TextInput, Modal, KeyboardAvoidingView, Platform, View, Text as RNText } from 'react-native';
import AnimatedView from '../AnimatedView';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';

type Props = {
  visible: boolean;
  title: string;
  labelValue: string;
  onLabelChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function SaveSemesterModal({ visible, title, labelValue, onLabelChange, onSave, onClose }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={s.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalKeyboardView}>
          <Pressable>
            <AnimatedView
              from={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 160 }}
            >
              <View style={s.modalContent}>
                <RNText style={s.modalTitle}>{title}</RNText>
                <TextInput
                  style={s.nameInput}
                  placeholder="مثال: الفصل الأول 2025"
                  placeholderTextColor={colors.textSecondary}
                  value={labelValue}
                  onChangeText={onLabelChange}
                  textAlign="right"
                  autoFocus
                />
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSave(); }}>
                  <View style={s.doneButton}>
                    <RNText style={s.doneButtonText}>حفظ</RNText>
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
    modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, textAlign: 'right', marginBottom: spacing.lg },
    nameInput: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, fontFamily: fonts.regular, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, textAlign: 'right' },
    doneButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: spacing.md + 2, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
    doneButtonText: { fontSize: 16, fontFamily: fonts.bold, color: colors.white },
  });
