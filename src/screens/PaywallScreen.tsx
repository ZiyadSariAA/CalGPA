import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { fonts } from '../theme/fonts';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { PREMIUM_FEATURES, ENTITLEMENT_ID } from '../constants/subscription';

export default function PaywallScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFallback, setSelectedFallback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        if (current && current.availablePackages.length > 0) {
          const sorted = [...current.availablePackages].sort(
            (a, b) => a.product.price - b.product.price,
          );
          setPackages(sorted);
          setSelectedPackage(sorted[0]);
        }
      } catch (e) {
        if (__DEV__) console.warn('[Paywall] Failed to load offerings:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage) return;
    setPurchasing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        Alert.alert('تم بنجاح!', 'تم تفعيل الاشتراك المميز', [
          { text: 'حسناً', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('خطأ في الشراء', 'يرجى المحاولة مرة أخرى لاحقاً');
      }
    } finally {
      setPurchasing(false);
    }
  }, [selectedPackage, navigation]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        Alert.alert('تم الاستعادة!', 'تم استعادة اشتراكك المميز', [
          { text: 'حسناً', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('لا يوجد اشتراك', 'لم يتم العثور على اشتراك سابق');
      }
    } catch {
      Alert.alert('خطأ', 'تعذرت استعادة المشتريات');
    } finally {
      setRestoring(false);
    }
  }, [navigation]);

  const styles = makeStyles(colors);

  /** Renders a single package card (used for both real & fallback packages) */
  const renderPackageCard = (
    key: string,
    identifier: string,
    title: string,
    price: number,
    months: number,
    isSelected: boolean,
    discount: number,
    onSelect: () => void,
  ) => {
    const perMonth = price / months;
    return (
      <View key={key} style={{ position: 'relative' }}>
        {discount > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.discountBadgeText}>خصم {discount}٪</Text>
          </View>
        )}
        <Pressable
          style={[
            styles.packageCard,
            {
              backgroundColor: isSelected ? colors.primaryLight : colors.surface,
              borderColor: isSelected ? colors.primary : colors.border,
            },
          ]}
          onPress={onSelect}
        >
          {/* 1st child = RIGHT in RTL: title + per month */}
          <View style={styles.packageInfo}>
            <Text style={[styles.packageTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.packagePerMonth, { color: colors.textSecondary }]}>
              {formatSAR(perMonth)} / شهر
            </Text>
          </View>
          {/* 2nd child = middle: total price */}
          <Text style={[styles.packagePrice, { color: colors.textSecondary }]}>
            {formatSAR(price)}{getPackagePeriodShort(identifier)}
          </Text>
          {/* 3rd child = FAR LEFT in RTL: radio */}
          <View
            style={[
              styles.packageRadio,
              { borderColor: isSelected ? colors.primary : colors.border },
            ]}
          >
            {isSelected && (
              <View style={[styles.packageRadioInner, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Close button — top right for RTL */}
      <View style={styles.closeRow}>
        <Pressable
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <Text style={[styles.headline, { color: colors.text }]}>
          افتح جميع المزايا المميزة
        </Text>

        {/* Features slider */}
        <FeaturesSlider colors={colors} />

        {/* Package selection */}
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : packages.length > 0 ? (
          <View style={styles.packagesContainer}>
            {(() => {
              const monthlyPkg = packages.find((p) => p.identifier === 'monthly');
              const monthlyPrice = monthlyPkg?.product.price ?? 0;
              return packages.map((pkg) => {
                const months = getPackageMonths(pkg.identifier);
                const discount = monthlyPrice > 0 && months > 1
                  ? Math.round((1 - pkg.product.price / (monthlyPrice * months)) * 100)
                  : 0;
                return renderPackageCard(
                  pkg.identifier,
                  pkg.identifier,
                  getPackageTitle(pkg.identifier),
                  pkg.product.price,
                  months,
                  selectedPackage?.identifier === pkg.identifier,
                  discount,
                  () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPackage(pkg);
                  },
                );
              });
            })()}
          </View>
        ) : (
          <View style={styles.packagesContainer}>
            {(() => {
              const fallbackMonthlyPrice = FALLBACK_PACKAGES.find((p) => p.months === 1)?.price ?? 0;
              return FALLBACK_PACKAGES.map((fp) => {
                const discount = fallbackMonthlyPrice > 0 && fp.months > 1
                  ? Math.round((1 - fp.price / (fallbackMonthlyPrice * fp.months)) * 100)
                  : 0;
                return renderPackageCard(
                  fp.id,
                  fp.id,
                  fp.title,
                  fp.price,
                  fp.months,
                  (selectedFallback ?? FALLBACK_PACKAGES[0].id) === fp.id,
                  discount,
                  () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFallback(fp.id);
                  },
                );
              });
            })()}
          </View>
        )}

        {/* CTA Button */}
        <Pressable
          style={[
            styles.ctaButton,
            { backgroundColor: colors.primary },
            (purchasing || !selectedPackage) && styles.ctaDisabled,
          ]}
          onPress={handlePurchase}
          disabled={purchasing || !selectedPackage}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>متابعة</Text>
          )}
        </Pressable>

        {/* Footer links */}
        <View style={styles.footer}>
          <Pressable onPress={handleRestore} disabled={restoring}>
            <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
              {restoring ? 'جارٍ الاستعادة...' : 'استعادة المشتريات'}
            </Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: colors.border }]}>•</Text>
          <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
              الشروط
            </Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: colors.border }]}>•</Text>
          <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/privacy/')}>
            <Text style={[styles.footerLink, { color: colors.textSecondary }]}>
              الخصوصية
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── Features Slider ─── */

const SCREEN_WIDTH = Dimensions.get('window').width;

function FeaturesSlider({ colors }: { colors: ThemeColors }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={sliderStyles.container}>
      <Carousel
        width={SCREEN_WIDTH - spacing['2xl'] * 2}
        height={180}
        data={PREMIUM_FEATURES as any}
        autoPlay
        autoPlayInterval={5000}
        scrollAnimationDuration={1000}
        loop
        onSnapToItem={setActiveIndex}
        panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
        renderItem={({ item }: { item: typeof PREMIUM_FEATURES[number] }) => (
          <View style={[sliderStyles.card, { backgroundColor: colors.primaryLight }]}>
            <View style={[sliderStyles.iconCircle, { backgroundColor: colors.surface }]}>
              <Ionicons name={item.icon} size={28} color={colors.primary} />
            </View>
            <Text style={[sliderStyles.text, { color: colors.text }]}>
              {item.text}
            </Text>
          </View>
        )}
      />
      {/* Dots */}
      <View style={sliderStyles.dots}>
        {PREMIUM_FEATURES.map((_, i) => (
          <View
            key={i}
            style={[
              sliderStyles.dot,
              {
                backgroundColor: i === activeIndex ? colors.primary : colors.border,
                width: i === activeIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xs,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

/* ─── Helpers ─── */

function getPackageTitle(identifier: string): string {
  switch (identifier) {
    case 'monthly': return 'شهري';
    case 'three_month': return '٣ أشهر';
    case 'yearly': return 'سنوي';
    default: return 'اشتراك';
  }
}

function getPackageMonths(identifier: string): number {
  switch (identifier) {
    case 'monthly': return 1;
    case 'three_month': return 3;
    case 'yearly': return 12;
    default: return 1;
  }
}

function getPackagePeriodShort(identifier: string): string {
  switch (identifier) {
    case 'monthly': return '/شهر';
    case 'three_month': return '/٣ أشهر';
    case 'yearly': return '/سنة';
    default: return '';
  }
}

function formatSAR(price: number): string {
  return `${price.toFixed(2)} ر.س`;
}

const FALLBACK_PACKAGES = [
  { id: 'monthly', title: 'شهري', price: 12.99, months: 1 },
  { id: 'three_month', title: '٣ أشهر', price: 29.99, months: 3 },
  { id: 'yearly', title: 'سنوي', price: 69.99, months: 12 },
];

/* ─── Styles ─── */

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    closeRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    scrollContent: {
      paddingHorizontal: spacing['2xl'],
      paddingBottom: spacing['3xl'],
      alignItems: 'flex-end',
    },
    headline: {
      fontFamily: fonts.bold,
      fontSize: 24,
      textAlign: 'center',
      marginTop: spacing.lg,
      writingDirection: 'rtl',
      alignSelf: 'stretch',
    },
    loader: {
      marginTop: spacing['3xl'],
    },
    packagesContainer: {
      alignSelf: 'stretch',
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    packageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 14,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    packageRadio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    packageRadioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    packageInfo: {
      flex: 1,
    },
    packageTitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    packagePerMonth: {
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 2,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    packagePrice: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginHorizontal: spacing.sm,
    },
    discountBadge: {
      position: 'absolute',
      top: -10,
      right: spacing.lg,
      borderRadius: 8,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      zIndex: 1,
    },
    discountBadgeText: {
      fontFamily: fonts.bold,
      fontSize: 11,
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },
    ctaButton: {
      alignSelf: 'stretch',
      paddingVertical: spacing.lg,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xl,
      ...shadows.md,
    },
    ctaDisabled: {
      opacity: 0.6,
    },
    ctaText: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    footerLink: {
      fontFamily: fonts.regular,
      fontSize: 13,
      writingDirection: 'rtl',
    },
    footerDot: {
      fontSize: 13,
    },
  });
}
