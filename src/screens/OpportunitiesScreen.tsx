import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, FlatList, TextInput, View, Image, Text as RNText, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView as OriginalMotiView } from 'moti';

// MotiView's reanimated transforms crash on web (indexed CSSStyleDeclaration)
const MotiView = Platform.OS === 'web'
  ? View
  : OriginalMotiView;
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Box } from '../components/ui/box';
import { Text } from '../components/ui/text';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { fonts } from '../theme/fonts';
import { type Opportunity } from '../data/opportunities';
import { useOpportunities } from '../hooks/useOpportunities';
import { useResponsive } from '../theme/responsive';
import { useSubscription } from '../context/SubscriptionContext';

const GRID_GAP = spacing.md;
const GRID_PADDING = spacing.xl;
const PAGE_SIZE = 10;
type FilterTab = 'all' | 'open' | 'closed';
type CategoryFilter = 'all' | 'gdp' | 'coop';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'open', label: 'مفتوح' },
  { key: 'closed', label: 'مغلق' },
];

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'gdp', label: 'تطوير خريجين' },
  { key: 'coop', label: 'تدريب تعاوني' },
];

/* ─── Filter Tab ─── */

function FilterTabButton({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View
        style={[
          styles.filterTab,
          { backgroundColor: active ? colors.primary : colors.surface, borderColor: colors.border },
        ]}
      >
        <RNText
          style={[
            styles.filterTabText,
            { color: active ? '#FFFFFF' : colors.textSecondary },
          ]}
        >
          {label}
        </RNText>
      </View>
    </Pressable>
  );
}

/* ─── Grid Card ─── */

function OpportunityCard({
  item,
  index,
  onPress,
  colors,
  cardWidth,
  numColumns,
  showLock,
}: {
  item: Opportunity;
  index: number;
  onPress: () => void;
  colors: ThemeColors;
  cardWidth: number;
  numColumns: number;
  showLock?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const isClosed = item.status === 'closed';
  const firstLetter = item.companyAr.charAt(0);
  const isFirstInRow = index % numColumns === 0;
  const showImage = !!item.logo && !imgFailed;

  return (
    <MotiView
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
        marginStart: isFirstInRow ? 0 : GRID_GAP,
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
            styles.card,
            { backgroundColor: colors.surface, ...(Platform.OS !== 'web' && { transform: [{ scale: pressed ? 0.96 : 1 }] }) },
          ]}
        >
          {showImage ? (
            <Image
              source={{ uri: item.logo }}
              style={styles.logoImage}
              resizeMode="contain"
              onError={() => setImgFailed(true)}
            />
          ) : item.smartIcon && item.smartIcon !== 'briefcase-outline' ? (
            <View style={[styles.logo, { backgroundColor: item.smartIconColor }]}>
              <Ionicons name={item.smartIcon as any} size={22} color="#FFFFFF" />
            </View>
          ) : (
            <View style={[styles.logo, { backgroundColor: item.logoColor }]}>
              <RNText style={styles.logoLetter}>{firstLetter}</RNText>
            </View>
          )}

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isClosed ? colors.error : colors.success },
              ]}
            />
            <RNText
              style={[
                styles.statusText,
                { color: isClosed ? colors.error : colors.success },
              ]}
            >
              {isClosed ? 'مغلق' : 'مفتوح'}
            </RNText>
          </View>

          {item.type && (
            <View style={[styles.typeBadge, { backgroundColor: item.type === 'gdp' ? '#2D5A3D20' : '#1D4ED820' }]}>
              <RNText style={[styles.typeBadgeText, { color: item.type === 'gdp' ? '#2D5A3D' : '#1D4ED8' }]}>
                {item.type === 'gdp' ? 'تطوير خريجين' : 'تدريب تعاوني'}
              </RNText>
            </View>
          )}

          <RNText style={[styles.companyName, { color: colors.text }]} numberOfLines={2}>
            {item.companyAr}
          </RNText>
          <RNText style={[styles.programName, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.program}
          </RNText>
          {showLock && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
            </View>
          )}
        </View>
      </Pressable>
    </MotiView>
  );
}

/* ─── Pagination Controls ─── */

function PaginationBar({
  page,
  totalPages,
  onNext,
  onPrev,
  colors,
}: {
  page: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  colors: ThemeColors;
}) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.paginationBar}>
      <Pressable
        onPress={() => {
          if (page > 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPrev();
          }
        }}
        disabled={page <= 1}
      >
        <View style={[
          styles.pageBtn,
          { backgroundColor: page > 1 ? colors.primary : colors.border },
        ]}>
          <RNText style={styles.pageBtnText}>السابق</RNText>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </View>
      </Pressable>

      <View style={[styles.pageIndicator, { backgroundColor: colors.primaryLight }]}>
        <RNText style={[styles.pageIndicatorText, { color: colors.primary }]}>
          {page} / {totalPages}
        </RNText>
      </View>

      <Pressable
        onPress={() => {
          if (page < totalPages) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }
        }}
        disabled={page >= totalPages}
      >
        <View style={[
          styles.pageBtn,
          { backgroundColor: page < totalPages ? colors.primary : colors.border },
        ]}>
          <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
          <RNText style={styles.pageBtnText}>التالي</RNText>
        </View>
      </Pressable>
    </View>
  );
}

/* ─── Skeleton Card ─── */

function SkeletonCard({
  index,
  cardWidth,
  numColumns,
  colors,
}: {
  index: number;
  cardWidth: number;
  numColumns: number;
  colors: ThemeColors;
}) {
  const isFirstInRow = index % numColumns === 0;

  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 800,
        loop: true,
      }}
      style={{
        width: cardWidth,
        marginStart: isFirstInRow ? 0 : GRID_GAP,
      }}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={[styles.logo, { backgroundColor: colors.border, opacity: 0.5 }]} />
        <View style={{ width: 40, height: 8, borderRadius: 4, backgroundColor: colors.border, opacity: 0.4, marginBottom: spacing.xs }} />
        <View style={{ width: 70, height: 8, borderRadius: 4, backgroundColor: colors.border, opacity: 0.4, marginBottom: spacing.xs }} />
        <View style={{ width: '80%', height: 12, borderRadius: 6, backgroundColor: colors.border, opacity: 0.5, marginBottom: 4 }} />
        <View style={{ width: '50%', height: 10, borderRadius: 5, backgroundColor: colors.border, opacity: 0.3 }} />
      </View>
    </MotiView>
  );
}

/* ─── Main Screen ─── */

export default function OpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [revealKey, setRevealKey] = useState(0);
  const colors = useThemeColors();
  const { width: screenWidth, gridColumns, maxContentWidth } = useResponsive();
  const { opportunities, loading } = useOpportunities();
  const { isPremium, presentPaywall } = useSubscription();

  const handleCardPress = useCallback((itemId: string) => {
    if (!isPremium) {
      Alert.alert(
        'ميزة مميزة',
        'تفاصيل الفرص متاحة فقط للمشتركين في النسخة المميزة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'اشترك الآن', onPress: () => presentPaywall() },
        ],
      );
      return;
    }
    navigation.navigate('OpportunityDetail', { id: itemId });
  }, [isPremium, presentPaywall, navigation]);

  const containerWidth = Math.min(screenWidth, maxContentWidth);
  const cardWidth = (containerWidth - GRID_PADDING * 2 - GRID_GAP * (gridColumns - 1)) / gridColumns;

  const filtered = useMemo(() => {
    let list = opportunities;
    if (activeFilter === 'open') list = list.filter((o) => o.status === 'open');
    if (activeFilter === 'closed') list = list.filter((o) => o.status === 'closed');
    if (categoryFilter !== 'all') list = list.filter((o) => o.type === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.companyAr.includes(q) ||
          o.company.toLowerCase().includes(q) ||
          o.program.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeFilter, categoryFilter, opportunities]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  // Bump revealKey to force cards to re-mount and stagger in one by one
  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
    setRevealKey((k) => k + 1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
    setRevealKey((k) => k + 1);
  }, []);

  return (
    <ScreenLayout>
      <ScreenHeader title="الفرص المتاحة">
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="بحث"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={(t) => { setSearch(t); resetPage(); }}
            />
          </View>
        </View>
      </ScreenHeader>

      {loading ? (
        <FlatList
          data={Array.from({ length: 6 }, (_, i) => String(i))}
          numColumns={gridColumns}
          key={`skeleton-${gridColumns}`}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
          ListHeaderComponent={() => (
            <>
              <View style={styles.filterRow}>
                {FILTER_TABS.map((tab) => (
                  <FilterTabButton key={tab.key} label={tab.label} active={tab.key === 'all'} onPress={() => {}} colors={colors} />
                ))}
              </View>
              <View style={styles.filterRow}>
                {CATEGORY_TABS.map((tab) => (
                  <FilterTabButton key={tab.key} label={tab.label} active={tab.key === 'all'} onPress={() => {}} colors={colors} />
                ))}
              </View>
            </>
          )}
          renderItem={({ index }) => (
            <SkeletonCard index={index} cardWidth={cardWidth} numColumns={gridColumns} colors={colors} />
          )}
        />
      ) : (
        <FlatList
          data={pageData}
          numColumns={gridColumns}
          key={`grid-${gridColumns}-${revealKey}`}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
          ListHeaderComponent={() => (
            <>
              <View style={styles.filterRow}>
                {FILTER_TABS.map((tab) => (
                  <FilterTabButton
                    key={tab.key}
                    label={tab.label}
                    active={activeFilter === tab.key}
                    onPress={() => { setActiveFilter(tab.key); resetPage(); }}
                    colors={colors}
                  />
                ))}
              </View>
              <View style={styles.filterRow}>
                {CATEGORY_TABS.map((tab) => (
                  <FilterTabButton
                    key={tab.key}
                    label={tab.label}
                    active={categoryFilter === tab.key}
                    onPress={() => { setCategoryFilter(tab.key); resetPage(); }}
                    colors={colors}
                  />
                ))}
              </View>
            </>
          )}
          renderItem={({ item, index }) => (
            <OpportunityCard
              item={item}
              index={index}
              onPress={() => handleCardPress(item.id)}
              colors={colors}
              cardWidth={cardWidth}
              numColumns={gridColumns}
              showLock={!isPremium}
            />
          )}
          ListFooterComponent={
            <PaginationBar
              page={safePage}
              totalPages={totalPages}
              onNext={() => changePage(Math.min(safePage + 1, totalPages))}
              onPrev={() => changePage(Math.max(safePage - 1, 1))}
              colors={colors}
            />
          }
          ListEmptyComponent={
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color={colors.border} />
                <RNText style={[styles.emptyText, { color: colors.textSecondary }]}>لا توجد نتائج</RNText>
              </View>
            </MotiView>
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    textAlign: 'right',
    writingDirection: 'rtl',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  gridContent: {
    padding: GRID_PADDING,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: GRID_GAP,
    minHeight: 160,
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
    color: '#FFFFFF',
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
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  programName: {
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Pagination */
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    width: '100%',
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 12,
  },
  pageBtnText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: '#FFFFFF',
  },
  pageIndicator: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
});
