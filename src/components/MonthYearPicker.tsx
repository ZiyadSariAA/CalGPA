import { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { Pressable } from './ui/pressable';
import { type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';

const MONTHS = [
  { en: 'Jan', ar: 'يناير' },
  { en: 'Feb', ar: 'فبراير' },
  { en: 'Mar', ar: 'مارس' },
  { en: 'Apr', ar: 'أبريل' },
  { en: 'May', ar: 'مايو' },
  { en: 'Jun', ar: 'يونيو' },
  { en: 'Jul', ar: 'يوليو' },
  { en: 'Aug', ar: 'أغسطس' },
  { en: 'Sep', ar: 'سبتمبر' },
  { en: 'Oct', ar: 'أكتوبر' },
  { en: 'Nov', ar: 'نوفمبر' },
  { en: 'Dec', ar: 'ديسمبر' },
] as const;

const YEARS = Array.from({ length: 21 }, (_, i) => 2030 - i); // 2030 → 2010

const PRESENT_VALUE = 'Present';

type Props = {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  colors: ThemeColors;
  allowPresent?: boolean;
};

/** Parse "Jan 2024" back to month index + year */
function parseValue(value: string): { monthIdx: number; year: number } | null {
  if (!value || value === PRESENT_VALUE) return null;
  const parts = value.split(' ');
  if (parts.length !== 2) return null;
  const monthIdx = MONTHS.findIndex((m) => m.en === parts[0]);
  const year = parseInt(parts[1], 10);
  if (monthIdx === -1 || isNaN(year)) return null;
  return { monthIdx, year };
}

export default function MonthYearPicker({
  label,
  value,
  onSelect,
  colors,
  allowPresent,
}: Props) {
  const [visible, setVisible] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const parsed = parseValue(value);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(parsed?.monthIdx ?? null);
  const [selectedYear, setSelectedYear] = useState<number | null>(parsed?.year ?? null);

  const s = useMemo(() => createStyles(colors, screenHeight), [colors, screenHeight]);

  const isPresent = value === PRESENT_VALUE;
  const hasValue = value !== '';
  const displayValue = isPresent ? 'حتى الآن' : value || label;

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const p = parseValue(value);
    setSelectedMonth(p?.monthIdx ?? null);
    setSelectedYear(p?.year ?? null);
    setVisible(true);
  };

  const confirm = () => {
    if (selectedMonth !== null && selectedYear !== null) {
      const formatted = `${MONTHS[selectedMonth].en} ${selectedYear}`;
      onSelect(formatted);
    }
    setVisible(false);
  };

  const selectPresent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(PRESENT_VALUE);
    setVisible(false);
  };

  const togglePresent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPresent) {
      onSelect('');
    } else {
      onSelect(PRESENT_VALUE);
    }
  };

  return (
    <>
      <View style={s.fieldWrap}>
        <RNText style={s.fieldLabel}>{label}</RNText>

        {/* Present checkbox (only for endDate) */}
        {allowPresent && (
          <Pressable onPress={togglePresent}>
            <View style={s.presentRow}>
              <View style={[s.checkbox, isPresent && s.checkboxChecked]}>
                {isPresent && <Ionicons name="checkmark" size={12} color={colors.white} />}
              </View>
              <RNText style={s.presentText}>حتى الآن</RNText>
            </View>
          </Pressable>
        )}

        {/* Trigger button */}
        <Pressable onPress={isPresent ? undefined : open} disabled={isPresent}>
          <View style={[s.triggerRow, isPresent && s.triggerDisabled]}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={isPresent ? colors.textSecondary : colors.primary}
            />
            <RNText
              style={[s.triggerText, !hasValue && s.triggerPlaceholder, isPresent && s.triggerPresentText]}
              numberOfLines={1}
            >
              {displayValue}
            </RNText>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </Pressable>
      </View>

      {/* Picker Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable onPress={() => setVisible(false)}>
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

          {/* Present option inside modal */}
          {allowPresent && (
            <Pressable onPress={selectPresent}>
              <View style={s.presentOption}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <RNText style={s.presentOptionText}>حتى الآن (Present)</RNText>
              </View>
            </Pressable>
          )}

          {/* Month selector */}
          <RNText style={s.pickerLabel}>الشهر</RNText>
          <View style={s.monthGrid}>
            {MONTHS.map((month, idx) => {
              const active = selectedMonth === idx;
              return (
                <Pressable
                  key={month.en}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMonth(idx);
                  }}
                >
                  <View style={[s.monthChip, active && s.monthChipActive]}>
                    <RNText style={[s.monthChipTextEn, active && s.chipTextActive]}>
                      {month.en}
                    </RNText>
                    <RNText style={[s.monthChipTextAr, active && s.chipTextActive]}>
                      {month.ar}
                    </RNText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Year selector */}
          <RNText style={s.pickerLabel}>السنة</RNText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.yearScrollContent}
            style={s.yearScroll}
          >
            {YEARS.map((year) => {
              const active = selectedYear === year;
              return (
                <Pressable
                  key={year}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedYear(year);
                  }}
                >
                  <View style={[s.yearChip, active && s.yearChipActive]}>
                    <RNText style={[s.yearChipText, active && s.chipTextActive]}>
                      {year}
                    </RNText>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Confirm */}
          <View style={s.confirmWrap}>
            <Pressable onPress={confirm}>
              <View style={[s.confirmBtn, (selectedMonth === null || selectedYear === null) && s.confirmBtnDisabled]}>
                <RNText style={s.confirmText}>تأكيد</RNText>
              </View>
            </Pressable>
          </View>
        </View>
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

    /* Present checkbox */
    presentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presentText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.text,
      writingDirection: 'rtl',
    },

    /* Trigger */
    triggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    triggerDisabled: {
      opacity: 0.5,
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
    triggerPresentText: {
      color: colors.primary,
      fontFamily: fonts.semibold,
    },

    /* Modal */
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: screenHeight * 0.7,
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

    /* Present option in modal */
    presentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      marginHorizontal: spacing.xl,
      marginTop: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    presentOptionText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.primary,
    },

    /* Picker labels */
    pickerLabel: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xl,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* Month grid */
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
      gap: 8,
      justifyContent: 'center',
    },
    monthChip: {
      width: 76,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    monthChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    monthChipTextEn: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    monthChipTextAr: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    chipTextActive: {
      color: colors.white,
    },

    /* Year scroll */
    yearScroll: {
      maxHeight: 50,
    },
    yearScrollContent: {
      paddingHorizontal: spacing.xl,
      gap: 8,
      alignItems: 'center',
    },
    yearChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    yearChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    yearChipText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
    },

    /* Confirm */
    confirmWrap: {
      paddingHorizontal: spacing.xl,
      marginTop: spacing.xl,
    },
    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    confirmBtnDisabled: {
      opacity: 0.4,
    },
    confirmText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.white,
      writingDirection: 'rtl',
    },
  });
