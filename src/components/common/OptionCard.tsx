import { useMemo, useState } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../AnimatedView';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { fonts } from '../../theme/fonts';
import { shadows } from '../../theme/shadows';

type OptionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  variant: 'surface' | 'primary';
  onPress: () => void;
  beta?: boolean;
  disabled?: boolean;
};

export default function OptionCard({ icon, title, description, variant, onPress, beta, disabled }: OptionCardProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const [pressed, setPressed] = useState(false);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <AnimatedView
        animate={{ scale: pressed ? 0.97 : 1 }}
        transition={{ type: 'timing', duration: 120 }}
      >
        <View
          style={[
            s.card,
            isPrimary ? s.cardPrimary : s.cardSurface,
            disabled && s.cardDisabled,
          ]}
        >
          <View style={s.cardInner}>
            <View
              style={[
                s.iconCircle,
                isPrimary ? s.iconCirclePrimary : s.iconCircleSurface,
                disabled && s.iconCircleDisabled,
              ]}
            >
              <Ionicons
                name={icon}
                size={26}
                color={disabled ? colors.textSecondary : isPrimary ? colors.white : colors.primary}
              />
            </View>

            <View style={s.cardTextWrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RNText
                  style={[
                    s.cardTitle,
                    isPrimary && s.cardTitlePrimary,
                    disabled && { color: colors.textSecondary },
                    { marginBottom: 0 },
                  ]}
                >
                  {title}
                </RNText>
                {beta && (
                  <View style={s.betaBadge}>
                    <RNText style={s.betaText}>Beta</RNText>
                  </View>
                )}
                {disabled && (
                  <View style={s.disabledBadge}>
                    <RNText style={s.disabledBadgeText}>غير متاح</RNText>
                  </View>
                )}
              </View>
              <RNText
                style={[
                  s.cardDesc,
                  isPrimary && s.cardDescPrimary,
                  disabled && { color: colors.textSecondary, opacity: 0.7 },
                ]}
              >
                {description}
              </RNText>
            </View>

            <Ionicons
              name={disabled ? 'lock-closed' : 'chevron-back'}
              size={disabled ? 18 : 20}
              color={disabled ? colors.textSecondary : isPrimary ? 'rgba(255,255,255,0.5)' : colors.textSecondary}
            />
          </View>
        </View>
      </AnimatedView>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 20,
      padding: 22,
    },
    cardSurface: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    cardPrimary: {
      backgroundColor: colors.primary,
      ...shadows.md,
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: 16,
    },
    iconCircleSurface: {
      backgroundColor: colors.primaryLight,
    },
    iconCirclePrimary: {
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    cardTextWrap: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'rtl',
      marginBottom: 3,
    },
    cardTitlePrimary: {
      color: colors.white,
    },
    cardDesc: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
      lineHeight: 19,
    },
    cardDescPrimary: {
      color: 'rgba(255,255,255,0.65)',
    },
    betaBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginStart: 8,
    },
    betaText: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: colors.white,
      letterSpacing: 0.5,
    },
    cardDisabled: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderStyle: 'dashed' as const,
      opacity: 0.65,
    },
    iconCircleDisabled: {
      backgroundColor: colors.border,
    },
    disabledBadge: {
      backgroundColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginStart: 8,
    },
    disabledBadgeText: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
  });
