import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText, TextInput } from 'react-native';
import { useThemeColors, type ThemeColors } from '../../theme';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
};

export default function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }: FieldProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={s.fieldWrap}>
      <RNText style={s.fieldLabel}>{label}</RNText>
      <TextInput
        style={[s.fieldInput, multiline && s.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlign="left"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
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
    fieldInput: {
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
    fieldInputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
  });
