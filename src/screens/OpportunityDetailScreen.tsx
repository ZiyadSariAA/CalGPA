import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Linking, View, Image, ActivityIndicator, Share, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView as OriginalMotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';

const MotiView = Platform.OS === 'web' ? View : OriginalMotiView;
import { Text } from '../components/ui/text';
import { HStack } from '../components/ui/hstack';
import { VStack } from '../components/ui/vstack';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { fonts } from '../theme/fonts';
import { useOpportunities } from '../hooks/useOpportunities';
import { useAppConfig } from '../context/AppConfigContext';

/* ─── Info Section Card ─── */

function InfoSection({
  icon,
  title,
  children,
  delay = 0,
  colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  delay?: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay }}
    >
      <View style={styles.section}>
        <HStack style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name={icon} size={18} color={colors.primary} />
          </View>
          <Text bold style={styles.sectionTitle}>{title}</Text>
        </HStack>
        {children}
      </View>
    </MotiView>
  );
}

/* ─── Main Screen ─── */

export default function OpportunityDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [ctaPressed, setCtaPressed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { opportunities, loading } = useOpportunities();
  const { config: appConfig } = useAppConfig();

  const item = opportunities.find((o) => o.id === route.params?.id);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!item) return null;

  const isClosed = item.status === 'closed';
  const showImage = !!item.logo && !imgFailed;

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(item.link).catch(() => {});
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dates = item.dates
      ? `${item.dates.start} - ${item.dates.end}`
      : item.nextOpening
        ? `الافتتاح القادم: ${item.nextOpening}`
        : '';
    const datesLine = dates ? `📅 المواعيد: ${dates}\n` : '';

    const appLinks = [
      appConfig.rateIosLink ? `App Store: ${appConfig.rateIosLink}` : '',
      appConfig.rateAndroidLink ? `Google Play: ${appConfig.rateAndroidLink}` : '',
    ].filter(Boolean).join('\n');

    // Format majors as bullet points, 2 per line
    const majorsFormatted = item.majors
      .map((m: string) => `• ${m}`)
      .reduce((lines: string[], bullet: string, i: number) => {
        if (i % 2 === 0) {
          lines.push(bullet);
        } else {
          lines[lines.length - 1] += `  ${bullet}`;
        }
        return lines;
      }, [] as string[])
      .join('\n');

    const message = `🎯 فرصة: ${item.companyAr}
📋 البرنامج: ${item.program}

🎓 التخصصات:
${majorsFormatted}

${datesLine}🔗 رابط التقديم: ${item.link}

حمّل تطبيق CalGPA 👇
${appLinks}`.trim();

    try {
      await Share.share({ message, title: item.companyAr });
    } catch {}
  };

  const datesText = item.dates
    ? `${item.dates.start} - ${item.dates.end}`
    : item.nextOpening
      ? `الافتتاح القادم: ${item.nextOpening}`
      : 'غير محدد';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ─── Top bar ─── */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <View style={styles.backButton}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </View>
        </Pressable>
        <Text bold style={styles.topBarTitle}>تفاصيل الفرصة</Text>
        <Pressable onPress={handleShare}>
          <View style={styles.backButton}>
            <Ionicons name="share-social-outline" size={22} color={colors.text} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Hero card ─── */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        >
          <View style={styles.heroCard}>
            {/* Logo */}
            {showImage ? (
              <Image
                source={{ uri: item.logo }}
                style={styles.heroLogoImage}
                resizeMode="contain"
                onError={() => setImgFailed(true)}
              />
            ) : item.smartIcon && item.smartIcon !== 'briefcase-outline' ? (
              <View style={[styles.heroLogo, { backgroundColor: item.smartIconColor }]}>
                <Ionicons name={item.smartIcon as any} size={32} color="#FFFFFF" />
              </View>
            ) : (
              <View style={[styles.heroLogo, { backgroundColor: item.logoColor }]}>
                <Text bold style={styles.heroLogoLetter}>{item.companyAr.charAt(0)}</Text>
              </View>
            )}

            {/* Status & type pills */}
            <HStack style={{ gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm }}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isClosed
                      ? colors.error + '1A'
                      : colors.success + '1A',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isClosed ? colors.error : colors.success },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isClosed ? colors.error : colors.success },
                  ]}
                >
                  {isClosed ? 'مغلق' : 'مفتوح'}
                </Text>
              </View>

              {item.type && (
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: item.type === 'gdp' ? '#2D5A3D1A' : '#1D4ED81A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.type === 'gdp' ? '#2D5A3D' : '#1D4ED8' },
                    ]}
                  >
                    {item.type === 'gdp' ? 'تطوير خريجين' : 'تدريب تعاوني'}
                  </Text>
                </View>
              )}
            </HStack>

            {/* Company name Arabic */}
            <Text bold style={styles.heroCompanyAr}>{item.companyAr}</Text>

            {/* Program name */}
            <Text style={styles.heroProgram}>{item.program}</Text>

            {/* Company name English */}
            <Text style={styles.heroCompanyEn}>{item.company}</Text>
          </View>
        </MotiView>

        {/* ─── Info Sections ─── */}
        <VStack style={{ gap: spacing.md, marginTop: spacing.md }}>
          {/* Link */}
          <InfoSection icon="link" title="رابط التقديم" delay={100} colors={colors} styles={styles}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(item.link);
              }}
            >
              <Text style={styles.linkText}>{item.link}</Text>
            </Pressable>
          </InfoSection>

          {/* Dates */}
          <InfoSection icon="calendar" title="مواعيد التقديم" delay={200} colors={colors} styles={styles}>
            <Text style={styles.infoText}>{datesText}</Text>
          </InfoSection>

          {/* Majors */}
          <InfoSection icon="school" title="التخصصات المطلوبة" delay={300} colors={colors} styles={styles}>
            <View style={styles.majorsWrap}>
              {item.majors.map((major, i) => (
                <MotiView
                  key={major}
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 18,
                    stiffness: 160,
                    delay: 350 + i * 60,
                  }}
                >
                  <View style={styles.majorChip}>
                    <Text style={styles.majorText}>{major}</Text>
                  </View>
                </MotiView>
              ))}
            </View>
          </InfoSection>

          {/* Next opening (only for closed) */}
          {isClosed && item.nextOpening && (
            <InfoSection icon="time" title="الافتتاح القادم" delay={400} colors={colors} styles={styles}>
              <Text style={styles.infoText}>{item.nextOpening}</Text>
            </InfoSection>
          )}
        </VStack>
      </ScrollView>

      {/* ─── CTA Button ─── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 400 }}
        style={[styles.ctaContainer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <Pressable
          onPress={handleApply}
          onPressIn={() => setCtaPressed(true)}
          onPressOut={() => setCtaPressed(false)}
        >
          <View
            style={[
              styles.ctaButton,
              isClosed && { backgroundColor: colors.textSecondary },
              ...(Platform.OS !== 'web' ? [{ transform: [{ scale: ctaPressed ? 0.97 : 1 }] }] : []),
            ]}
          >
            <Text bold style={{ fontSize: 18, color: '#FFFFFF' }}>
              {isClosed ? 'زيارة الموقع' : 'قدم الآن'}
            </Text>
          </View>
        </Pressable>
      </MotiView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    /* Top bar */
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBarTitle: {
      fontSize: 17,
      color: colors.text,
      textAlign: 'right',
    },

    /* Scroll */
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 100,
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    },

    /* Hero card */
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: spacing['2xl'],
      alignItems: 'center',
      ...shadows.md,
    },
    heroLogo: {
      width: 80,
      height: 80,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroLogoImage: {
      width: 80,
      height: 80,
      borderRadius: 20,
    },
    heroLogoLetter: {
      fontSize: 32,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: 20,
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontFamily: fonts.bold,
      letterSpacing: 0.5,
    },
    heroCompanyAr: {
      fontSize: 24,
      color: colors.text,
      textAlign: 'center',
    },
    heroProgram: {
      fontSize: 18,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    heroCompanyEn: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
      opacity: 0.7,
    },

    /* Sections */
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.sm,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    sectionIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: 10,
    },
    sectionTitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'right',
    },
    linkText: {
      fontSize: 14,
      color: colors.secondary,
      textDecorationLine: 'underline',
      textAlign: 'right',
    },
    infoText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      textAlign: 'right',
    },

    /* Majors */
    majorsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    majorChip: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: spacing.sm,
      borderRadius: 10,
    },
    majorText: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: fonts.semibold,
    },

    /* CTA */
    ctaContainer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    },
    ctaButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
  });
