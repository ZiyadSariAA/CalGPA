import { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text as RNText, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Purchases from 'react-native-purchases';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useSubscription } from '../context/SubscriptionContext';
import { Platform } from 'react-native';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function EmailAlertsScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { isPremium, presentPaywall } = useSubscription();

  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing subscription data
  useEffect(() => {
    (async () => {
      if (!isPremium || Platform.OS === 'web') {
        setLoading(false);
        return;
      }
      try {
        const { originalAppUserId } = await Purchases.getCustomerInfo();
        const docRef = doc(db, 'emailSubscribers', originalAppUserId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setEmail(data.email || '');
          setEnabled(data.enabled || false);
        }
      } catch (e) {
        if (__DEV__) console.warn('[EmailAlerts] Failed to load:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPremium]);

  // If not premium, redirect to paywall
  if (!isPremium) {
    return (
      <ScreenLayout>
        <ScreenHeader title="تنبيهات الفرص" onBack={() => navigation.goBack()} />
        <View style={s.lockContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140 }}
          >
            <View style={s.lockCard}>
              <View style={s.lockIconWrap}>
                <Ionicons name="lock-closed" size={32} color={colors.primary} />
              </View>
              <RNText style={s.lockTitle}>ميزة مميزة</RNText>
              <RNText style={s.lockMessage}>
                اشترك في النسخة المميزة لتفعيل تنبيهات البريد الإلكتروني عند إضافة فرص جديدة
              </RNText>
              <Pressable onPress={() => presentPaywall()}>
                <View style={s.upgradeBtn}>
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                  <RNText style={s.upgradeBtnText}>اشترك الآن</RNText>
                </View>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </ScreenLayout>
    );
  }

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('تنبيه', 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setSaving(true);
    try {
      const { originalAppUserId } = await Purchases.getCustomerInfo();
      const docRef = doc(db, 'emailSubscribers', originalAppUserId);
      await setDoc(docRef, {
        email: email.trim(),
        anonymousId: originalAppUserId,
        enabled: true,
        subscribedAt: new Date().toISOString(),
        platform: Platform.OS,
      }, { merge: true });
      setEnabled(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم', 'تم تفعيل تنبيهات الفرص بنجاح');
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
      if (__DEV__) console.warn('[EmailAlerts] Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      const { originalAppUserId } = await Purchases.getCustomerInfo();
      const docRef = doc(db, 'emailSubscribers', originalAppUserId);
      await setDoc(docRef, { enabled: false }, { merge: true });
      setEnabled(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout>
      <ScreenHeader title="تنبيهات الفرص" onBack={() => navigation.goBack()} />

      <View style={s.content}>
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.iconWrap}>
                <Ionicons name="mail" size={22} color={colors.primary} />
              </View>
              <RNText style={s.cardTitle}>تنبيهات البريد الإلكتروني</RNText>
            </View>

            <RNText style={s.cardDescription}>
              أدخل بريدك الإلكتروني لتصلك إشعارات عند إضافة فرص تدريب أو وظائف جديدة
            </RNText>

            {/* Status badge */}
            {enabled && (
              <View style={s.statusBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <RNText style={[s.statusText, { color: colors.success }]}>التنبيهات مفعلة</RNText>
              </View>
            )}

            <RNText style={s.label}>البريد الإلكتروني</RNText>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="left"
              editable={!saving}
            />

            <Pressable onPress={handleSave} disabled={saving}>
              <View style={[s.saveBtn, saving && { opacity: 0.6 }]}>
                <Ionicons name={enabled ? 'refresh' : 'notifications'} size={18} color="#FFFFFF" />
                <RNText style={s.saveBtnText}>
                  {saving ? 'جاري الحفظ...' : enabled ? 'تحديث البريد' : 'تفعيل التنبيهات'}
                </RNText>
              </View>
            </Pressable>

            {enabled && (
              <Pressable onPress={handleDisable} disabled={saving}>
                <View style={s.disableBtn}>
                  <Ionicons name="notifications-off" size={16} color={colors.error} />
                  <RNText style={[s.disableBtnText, { color: colors.error }]}>إيقاف التنبيهات</RNText>
                </View>
              </Pressable>
            )}
          </View>
        </MotiView>
      </View>
    </ScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: spacing.xl,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.text,
      writingDirection: 'rtl',
    },
    cardDescription: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: spacing.lg,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.success + '15',
      marginBottom: spacing.md,
    },
    statusText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      writingDirection: 'rtl',
    },
    label: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
      ...shadows.sm,
    },
    saveBtnText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },
    disableBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 6,
      marginTop: spacing.sm,
    },
    disableBtnText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      writingDirection: 'rtl',
    },

    /* Lock screen */
    lockContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    lockCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing['2xl'],
      alignItems: 'center',
      ...shadows.md,
    },
    lockIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    lockTitle: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: spacing.sm,
      writingDirection: 'rtl',
    },
    lockMessage: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
      writingDirection: 'rtl',
    },
    upgradeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 32,
      gap: 8,
      ...shadows.sm,
    },
    upgradeBtnText: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },
  });
