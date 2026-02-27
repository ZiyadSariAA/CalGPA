import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  TextInput,
  Modal,
  FlatList,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { Pressable } from './ui/pressable';
import { type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';

type Props = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  colors: ThemeColors;
};

export default function DropdownField({
  label,
  value,
  options,
  onSelect,
  placeholder,
  allowCustom,
  colors,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const { height: screenHeight } = useWindowDimensions();
  const s = createStyles(colors, screenHeight);

  const isCustomValue = value !== '' && !options.includes(value);

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomMode(false);
    setCustomText('');
    setVisible(true);
  };

  const selectOption = (opt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(opt);
    setVisible(false);
  };

  const selectCustom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomMode(true);
    setCustomText(isCustomValue ? value : '');
  };

  const confirmCustom = () => {
    const trimmed = customText.trim();
    if (trimmed) {
      onSelect(trimmed);
    }
    setVisible(false);
  };

  const displayValue = value || placeholder || label;
  const hasValue = value !== '';

  return (
    <>
      {/* Trigger row */}
      <View style={s.fieldWrap}>
        <RNText style={s.fieldLabel}>{label}</RNText>
        <Pressable onPress={open}>
          <View style={s.triggerRow}>
            <RNText
              style={[s.triggerText, !hasValue && s.triggerPlaceholder]}
              numberOfLines={1}
            >
              {displayValue}
            </RNText>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </View>
        </Pressable>
      </View>

      {/* Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <Pressable onPress={() => setVisible(false)} style={{ flex: 1 }}>
          <View style={s.overlay} />
        </Pressable>

        <View style={s.sheet}>
          {/* Header */}
          <View style={s.sheetHeader}>
            <RNText style={s.sheetTitle}>{label}</RNText>
            <Pressable onPress={() => setVisible(false)}>
              <View style={s.closeBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </View>
            </Pressable>
          </View>

          {customMode ? (
            /* Custom input mode */
            <View style={s.customWrap}>
              <TextInput
                style={s.customInput}
                value={customText}
                onChangeText={setCustomText}
                placeholder="اكتب هنا..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
                textAlign="left"
              />
              <Pressable onPress={confirmCustom}>
                <View style={s.customConfirmBtn}>
                  <RNText style={s.customConfirmText}>تأكيد</RNText>
                </View>
              </Pressable>
            </View>
          ) : (
            /* Options list */
            <FlatList
              data={allowCustom ? [...options, '__custom__'] : options}
              keyExtractor={(item) => item}
              style={s.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                if (item === '__custom__') {
                  return (
                    <Pressable onPress={selectCustom}>
                      <View style={s.optionRow}>
                        <View style={s.optionTextWrap}>
                          <Ionicons name="create-outline" size={18} color={colors.primary} style={{ marginEnd: 8 }} />
                          <RNText style={[s.optionText, { color: colors.primary }]}>أخرى</RNText>
                        </View>
                        {isCustomValue && (
                          <RNText style={s.customValueHint} numberOfLines={1}>
                            ({value})
                          </RNText>
                        )}
                      </View>
                    </Pressable>
                  );
                }

                const selected = value === item;
                return (
                  <Pressable onPress={() => selectOption(item)}>
                    <View style={[s.optionRow, selected && s.optionRowSelected]}>
                      <RNText style={[s.optionText, selected && s.optionTextSelected]}>
                        {item}
                      </RNText>
                      {selected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors, screenHeight: number) =>
  StyleSheet.create({
    fieldWrap: {
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    triggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    triggerText: {
      flex: 1,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    triggerPlaceholder: {
      color: colors.textSecondary,
    },

    /* Modal */
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    sheet: {
      maxHeight: screenHeight * 0.6,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: spacing['3xl'],
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sheetTitle: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      writingDirection: 'rtl',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingHorizontal: spacing.xl,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    optionRowSelected: {
      backgroundColor: colors.primaryLight,
      borderRadius: 10,
      marginHorizontal: -4,
      paddingHorizontal: 8,
    },
    optionTextWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    optionTextSelected: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    customValueHint: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      maxWidth: 150,
    },

    /* Custom input */
    customWrap: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    customInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    customConfirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    customConfirmText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.white,
      writingDirection: 'rtl',
    },
  });
