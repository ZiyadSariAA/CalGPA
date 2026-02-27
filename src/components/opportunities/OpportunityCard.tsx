import { useState, useMemo } from 'react';
import { StyleSheet, View, Text as RNText, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../AnimatedView';
import * as Haptics from '../../utils/haptics';
import { Pressable } from '../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../theme';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/fonts';
import { shadows } from '../../theme/shadows';
import { type Opportunity } from '../../data/opportunities';

type Props = {
  item: Opportunity;
  index: number;
  onPress: () => void;
  cardWidth: number;
  numColumns: number;
  gridGap: number;
  showLock?: boolean;
};

export default function OpportunityCard({ item, index, onPress, cardWidth, numColumns, gridGap, showLock }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const [pressed, setPressed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const isClosed = item.status === 'closed';
  const firstLetter = item.companyAr.charAt(0);
  const isFirstInRow = index % numColumns === 0;
  const showImage = !!item.logo && !imgFailed;

  return (
    <AnimatedView
      from={Platform.OS === 'web' ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      animate={Platform.OS === 'web' ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 140,
        delay: 50 + Math.min(index * 40, 200),
      }}
      style={{
        width: cardWidth,
        marginStart: isFirstInRow ? 0 : gridGap,
        opacity: isClosed ? 0.55 : 1,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <View
          style={[
            s.card,
            ...(Platform.OS !== 'web' ? [{ transform: [{ scale: pressed ? 0.96 : 1 }] }] : []),
          ]}
        >
          {showImage ? (
            <Image
              source={{ uri: item.logo }}
              style={s.logoImage}
              resizeMode="contain"
              onError={() => setImgFailed(true)}
            />
          ) : item.smartIcon && item.smartIcon !== 'briefcase-outline' ? (
            <View style={[s.logo, { backgroundColor: item.smartIconColor }]}>
              <Ionicons name={item.smartIcon as any} size={22} color={colors.white} />
            </View>
          ) : (
            <View style={[s.logo, { backgroundColor: item.logoColor }]}>
              <RNText style={s.logoLetter}>{firstLetter}</RNText>
            </View>
          )}

          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: isClosed ? colors.error : colors.success }]} />
            <RNText style={[s.statusText, { color: isClosed ? colors.error : colors.success }]}>
              {isClosed ? 'مغلق' : 'مفتوح'}
            </RNText>
          </View>

          {item.type && (
            <View style={[s.typeBadge, { backgroundColor: item.type === 'gdp' ? colors.primary + '20' : colors.secondary + '20' }]}>
              <RNText style={[s.typeBadgeText, { color: item.type === 'gdp' ? colors.primary : colors.secondary }]}>
                {item.type === 'gdp' ? 'تطوير خريجين' : 'تدريب تعاوني'}
              </RNText>
            </View>
          )}

          <RNText style={s.companyName} numberOfLines={2}>
            {item.companyAr}
          </RNText>
          <RNText style={s.programName} numberOfLines={1}>
            {item.program}
          </RNText>
          {showLock && (
            <View style={s.lockBadge}>
              <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
            </View>
          )}
        </View>
      </Pressable>
    </AnimatedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      minHeight: 160,
      backgroundColor: colors.surface,
      ...shadows.sm,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    logoImage: {
      width: 44,
      height: 44,
      borderRadius: 14,
      marginBottom: spacing.sm,
    },
    logoLetter: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.white,
      textAlign: 'center',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginEnd: 4,
    },
    statusText: {
      fontSize: 10,
      fontFamily: fonts.bold,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginBottom: spacing.xs,
    },
    typeBadgeText: {
      fontSize: 10,
      fontFamily: fonts.semibold,
    },
    companyName: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'center',
      writingDirection: 'rtl',
      marginBottom: 2,
    },
    programName: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    lockBadge: {
      position: 'absolute',
      top: 8,
      start: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.text + '14',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
