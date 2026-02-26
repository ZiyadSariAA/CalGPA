import { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Text as RNText, Image, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { useAppConfig } from '../context/AppConfigContext';
import { useNotificationsContext } from '../context/NotificationsContext';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';


export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { config } = useAppConfig();
  const { unreadCount } = useNotificationsContext();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenLayout>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Notification Bell ─── */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 160, delay: 200 }}
          style={styles.bellWrap}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Notifications');
            }}
            style={styles.bellButton}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <RNText style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </RNText>
              </View>
            )}
          </Pressable>
        </MotiView>

        {/* ─── Maintenance Banner ─── */}
        {config.maintenanceMode && (
          <MotiView
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140 }}
            style={styles.maintenanceBanner}
          >
            <Ionicons name="construct-outline" size={18} color="#FFFFFF" style={{ marginEnd: 10 }} />
            <RNText style={styles.maintenanceText}>
              {config.maintenanceMessage || 'التطبيق تحت الصيانة حالياً'}
            </RNText>
          </MotiView>
        )}

        {/* ─── Promo Banner ─── */}
        {config.bannerEnabled && (
          <MotiView
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 100 }}
          >
            <Pressable
              onPress={() => { if (config.bannerLink) Linking.openURL(config.bannerLink); }}
              disabled={!config.bannerLink}
            >
              {config.bannerType === 'image' && config.bannerImageUrl ? (
                <Image
                  source={{ uri: config.bannerImageUrl }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.bannerText,
                    {
                      backgroundColor: config.bannerBgColor || colors.primary,
                    },
                  ]}
                >
                  <Ionicons name="megaphone-outline" size={18} color={config.bannerTextColor || '#FFFFFF'} style={{ marginEnd: 10 }} />
                  <RNText
                    style={[
                      styles.bannerTextLabel,
                      { color: config.bannerTextColor || '#FFFFFF' },
                    ]}
                    numberOfLines={2}
                  >
                    {config.bannerText}
                  </RNText>
                  {!!config.bannerLink && (
                    <Ionicons name="chevron-back" size={16} color={config.bannerTextColor || '#FFFFFF'} style={{ opacity: 0.5 }} />
                  )}
                </View>
              )}
            </Pressable>
          </MotiView>
        )}

        {/* ─── Top section ─── */}
        <View style={styles.topSection}>
          <MotiView
            from={{ opacity: 0, translateY: -16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 50 }}
          >
            <RNText style={styles.greeting}>مرحباً 👋</RNText>
          </MotiView>
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 150 }}
          >
            <RNText style={styles.title}>أحسب معدلي</RNText>
          </MotiView>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
          >
            <RNText style={styles.subtitle}>اختر نوع المعدل لحسابه</RNText>
          </MotiView>
        </View>

        {/* ─── Cards ─── */}
        <View style={styles.cardsSection}>
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 250 }}
          >
            <OptionCard
              icon="calculator-outline"
              title="معدل فصلي"
              description="حساب معدل الفصل الحالي"
              colors={colors}
              styles={styles}
              variant="surface"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('GPACalculator', { type: 'semester' });
              }}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 400 }}
          >
            <OptionCard
              icon="stats-chart-outline"
              title="معدل تراكمي"
              description="حساب المعدل التراكمي مع الفصول السابقة"
              colors={colors}
              styles={styles}
              variant="primary"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('GPACalculator', { type: 'cumulative' });
              }}
            />
          </MotiView>

        </View>

        {/* ─── Tools Section ─── */}
        <View style={styles.toolsSection}>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
          >
            <RNText style={styles.toolsLabel}>أدوات أخرى</RNText>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 550 }}
          >
            <OptionCard
              icon={config.cvEnabled ? 'document-text-outline' : 'lock-closed-outline'}
              title="إنشاء سيرة ذاتية"
              description={config.cvEnabled
                ? 'أنشئ سيرتك الذاتية واحصل عليها كـ PDF'
                : 'هذه الميزة غير متاحة حالياً'
              }
              colors={colors}
              styles={styles}
              variant="surface"
              beta={config.cvEnabled}
              disabled={!config.cvEnabled}
              onPress={() => {
                if (!config.cvEnabled) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  Alert.alert(
                    'الميزة غير متاحة',
                    'هذه الميزة غير متاحة حالياً لفترة محدودة. تواصل معنا للمزيد من المعلومات.',
                    [
                      { text: 'تواصل معنا', onPress: () => navigation.navigate('Contact') },
                      { text: 'حسناً', style: 'cancel' },
                    ],
                  );
                  return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('CVList');
              }}
            />
          </MotiView>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

/* ─── Option Card ─── */
function OptionCard({
  icon,
  title,
  description,
  colors,
  styles,
  variant,
  onPress,
  beta,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  variant: 'surface' | 'primary';
  onPress: () => void;
  beta?: boolean;
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <MotiView
        animate={{ scale: pressed ? 0.97 : 1 }}
        transition={{ type: 'timing', duration: 120 }}
      >
        <View
          style={[
            styles.card,
            isPrimary ? styles.cardPrimary : styles.cardSurface,
            disabled && styles.cardDisabled,
          ]}
        >
          <View style={styles.cardInner}>
            {/* Icon */}
            <View
              style={[
                styles.iconCircle,
                isPrimary ? styles.iconCirclePrimary : styles.iconCircleSurface,
                disabled && styles.iconCircleDisabled,
              ]}
            >
              <Ionicons
                name={icon}
                size={26}
                color={disabled ? colors.textSecondary : isPrimary ? '#FFFFFF' : colors.primary}
              />
            </View>

            {/* Text */}
            <View style={styles.cardTextWrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RNText
                  style={[
                    styles.cardTitle,
                    isPrimary && styles.cardTitlePrimary,
                    disabled && { color: colors.textSecondary },
                    { marginBottom: 0 },
                  ]}
                >
                  {title}
                </RNText>
                {beta && (
                  <View style={styles.betaBadge}>
                    <RNText style={styles.betaText}>Beta</RNText>
                  </View>
                )}
                {disabled && (
                  <View style={styles.disabledBadge}>
                    <RNText style={styles.disabledBadgeText}>غير متاح</RNText>
                  </View>
                )}
              </View>
              <RNText
                style={[
                  styles.cardDesc,
                  isPrimary && styles.cardDescPrimary,
                  disabled && { color: colors.textSecondary, opacity: 0.7 },
                ]}
              >
                {description}
              </RNText>
            </View>

            {/* Arrow / Lock */}
            <Ionicons
              name={disabled ? 'lock-closed' : 'chevron-back'}
              size={disabled ? 18 : 20}
              color={disabled ? colors.textSecondary : isPrimary ? 'rgba(255,255,255,0.5)' : colors.textSecondary}
            />
          </View>
        </View>
      </MotiView>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },

    bellWrap: {
      alignItems: 'flex-end',
      marginTop: 16,
    },
    bellButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      textAlign: 'center',
    },

    /* Maintenance */
    maintenanceBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryDark,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 16,
      ...shadows.sm,
    },
    maintenanceText: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: '#FFFFFF',
      textAlign: 'left',
      writingDirection: 'rtl',
    },

    /* Banner */
    bannerImage: {
      width: '100%',
      height: 100,
      borderRadius: 12,
      marginTop: 16,
    },
    bannerText: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 16,
      ...shadows.sm,
    },
    bannerTextLabel: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.semibold,
      textAlign: 'left',
      writingDirection: 'rtl',
    },

    /* Top */
    topSection: {
      paddingTop: 40,
      paddingBottom: 12,
    },
    greeting: {
      fontSize: 17,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
      marginBottom: 8,
    },
    title: {
      fontSize: 34,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'rtl',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
    },

    /* Cards */
    cardsSection: {
      marginTop: 36,
      gap: 16,
    },

    /* Tools */
    toolsSection: {
      marginTop: 32,
      gap: 12,
    },
    toolsLabel: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
    },

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
      color: '#FFFFFF',
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
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },

    /* Disabled card */
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
