import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, FlatList, TextInput, View, Text as RNText } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { FilterTabButton, SkeletonCard, PaginationBar } from '../components/common';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { type Opportunity } from '../data/opportunities';
import { useOpportunities } from '../hooks/useOpportunities';
import { useResponsive } from '../theme/responsive';


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

export default function OpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [revealKey, setRevealKey] = useState(0);
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth, gridColumns, maxContentWidth } = useResponsive();
  const { opportunities, loading } = useOpportunities();
  const handleCardPress = useCallback((itemId: string) => {
    navigation.navigate('OpportunityDetail', { id: itemId });
  }, [navigation]);

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
                  <FilterTabButton key={tab.key} label={tab.label} active={tab.key === 'all'} onPress={() => {}} />
                ))}
              </View>
              <View style={styles.filterRow}>
                {CATEGORY_TABS.map((tab) => (
                  <FilterTabButton key={tab.key} label={tab.label} active={tab.key === 'all'} onPress={() => {}} />
                ))}
              </View>
            </>
          )}
          renderItem={({ index }) => (
            <SkeletonCard index={index} cardWidth={cardWidth} numColumns={gridColumns} gridGap={GRID_GAP} />
          )}
        />
      ) : (
        <FlatList
          data={pageData}
          numColumns={gridColumns}
          key={`grid-${gridColumns}`}
          keyExtractor={(item) => item.id}
          extraData={revealKey}
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
              cardWidth={cardWidth}
              numColumns={gridColumns}
              gridGap={GRID_GAP}

            />
          )}
          ListFooterComponent={
            <PaginationBar
              page={safePage}
              totalPages={totalPages}
              onNext={() => changePage(Math.min(safePage + 1, totalPages))}
              onPrev={() => changePage(Math.max(safePage - 1, 1))}
            />
          }
          ListEmptyComponent={
            <AnimatedView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color={colors.border} />
                <RNText style={styles.emptyText}>لا توجد نتائج</RNText>
              </View>
            </AnimatedView>
          }
        />
      )}
    </ScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    gridContent: {
      padding: GRID_PADDING,
      paddingBottom: 30,
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: 60,
      gap: spacing.md,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
