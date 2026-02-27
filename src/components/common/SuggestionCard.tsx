import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../AnimatedView';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';
import { shadows } from '../../theme/shadows';

type SuggestionCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  index: number;
};

export default function SuggestionCard({ title, icon, children, index }: SuggestionCardProps) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <AnimatedView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: index * 100 }}
    >
      <View style={s.suggestionCard}>
        <View style={s.suggestionHeader}>
          <View style={s.suggestionIconWrap}>
            <Ionicons name={icon} size={18} color={colors.primary} />
          </View>
          <RNText style={s.suggestionTitle}>{title}</RNText>
        </View>
        {children}
      </View>
    </AnimatedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    suggestionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    suggestionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    suggestionTitle: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.text,
      writingDirection: 'rtl',
    },
  });
