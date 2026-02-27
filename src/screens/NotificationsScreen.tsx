import { useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { fonts } from '../theme/fonts';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { useNotificationsContext } from '../context/NotificationsContext';
import type { AppNotification } from '../hooks/useNotifications';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
}

function NotificationCard({
  item,
  index,
  isUnread,
  colors,
  styles,
}: {
  item: AppNotification;
  index: number;
  isUnread: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const dateLabel = formatDate(item.date);

  return (
    <AnimatedView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: Math.min(index * 60, 300) }}
    >
      <View style={styles.card}>
        {/* Header row: dot + title + date */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            {isUnread && <View style={styles.unreadDot} />}
            <RNText style={styles.cardTitle} numberOfLines={1}>{item.title}</RNText>
          </View>
          {!!dateLabel && (
            <RNText style={styles.cardDate}>{dateLabel}</RNText>
          )}
        </View>

        {/* Message body */}
        <RNText style={styles.cardMessage} numberOfLines={3}>{item.message}</RNText>

        {/* Link button */}
        {!!item.link && (
          <Pressable onPress={() => Linking.openURL(item.link!)}>
            <View style={styles.linkRow}>
              <Ionicons name="link-outline" size={14} color={colors.primary} />
              <RNText style={styles.linkText} numberOfLines={1}>فتح الرابط</RNText>
            </View>
          </Pressable>
        )}
      </View>
    </AnimatedView>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { notifications, loading, lastSeen, markAllRead, clearAll } = useNotificationsContext();

  useEffect(() => {
    if (!loading && notifications.length > 0) {
      markAllRead();
    }
  }, [loading]);

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearAll();
  };

  return (
    <ScreenLayout>
      <ScreenHeader title="الإشعارات" onBack={() => navigation.goBack()}>
        {notifications.length > 0 ? (
          <Pressable onPress={handleClear}>
            <View style={[styles.markReadBtn, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
              <RNText style={[styles.markReadText, { color: colors.primary }]}>قراءة الكل</RNText>
            </View>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </ScreenHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!loading && notifications.length === 0 ? (
          <AnimatedView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          >
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={56} color={colors.textSecondary} />
              <RNText style={styles.emptyTitle}>لا توجد إشعارات</RNText>
              <RNText style={styles.emptySubtitle}>
                ستظهر الإشعارات هنا عند وصولها
              </RNText>
            </View>
          </AnimatedView>
        ) : (
          notifications.map((item, index) => (
            <NotificationCard
              key={item.id}
              item={item}
              index={index}
              isUnread={item.createdAt > lastSeen}
              colors={colors}
              styles={styles}
            />
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 40,
      gap: spacing.md,
    },

    /* Mark read button */
    markReadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    markReadText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
    },

    /* Card */
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      ...shadows.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginEnd: spacing.sm,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginEnd: 8,
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'rtl',
      flex: 1,
    },
    cardDate: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
    cardMessage: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'left',
      writingDirection: 'rtl',
      lineHeight: 21,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
    },
    linkText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.primary,
    },

    /* Empty state */
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing['3xl'],
      alignItems: 'center',
      marginTop: spacing['3xl'],
      ...shadows.sm,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 22,
    },
  });
