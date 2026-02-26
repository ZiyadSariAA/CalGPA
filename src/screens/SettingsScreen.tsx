import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Linking, Platform, View, Text as RNText, Share } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors, spacing } from '../theme';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { useAppConfig } from '../context/AppConfigContext';
import { useSubscription } from '../context/SubscriptionContext';


/* ─── Segment Control ─── */

function SegmentOption({
  opt,
  active,
  onSelect,
  colors,
}: {
  opt: { value: string; label: string };
  active: boolean;
  onSelect: (value: string) => void;
  colors: ThemeColors;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(opt.value);
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <MotiView
        animate={{ scale: pressed ? 0.97 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
        style={[
          segStyles.item,
          {
            backgroundColor: active ? colors.primaryLight : colors.background,
          },
        ]}
      >
        <RNText
          style={[
            segStyles.label,
            {
              color: active ? colors.primary : colors.textSecondary,
              fontFamily: active ? fonts.semibold : fonts.regular,
            },
          ]}
        >
          {opt.label}
        </RNText>
      </MotiView>
    </Pressable>
  );
}

function SegmentControl({
  options,
  selected,
  onSelect,
  colors,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={[segStyles.track, { backgroundColor: colors.background }]}>
      {options.map((opt) => (
        <SegmentOption
          key={opt.value}
          opt={opt}
          active={opt.value === selected}
          onSelect={onSelect}
          colors={colors}
        />
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  item: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
  },
});

/* ─── Link Row ─── */

type DynStyles = ReturnType<typeof createDynStyles>;

function LinkRow({
  icon,
  label,
  onPress,
  last = false,
  colors,
  s,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
  colors: ThemeColors;
  s: DynStyles;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <MotiView
        animate={{ scale: pressed ? 0.97 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
      >
        <View
          style={[
            s.linkRow,
            { flexDirection: 'row' },
            !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
          ]}
        >
          <Ionicons name={icon} size={20} color={colors.primary} style={{ marginEnd: 14 }} />
          <RNText style={s.linkLabel}>{label}</RNText>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-back" size={16} color={colors.border} />
        </View>
      </MotiView>
    </Pressable>
  );
}

/* ─── Main Screen ─── */

export default function SettingsScreen() {
  const { gpaScale, setGpaScale, themeMode, setThemeMode } = useSettings();
  const { config: appConfig } = useAppConfig();
  const colors = useThemeColors();
  const navigation = useNavigation<any>();
  const s = useMemo(() => createDynStyles(colors), [colors]);
  const { isPremium, presentPaywall } = useSubscription();

  const openStoreUrl = () => {
    const url = Platform.OS === 'ios' ? appConfig.rateIosLink : appConfig.rateAndroidLink;
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleShareApp = async () => {
    const message = `حمّل تطبيق CalGPA 👇\nApp Store: ${appConfig.rateIosLink}\nGoogle Play: ${appConfig.rateAndroidLink}`;
    try {
      await Share.share({ message });
    } catch (_) {}
  };

  const handleManageSubscription = async () => {
    if (Platform.OS === 'web') return;
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (e) {
      // Fallback: open the store management URL directly
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.managementURL) {
          Linking.openURL(customerInfo.managementURL);
        }
      } catch {}
      if (__DEV__) console.warn('[Settings] Customer center error:', e);
    }
  };

  return (
    <ScreenLayout>
      <ScreenHeader title="الإعدادات" large />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Premium Status Card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 0 }}
        >
          <View style={s.premiumCard}>
            <View style={s.premiumHeader}>
              <View style={[s.premiumIconWrap, { backgroundColor: isPremium ? colors.success + '20' : colors.primaryLight }]}>
                <Ionicons name="star" size={22} color={isPremium ? colors.success : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <RNText style={s.premiumTitle}>الاشتراك المميز</RNText>
                <RNText style={[s.premiumStatus, { color: isPremium ? colors.success : colors.textSecondary }]}>
                  {isPremium ? '✓ مشترك' : 'غير مشترك'}
                </RNText>
              </View>
            </View>

            {isPremium ? (
              <>
                <RNText style={s.premiumBenefits}>
                  تتمتع بجميع المزايا المميزة: أدوات ذكاء اصطناعي بلا حدود، تفاصيل الفرص، تحليل التوافق الوظيفي
                </RNText>
                <View style={s.premiumActions}>
                  <Pressable onPress={() => navigation.navigate('EmailAlerts')}>
                    <View style={s.premiumActionBtn}>
                      <Ionicons name="mail" size={18} color={colors.primary} />
                      <RNText style={s.premiumActionText}>تنبيهات الفرص</RNText>
                    </View>
                  </Pressable>
                  <Pressable onPress={handleManageSubscription}>
                    <View style={[s.premiumActionBtn, { borderColor: colors.textSecondary + '40' }]}>
                      <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
                      <RNText style={[s.premiumActionText, { color: colors.textSecondary }]}>إدارة الاشتراك</RNText>
                    </View>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable onPress={() => presentPaywall()}>
                <View style={s.subscribeBtn}>
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                  <RNText style={s.subscribeBtnText}>اشترك</RNText>
                </View>
              </Pressable>
            )}
          </View>
        </MotiView>

        {/* GPA Scale */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 50 }}
        >
          <View style={s.card}>
            <RNText style={s.sectionLabel}>نظام المعدل</RNText>
            <SegmentControl
              options={[
                { value: '4', label: 'من 4.0' },
                { value: '5', label: 'من 5.0' },
              ]}
              selected={gpaScale}
              onSelect={(v) => setGpaScale(v as '4' | '5')}
              colors={colors}
            />
          </View>
        </MotiView>

        {/* Theme */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
        >
          <View style={s.card}>
            <RNText style={s.sectionLabel}>المظهر</RNText>
            <SegmentControl
              options={[
                { value: 'light', label: 'فاتح' },
                { value: 'dark', label: 'داكن' },
                { value: 'system', label: 'تلقائي' },
              ]}
              selected={themeMode}
              onSelect={(v) => setThemeMode(v as 'light' | 'dark' | 'system')}
              colors={colors}
            />
          </View>
        </MotiView>

        {/* Links */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 250 }}
        >
          <View style={s.card}>
            <LinkRow icon="star" label="قيم التطبيق" onPress={openStoreUrl} colors={colors} s={s} />
            <LinkRow icon="share-social" label="شارك التطبيق" onPress={handleShareApp} colors={colors} s={s} />
            <LinkRow icon="chatbubble-ellipses" label="تواصل معنا" onPress={() => navigation.navigate('Contact')} colors={colors} s={s} />
            <LinkRow icon="document-text" label="اتفاقية الاستخدام" onPress={() => navigation.navigate('Legal', { type: 'terms' })} colors={colors} s={s} />
            <LinkRow icon="shield-checkmark" label="سياسة الخصوصية" onPress={() => navigation.navigate('Legal', { type: 'privacy' })} last colors={colors} s={s} />
          </View>
        </MotiView>

        {/* Version */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
        >
          <Pressable onPress={openStoreUrl}>
            <RNText style={s.version}>
              الإصدار 1.0.0 — تحقق من التحديثات
            </RNText>
          </Pressable>
        </MotiView>
      </ScrollView>
    </ScreenLayout>
  );
}

/* ─── Dynamic styles (depend on colors) ─── */

const createDynStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    sectionLabel: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 12,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 40,
      gap: spacing.lg,
    },
    linkRow: {
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    linkLabel: {
      fontSize: 15,
      fontFamily: fonts.regular,
      textAlign: 'left' as const,
      writingDirection: 'rtl' as const,
      color: colors.text,
    },
    version: {
      textAlign: 'center' as const,
      fontSize: 13,
      marginTop: 8,
      color: colors.textSecondary,
      fontFamily: fonts.regular,
    },

    /* Premium card */
    premiumCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    premiumHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    premiumIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    premiumTitle: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      writingDirection: 'rtl' as const,
    },
    premiumStatus: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      writingDirection: 'rtl' as const,
      marginTop: 2,
    },
    premiumBenefits: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
      textAlign: 'center' as const,
      writingDirection: 'rtl' as const,
    },
    premiumActions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    premiumActionBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.primary + '40',
      gap: 6,
    },
    premiumActionText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl' as const,
    },
    subscribeBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
      ...shadows.sm,
    },
    subscribeBtnText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      writingDirection: 'rtl' as const,
    },
  });
