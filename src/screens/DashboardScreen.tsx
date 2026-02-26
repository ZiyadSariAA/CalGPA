import { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import GPAChart from '../components/GPAChart';
import { useResponsive } from '../theme/responsive';
import { Box } from '../components/ui/box';
import { Text } from '../components/ui/text';
import { HStack } from '../components/ui/hstack';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { fonts } from '../theme/fonts';
import { useSemesters, type SavedSemester } from '../context/SemesterContext';
import { useSettings } from '../context/SettingsContext';

/* ─── Edit Modal ─── */

function EditSemesterModal({
  semester,
  colors,
  styles,
  onSave,
  onClose,
}: {
  semester: SavedSemester;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onSave: (updates: { label: string; gpa: number; creditHours: number }) => void;
  onClose: () => void;
}) {
  const { gpaScale } = useSettings();
  const [label, setLabel] = useState(semester.label);
  const [gpaText, setGpaText] = useState(String(semester.gpa));
  const [hoursText, setHoursText] = useState(String(semester.creditHours));

  const maxGpa = gpaScale === '4' ? 4 : 5;

  const handleSave = () => {
    const gpa = parseFloat(gpaText);
    const creditHours = parseInt(hoursText, 10);
    if (isNaN(gpa) || gpa < 0 || gpa > maxGpa) {
      Alert.alert('خطأ', `المعدل يجب أن يكون بين 0 و ${maxGpa}`);
      return;
    }
    if (isNaN(creditHours) || creditHours < 1) {
      Alert.alert('خطأ', 'عدد الساعات يجب أن يكون 1 على الأقل');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({ label: label.trim() || semester.label, gpa, creditHours });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardView}
        >
          <Pressable>
            <MotiView
              from={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 160 }}
            >
              <Box style={styles.modalContent}>
                <Text bold style={styles.modalTitle}>تعديل الفصل</Text>
                <Text style={styles.modalFieldLabel}>اسم الفصل</Text>
                <TextInput
                  style={[styles.modalInput, { fontFamily: fonts.regular }]}
                  placeholder="اسم الفصل"
                  placeholderTextColor={colors.textSecondary}
                  value={label}
                  onChangeText={setLabel}
                  textAlign="right"
                  autoFocus
                />
                <Text style={styles.modalFieldLabel}>المعدل (0 - {maxGpa})</Text>
                <TextInput
                  style={[styles.modalInput, { fontFamily: fonts.regular }]}
                  placeholder={`0 - ${maxGpa}`}
                  placeholderTextColor={colors.textSecondary}
                  value={gpaText}
                  onChangeText={setGpaText}
                  textAlign="right"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.modalFieldLabel}>عدد الساعات</Text>
                <TextInput
                  style={[styles.modalInput, { fontFamily: fonts.regular }]}
                  placeholder="عدد الساعات"
                  placeholderTextColor={colors.textSecondary}
                  value={hoursText}
                  onChangeText={setHoursText}
                  textAlign="right"
                  keyboardType="number-pad"
                />
                <HStack style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onClose();
                    }}
                    style={styles.modalCancelBtn}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>إلغاء</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text bold style={[styles.modalBtnText, { color: colors.white }]}>حفظ</Text>
                  </Pressable>
                </HStack>
              </Box>
            </MotiView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/* ─── Stat Card ─── */

function StatCard({
  label,
  value,
  icon,
  delay,
  colors,
  styles,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  delay: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay }}
      style={{ flex: 1 }}
    >
      <Box style={styles.statCard}>
        <Ionicons name={icon} size={20} color={colors.primary} style={{ marginBottom: spacing.xs }} />
        <Text bold style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Box>
    </MotiView>
  );
}

/* ─── Semester Card ─── */

function SemesterCard({
  semester,
  index,
  colors,
  styles,
  onEdit,
  onDelete,
}: {
  semester: SavedSemester;
  index: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const date = new Date(semester.createdAt);
  const dateStr = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: Math.min(index * 60, 300) }}
    >
      <Box style={styles.semesterCard}>
        <Box style={styles.semesterCardInner}>
          {/* Edit + Delete on the left */}
          <HStack style={styles.cardActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onEdit();
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete();
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          </HStack>
          {/* Content on the right */}
          <Box style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text bold style={styles.semesterLabel}>{semester.label}</Text>
            <HStack style={styles.semesterMeta}>
              <Text style={styles.semesterMetaText}>المعدل: {semester.gpa.toFixed(2)}</Text>
              <Text style={styles.semesterMetaText}>|</Text>
              <Text style={styles.semesterMetaText}>{semester.creditHours} ساعة</Text>
              <Text style={styles.semesterMetaText}>|</Text>
              <Text style={styles.semesterMetaText}>{dateStr}</Text>
            </HStack>
          </Box>
        </Box>
      </Box>
    </MotiView>
  );
}

/* ─── Main Screen ─── */

export default function DashboardScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const { maxContentWidth } = useResponsive();
  const { semesters, cumulativeGpa, totalCredits, updateSemester, deleteSemester } = useSemesters();
  const { gpaScale } = useSettings();

  const [editingSemester, setEditingSemester] = useState<SavedSemester | null>(null);

  const maxScale = gpaScale === '4' ? 4 : 5;

  const chartData = useMemo(
    () => semesters.map((s) => {
      const semesterMax = s.gpaScale === '4' ? 4 : 5;
      return (s.gpa / semesterMax) * maxScale;
    }),
    [semesters, maxScale],
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

  const isEmpty = semesters.length === 0;

  return (
    <ScreenLayout>
      <ScreenHeader title="لوحة المتابعة" large />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isEmpty ? (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          >
            <Box style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={56} color={colors.textSecondary} />
              <Text bold style={styles.emptyTitle}>لا توجد فصول محفوظة</Text>
              <Text style={styles.emptySubtitle}>
                احسب معدلك في حاسبة المعدل ثم احفظ الفصل لتتبع تقدمك الأكاديمي
              </Text>
            </Box>
          </MotiView>
        ) : (
          <>
            {/* Stat cards */}
            <HStack style={styles.statsRow}>
              <StatCard
                label={`المعدل التراكمي من ${maxScale}`}
                value={cumulativeGpa.toFixed(2)}
                icon="school"
                delay={0}
                colors={colors}
                styles={styles}
              />
              <StatCard
                label="الساعات"
                value={String(totalCredits)}
                icon="time"
                delay={60}
                colors={colors}
                styles={styles}
              />
              <StatCard
                label="الفصول"
                value={String(semesters.length)}
                icon="layers"
                delay={120}
                colors={colors}
                styles={styles}
              />
            </HStack>

            {/* Chart */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 180 }}
            >
              <Box style={styles.chartCard}>
                <Text bold style={styles.sectionTitle}>تطور المعدل</Text>
                <GPAChart data={chartData} maxValue={maxScale} width={chartWidth - spacing['2xl'] * 2} />
              </Box>
            </MotiView>

            {/* Semester history */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 240 }}
            >
              <RNText style={[styles.sectionTitle, { fontFamily: fonts.bold }]}>سجل الفصول</RNText>
            </MotiView>

            {semesters.map((s, i) => (
              <SemesterCard
                key={s.id}
                semester={s}
                index={i}
                colors={colors}
                styles={styles}
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
          colors={colors}
          styles={styles}
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

    /* Stats */
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.md,
      alignItems: 'center',
      ...shadows.sm,
    },
    statValue: {
      fontSize: 22,
      color: colors.text,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },

    /* Chart */
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing['2xl'],
      ...shadows.sm,
    },
    sectionTitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'rtl',
      marginBottom: spacing.md,
    },

    /* Semester cards */
    semesterCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.lg,
      ...shadows.sm,
    },
    semesterCardInner: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: spacing.md,
    },
    semesterLabel: {
      fontSize: 15,
      color: colors.text,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    semesterMeta: {
      flexDirection: 'row-reverse',
      gap: spacing.xs,
      marginTop: spacing.xs,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
    semesterMetaText: {
      fontSize: 12,
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    actionBtn: {
      padding: spacing.sm,
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
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 22,
    },

    /* Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalKeyboardView: {
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: spacing['2xl'],
    },
    modalTitle: {
      fontSize: 18,
      color: colors.text,
      textAlign: 'right',
      marginBottom: spacing.lg,
    },
    modalFieldLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginBottom: spacing.xs,
    },
    modalInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: 'right',
      marginBottom: spacing.lg,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      borderRadius: 14,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    modalSaveBtn: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      borderRadius: 14,
      alignItems: 'center',
    },
    modalBtnText: {
      fontSize: 15,
    },
  });
