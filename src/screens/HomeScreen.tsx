import { useMemo } from 'react';
import { StyleSheet, View, ScrollView, Text as RNText, Image, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import { Pressable } from '../components/ui/pressable';
import { OptionCard } from '../components/common';
import { useThemeColors, type ThemeColors } from '../theme';
import { useAppConfig } from '../context/AppConfigContext';
import { useNotificationsContext } from '../context/NotificationsContext';
import { fonts } from '../theme/fonts';
import { spacing } from '../theme/spacing';
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
        <AnimatedView
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
        </AnimatedView>

        {/* ─── Maintenance Banner ─── */}
        {config.maintenanceMode && (
          <AnimatedView
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140 }}
            style={styles.maintenanceBanner}
          >
            <Ionicons name="construct-outline" size={18} color={colors.white} style={{ marginEnd: 10 }} />
            <RNText style={styles.maintenanceText}>
              {config.maintenanceMessage || 'التطبيق تحت الصيانة حالياً'}
            </RNText>
          </AnimatedView>
        )}

        {/* ─── Promo Banner ─── */}
        {config.bannerEnabled && (
          <AnimatedView
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 100 }}
          >
            <Pressable
              onPress={() => { if (config.bannerLink) Linking.openURL(config.bannerLink); }}
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
                    { backgroundColor: config.bannerBgColor || colors.primary },
                  ]}
                >
                  <Ionicons name="megaphone-outline" size={18} color={config.bannerTextColor || colors.white} style={{ marginEnd: 10 }} />
                  <RNText
                    style={[
                      styles.bannerTextLabel,
                      { color: config.bannerTextColor || colors.white },
                    ]}
                    numberOfLines={2}
                  >
                    {config.bannerText}
                  </RNText>
                  {!!config.bannerLink && (
                    <Ionicons name="chevron-back" size={16} color={config.bannerTextColor || colors.white} style={{ opacity: 0.5 }} />
                  )}
                </View>
              )}
            </Pressable>
          </AnimatedView>
        )}

        {/* ─── Top section ─── */}
        <View style={styles.topSection}>
          <AnimatedView
            from={{ opacity: 0, translateY: -16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 50 }}
          >
            <RNText style={styles.greeting}>مرحباً 👋</RNText>
          </AnimatedView>
          <AnimatedView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 150 }}
          >
            <RNText style={styles.title}>أحسب معدلي</RNText>
          </AnimatedView>
          <AnimatedView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
          >
            <RNText style={styles.subtitle}>اختر نوع المعدل لحسابه</RNText>
          </AnimatedView>
        </View>

        {/* ─── Cards ─── */}
        <View style={styles.cardsSection}>
          <AnimatedView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 250 }}
          >
            <OptionCard
              icon="calculator-outline"
              title="معدل فصلي"
              description="حساب معدل الفصل الحالي"
              variant="surface"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('GPACalculator', { type: 'semester' });
              }}
            />
          </AnimatedView>

          <AnimatedView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 400 }}
          >
            <OptionCard
              icon="stats-chart-outline"
              title="معدل تراكمي"
              description="حساب المعدل التراكمي مع الفصول السابقة"
              variant="primary"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('GPACalculator', { type: 'cumulative' });
              }}
            />
          </AnimatedView>
        </View>

        {/* ─── Tools Section ─── */}
        <View style={styles.toolsSection}>
          <AnimatedView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
          >
            <RNText style={styles.toolsLabel}>أدوات أخرى</RNText>
          </AnimatedView>

          <AnimatedView
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
          </AnimatedView>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing['2xl'],
      paddingBottom: spacing['4xl'],
    },

    bellWrap: {
      alignItems: 'flex-end',
      marginTop: spacing.lg,
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
      end: -4,
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
      color: colors.white,
      textAlign: 'center',
    },

    maintenanceBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryDark,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      marginTop: spacing.lg,
      ...shadows.sm,
    },
    maintenanceText: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.white,
      textAlign: 'left',
      writingDirection: 'rtl',
    },

    bannerImage: {
      width: '100%',
      height: 100,
      borderRadius: 12,
      marginTop: spacing.lg,
    },
    bannerText: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      marginTop: spacing.lg,
      ...shadows.sm,
    },
    bannerTextLabel: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.semibold,
      textAlign: 'left',
      writingDirection: 'rtl',
    },

    topSection: {
      paddingTop: spacing['4xl'],
      paddingBottom: spacing.md,
    },
    greeting: {
      fontSize: 17,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 34,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'rtl',
      marginBottom: spacing.xs + 2,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
    },

    cardsSection: {
      marginTop: spacing['3xl'] + spacing.xs,
      gap: spacing.lg,
    },

    toolsSection: {
      marginTop: spacing['3xl'],
      gap: spacing.md,
    },
    toolsLabel: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
  });
