import { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
  View,
  Text as RNText,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import GPAChart from '../components/GPAChart';
import { useResponsive } from '../theme/responsive';
import { StatCard } from '../components/common';
import SemesterCard from '../components/dashboard/SemesterCard';
import EditSemesterModal from '../components/dashboard/EditSemesterModal';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { fonts } from '../theme/fonts';
import { useSemesters, type SavedSemester } from '../context/SemesterContext';
import { useSettings } from '../context/SettingsContext';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { maxContentWidth } = useResponsive();
  const { semesters, cumulativeGpa, totalCredits, updateSemester, deleteSemester } = useSemesters();
  const { gpaScale } = useSettings();

  const [editingSemester, setEditingSemester] = useState<SavedSemester | null>(null);

  const maxScale = gpaScale === '4' ? 4 : 5;

  const filteredSemesters = useMemo(
    () => semesters.filter((s) => s.gpaScale === gpaScale),
    [semesters, gpaScale],
  );

  const chartData = useMemo(
    () => filteredSemesters.map((s) => s.gpa),
    [filteredSemesters],
  );

  const chartWidth = Math.min(width - spacing.xl * 2, maxContentWidth);

  const handleDelete = useCallback(
    (semester: SavedSemester) => {
      Alert.alert('حذف الفصل', `هل تريد حذف "${semester.label}"؟`, [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteSemester(semester.id);
          },
        },
      ]);
    },
    [deleteSemester],
  );

  const handleEditSave = useCallback(
    (updates: { label: string; gpa: number; creditHours: number }) => {
      if (editingSemester) {
        updateSemester(editingSemester.id, { ...updates, gpaScale });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setEditingSemester(null);
    },
    [editingSemester, updateSemester, gpaScale],
  );

  const isEmpty = filteredSemesters.length === 0;

  return (
    <ScreenLayout>
      <ScreenHeader title="لوحة المتابعة" large />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isEmpty ? (
          <AnimatedView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          >
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={56} color={colors.textSecondary} />
              <RNText style={styles.emptyTitle}>لا توجد فصول محفوظة</RNText>
              <RNText style={styles.emptySubtitle}>
                احسب معدلك في حاسبة المعدل ثم احفظ الفصل لتتبع تقدمك الأكاديمي
              </RNText>
            </View>
          </AnimatedView>
        ) : (
          <>
            {/* Stat cards */}
            <View style={styles.statsRow}>
              <StatCard
                label={`المعدل التراكمي من ${maxScale}`}
                value={cumulativeGpa.toFixed(2)}
                icon="school"
                delay={0}
              />
              <StatCard
                label="الساعات"
                value={String(totalCredits)}
                icon="time"
                delay={60}
              />
              <StatCard
                label="الفصول"
                value={String(filteredSemesters.length)}
                icon="layers"
                delay={120}
              />
            </View>

            {/* Chart */}
            <AnimatedView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 180 }}
            >
              <View style={styles.chartCard}>
                <RNText style={styles.sectionTitle}>تطور المعدل</RNText>
                <GPAChart data={chartData} maxValue={maxScale} width={chartWidth - spacing['2xl'] * 2} />
              </View>
            </AnimatedView>

            {/* Semester history */}
            <AnimatedView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 240 }}
            >
              <RNText style={styles.sectionTitle}>سجل الفصول</RNText>
            </AnimatedView>

            {filteredSemesters.map((s, i) => (
              <SemesterCard
                key={s.id}
                semester={s}
                index={i}
                onEdit={() => setEditingSemester(s)}
                onDelete={() => handleDelete(s)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {editingSemester && (
        <EditSemesterModal
          semester={editingSemester}
          onSave={handleEditSave}
          onClose={() => setEditingSemester(null)}
        />
      )}
    </ScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 40,
      gap: spacing.lg,
    },

    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing['2xl'],
      ...shadows.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'rtl',
      marginBottom: spacing.md,
    },

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
