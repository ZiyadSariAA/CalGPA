import { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, Modal, useWindowDimensions, KeyboardAvoidingView, Platform, Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Box } from '../components/ui/box';
import { Text } from '../components/ui/text';
import { HStack } from '../components/ui/hstack';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { fonts } from '../theme/fonts';
import { useSettings } from '../context/SettingsContext';
import { useSemesters } from '../context/SemesterContext';
import { GPA_SCALES } from '../data/constants';

/* ─── Types ─── */

type Course = {
  id: string;
  name: string;
  creditHours: number | null;
  grade: string | null;
};

/* ─── Helpers ─── */

let courseCounter = 0;
function newCourse(): Course {
  return { id: String(++courseCounter), name: '', creditHours: null, grade: null };
}

const CREDIT_OPTIONS = [1, 2, 3, 4, 5, 6];

/* ─── Chip Button ─── */

function ChipButton({
  label,
  selected,
  onPress,
  colors,
  styles,
  minWidth,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  minWidth?: number;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Box
        style={[
          styles.chip,
          selected && { backgroundColor: colors.primary, borderColor: colors.primary },
          minWidth != null && { minWidth },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            selected && { color: colors.white },
          ]}
        >
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}

/* ─── Compact Course Row ─── */

function CompactCourseRow({
  course,
  index,
  colors,
  styles,
  onEdit,
  onDelete,
  canDelete,
}: {
  course: Course;
  index: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onEdit: () => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}) {
  const isIncomplete = course.creditHours == null || course.grade == null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: index * 60 }}
    >
      <Pressable onPress={onEdit}>
        <Box style={[styles.compactRow, isIncomplete && styles.compactRowIncomplete]}>
          <Box style={styles.compactRowInner}>
            {/* RTL: first = RIGHT → course name */}
            <Box style={styles.compactInfo}>
              <Text bold style={styles.compactLabel}>مادة {index + 1}</Text>
              {course.name !== '' && (
                <Text style={styles.compactName} numberOfLines={1}>{course.name}</Text>
              )}
            </Box>

            {/* Middle: grade + hours badges */}
            <Box style={styles.compactBadges}>
              <Box style={[styles.badge, course.grade != null && styles.badgeFilled]}>
                <Text style={[styles.badgeText, course.grade != null && styles.badgeTextFilled]}>
                  {course.grade ?? 'التقدير'}
                </Text>
              </Box>
              <Box style={[styles.badge, course.creditHours != null && styles.badgeFilled]}>
                <Text style={[styles.badgeText, course.creditHours != null && styles.badgeTextFilled]}>
                  {course.creditHours != null ? `${course.creditHours} س` : 'س'}
                </Text>
              </Box>
            </Box>

            {/* RTL: last = LEFT → actions (delete=red, edit=primary) */}
            <Box style={styles.compactActions}>
              {canDelete && (
                <Pressable
                  onPress={(e) => {
                    (e as any)?.stopPropagation?.();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDelete(course.id);
                  }}
                  style={styles.compactIconBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </Pressable>
              )}
              <Pressable
                onPress={(e) => {
                  (e as any)?.stopPropagation?.();
                  onEdit();
                }}
                style={styles.compactIconBtn}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </Pressable>
            </Box>
          </Box>
        </Box>
      </Pressable>
    </MotiView>
  );
}

/* ─── Edit Course Modal ─── */

function EditCourseModal({
  visible,
  course,
  courseIndex,
  colors,
  styles,
  grades,
  onUpdate,
  onClose,
}: {
  visible: boolean;
  course: Course | null;
  courseIndex: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  grades: { label: string; points: number }[];
  onUpdate: (id: string, updates: Partial<Course>) => void;
  onClose: () => void;
}) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 768;

  if (!course) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={[styles.modalOverlay, isWide && { justifyContent: 'center', alignItems: 'center' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalKeyboardView, isWide && { justifyContent: 'center', alignItems: 'center' }]}
        >
          <Pressable>
            <MotiView
              from={{ opacity: 0, translateY: isWide ? 0 : 40, scale: isWide ? 0.95 : 1 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 160 }}
            >
              <Box style={[
                styles.modalContent,
                { maxHeight: screenHeight * 0.75 },
                isWide && { borderRadius: 20, maxWidth: Math.min(screenWidth * 0.7, 500), width: Math.min(screenWidth * 0.7, 500) },
              ]}>
                {/* Header */}
                <HStack style={styles.modalHeader}>
                  <Text bold style={styles.modalTitle}>مادة {courseIndex + 1}</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onClose();
                    }}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="checkmark" size={22} color={colors.white} />
                  </Pressable>
                </HStack>

                {/* Course name */}
                <TextInput
                  style={[styles.nameInput, { fontFamily: fonts.regular }]}
                  placeholder="اسم المادة (اختياري)"
                  placeholderTextColor={colors.textSecondary}
                  value={course.name}
                  onChangeText={(text) => onUpdate(course.id, { name: text })}
                  textAlign="right"
                />

                {/* Credit hours */}
                <Text style={styles.fieldLabel}>الساعات</Text>
                <HStack style={styles.chipsRow}>
                  {CREDIT_OPTIONS.map((h) => (
                    <ChipButton
                      key={h}
                      label={String(h)}
                      selected={course.creditHours === h}
                      onPress={() => onUpdate(course.id, { creditHours: h })}
                      colors={colors}
                      styles={styles}
                      minWidth={40}
                    />
                  ))}
                </HStack>

                {/* Grade */}
                <Text style={styles.fieldLabel}>التقدير</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.gradeScrollContent}
                >
                  {grades.map((g) => (
                    <ChipButton
                      key={g.label}
                      label={g.label}
                      selected={course.grade === g.label}
                      onPress={() => onUpdate(course.id, { grade: g.label })}
                      colors={colors}
                      styles={styles}
                    />
                  ))}
                </ScrollView>

                {/* Done button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onClose();
                  }}
                >
                  <Box style={styles.doneButton}>
                    <Text bold style={styles.doneButtonText}>تم</Text>
                  </Box>
                </Pressable>
              </Box>
            </MotiView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/* ─── Main Screen ─── */

export default function GPACalculatorScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const calcType = (route.params?.type as 'semester' | 'cumulative') ?? 'semester';
  const { gpaScale } = useSettings();
  const scaleConfig = GPA_SCALES[gpaScale];
  const grades = scaleConfig.grades;

  const { addSemester, updateSemester, cumulativeGpa: savedCumulativeGpa, totalCredits: savedTotalCredits, semesters } = useSemesters();

  const [courses, setCourses] = useState<Course[]>(() => [newCourse(), newCourse()]);
  const [prevGpa, setPrevGpa] = useState(() =>
    semesters.length > 0 ? savedCumulativeGpa.toFixed(2) : '',
  );
  const [prevHours, setPrevHours] = useState(() =>
    semesters.length > 0 ? String(savedTotalCredits) : '',
  );
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedSemesterId, setSavedSemesterId] = useState<string | null>(null);
  const [saveLabelInput, setSaveLabelInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [template, setTemplate] = useState<{ name: string; creditHours: number }[] | null>(null);

  /* ─── Reset grades when GPA scale changes ─── */
  useEffect(() => {
    setCourses((prev) =>
      prev.map((c) => ({ ...c, grade: null }))
    );
    setSaved(false);
    setSavedSemesterId(null);
  }, [gpaScale]);

  /* ─── Load template from AsyncStorage on mount ─── */
  useEffect(() => {
    AsyncStorage.getItem('course_template').then((raw) => {
      if (raw) {
        try { setTemplate(JSON.parse(raw)); } catch (e) {
          if (__DEV__) console.warn('[GPACalculator] Failed to parse template:', e);
        }
      }
    });
  }, []);

  const editingCourse = editingCourseId != null ? courses.find((c) => c.id === editingCourseId) ?? null : null;
  const editingIndex = editingCourseId != null ? courses.findIndex((c) => c.id === editingCourseId) : -1;

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    setSaved(false);
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setSaved(false);
  }, []);

  const addCourse = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCourses((prev) => [...prev, newCourse()]);
    setSaved(false);
  }, []);

  /* ─── Template helpers ─── */

  const coursesHaveData = courses.some((c) => c.name !== '' || c.creditHours != null);
  const coursesAreEmpty = courses.every((c) => c.name === '' && c.creditHours == null && c.grade == null);

  const saveTemplate = useCallback(() => {
    const entries = courses
      .filter((c) => c.name !== '' || c.creditHours != null)
      .map((c) => ({ name: c.name, creditHours: c.creditHours ?? 0 }));
    if (entries.length === 0) return;
    const json = JSON.stringify(entries);
    AsyncStorage.setItem('course_template', json);
    setTemplate(entries);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [courses]);

  const loadTemplate = useCallback(() => {
    if (!template) return;
    const mapped: Course[] = template.map((t) => ({
      id: String(++courseCounter),
      name: t.name,
      creditHours: t.creditHours,
      grade: null,
    }));
    setCourses(mapped);
    setSaved(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [template]);

  const handleTemplateButton = useCallback(() => {
    if (coursesAreEmpty && template) {
      loadTemplate();
    } else if (coursesHaveData && !template) {
      saveTemplate();
    } else if (coursesHaveData && template) {
      Alert.alert('القالب', 'اختر إجراء', [
        { text: 'تعبئة من القالب', onPress: loadTemplate },
        { text: 'حفظ كقالب', onPress: saveTemplate },
        { text: 'إلغاء', style: 'cancel' },
      ]);
    }
  }, [coursesAreEmpty, coursesHaveData, template, loadTemplate, saveTemplate]);

  /* ─── GPA Calculation ─── */

  const gpaResult = useMemo(() => {
    const validCourses = courses.filter((c) => c.creditHours != null && c.grade != null);
    if (validCourses.length === 0) return null;

    let totalPoints = 0;
    let totalHours = 0;

    for (const c of validCourses) {
      const gradeData = grades.find((g) => g.label === c.grade);
      if (!gradeData) continue;
      totalPoints += gradeData.points * c.creditHours!;
      totalHours += c.creditHours!;
    }

    if (totalHours === 0) return null;

    const semesterGpa = totalPoints / totalHours;

    if (calcType === 'cumulative') {
      const pGpa = parseFloat(prevGpa);
      const pHours = parseFloat(prevHours);
      if (!isNaN(pGpa) && !isNaN(pHours) && pHours > 0) {
        const cumulative = (pGpa * pHours + semesterGpa * totalHours) / (pHours + totalHours);
        return cumulative;
      }
      // If cumulative fields not filled, show semester GPA as preview
      return semesterGpa;
    }

    return semesterGpa;
  }, [courses, grades, calcType, prevGpa, prevHours]);

  /* ─── Classification ─── */

  const classification = useMemo(() => {
    if (gpaResult == null) return null;
    for (const g of grades) {
      if (gpaResult >= g.min && gpaResult <= g.max) return g.ar;
    }
    // Edge case: if gpaResult equals scale max exactly
    if (gpaResult >= grades[0].min) return grades[0].ar;
    return grades[grades.length - 1].ar;
  }, [gpaResult, grades]);

  /* ─── Result color tint ─── */

  const resultTint = useMemo(() => {
    if (gpaResult == null) return colors.primaryLight;
    const ratio = gpaResult / scaleConfig.max;
    if (ratio >= 0.8) return colors.success + '15';
    if (ratio >= 0.5) return colors.warning + '15';
    return colors.error + '15';
  }, [gpaResult, scaleConfig.max, colors]);

  const screenTitle = calcType === 'cumulative' ? 'حاسبة المعدل التراكمي' : 'حاسبة المعدل الفصلي';

  return (
    <ScreenLayout>
      <ScreenHeader title={screenTitle} onBack={() => navigation.goBack()}>
        <Pressable onPress={handleTemplateButton}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.background,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: (!coursesHaveData && !template) ? 0.3 : 1,
            }}
          >
            <Ionicons
              name={template && coursesAreEmpty ? 'download-outline' : 'bookmark-outline'}
              size={20}
              color={colors.text}
            />
          </View>
        </Pressable>
      </ScreenHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Result card */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        >
          <Box style={[styles.resultCard, { backgroundColor: resultTint }]}>
            <Text style={styles.resultLabel}>المعدل</Text>
            <Text bold style={styles.resultGpa}>
              {gpaResult != null ? gpaResult.toFixed(2) : '--'}
            </Text>
            <Text style={styles.resultClassification}>
              {classification ?? 'أدخل المواد لحساب المعدل'}
            </Text>
          </Box>
        </MotiView>

        {/* Save semester button */}
        {gpaResult != null && calcType === 'semester' && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 100 }}
          >
            {saved ? (
              <Box style={styles.savedButton}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text bold style={[styles.savedButtonText, { color: colors.success }]}>تم الحفظ</Text>
              </Box>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSaveModal(true);
                }}
              >
                <Box style={styles.saveButton}>
                  <Ionicons name="save-outline" size={18} color={colors.white} />
                  <Text bold style={styles.saveButtonText}>حفظ الفصل</Text>
                </Box>
              </Pressable>
            )}
          </MotiView>
        )}

        {/* Cumulative section */}
        {calcType === 'cumulative' && (
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 50 }}
          >
            <Box style={styles.cumulativeCard}>
              <Text bold style={styles.cumulativeTitle}>البيانات السابقة</Text>
              <HStack style={styles.cumulativeRow}>
                <Box style={styles.cumulativeInputWrap}>
                  <Text style={styles.cumulativeLabel}>المعدل السابق</Text>
                  <TextInput
                    style={styles.cumulativeInput}
                    placeholder={`0.00`}
                    placeholderTextColor={colors.textSecondary}
                    value={prevGpa}
                    onChangeText={(v) => { setPrevGpa(v); setSaved(false); }}
                    keyboardType="decimal-pad"
                    textAlign="center"
                  />
                </Box>
                <Box style={styles.cumulativeInputWrap}>
                  <Text style={styles.cumulativeLabel}>الساعات السابقة</Text>
                  <TextInput
                    style={styles.cumulativeInput}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={prevHours}
                    onChangeText={(v) => { setPrevHours(v); setSaved(false); }}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                </Box>
              </HStack>
            </Box>
          </MotiView>
        )}

        {/* Course list */}
        <Box style={styles.courseListCard}>
          {courses.map((course, index) => (
            <CompactCourseRow
              key={course.id}
              course={course}
              index={index}
              colors={colors}
              styles={styles}
              onEdit={() => setEditingCourseId(course.id)}
              onDelete={deleteCourse}
              canDelete={courses.length > 1}
            />
          ))}
        </Box>

        {/* Add course button */}
        <Pressable onPress={addCourse}>
          <Box style={styles.addButton}>
            <Text style={styles.addButtonText}>+ أضف مادة</Text>
          </Box>
        </Pressable>
      </ScrollView>

      {/* Save semester modal */}
      <Modal visible={showSaveModal} transparent animationType="fade" onRequestClose={() => setShowSaveModal(false)}>
        <Pressable onPress={() => setShowSaveModal(false)} style={styles.modalOverlay}>
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
                  <Text bold style={styles.modalTitle}>{savedSemesterId ? 'تعديل الفصل' : 'حفظ الفصل'}</Text>
                  <TextInput
                    style={[styles.nameInput, { fontFamily: fonts.regular }]}
                    placeholder="مثال: الفصل الأول 2025"
                    placeholderTextColor={colors.textSecondary}
                    value={saveLabelInput}
                    onChangeText={setSaveLabelInput}
                    textAlign="right"
                    autoFocus
                  />
                  <Pressable
                    onPress={() => {
                      if (gpaResult == null) return;
                      const validCourses = courses.filter((c) => c.creditHours != null && c.grade != null);
                      let totalHours = 0;
                      for (const c of validCourses) {
                        totalHours += c.creditHours!;
                      }
                      const label = saveLabelInput.trim() || `فصل ${new Date().getFullYear()}`;
                      const semesterData = {
                        label,
                        gpa: gpaResult,
                        creditHours: totalHours,
                        gpaScale,
                        courses: validCourses.map((c) => ({
                          name: c.name,
                          creditHours: c.creditHours!,
                          grade: c.grade!,
                        })),
                      };
                      if (savedSemesterId) {
                        updateSemester(savedSemesterId, semesterData);
                      } else {
                        const newId = addSemester(semesterData);
                        setSavedSemesterId(newId);
                      }
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setSaved(true);
                      setShowSaveModal(false);
                      setSaveLabelInput('');
                    }}
                  >
                    <Box style={styles.doneButton}>
                      <Text bold style={styles.doneButtonText}>حفظ</Text>
                    </Box>
                  </Pressable>
                </Box>
              </MotiView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit modal */}
      <EditCourseModal
        visible={editingCourseId != null}
        course={editingCourse}
        courseIndex={editingIndex}
        colors={colors}
        styles={styles}
        grades={grades}
        onUpdate={updateCourse}
        onClose={() => setEditingCourseId(null)}
      />
    </ScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    /* Scroll */
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 40,
      gap: spacing.lg,
    },

    /* Result card */
    resultCard: {
      borderRadius: 18,
      padding: spacing['2xl'],
      alignItems: 'center',
      alignSelf: 'stretch',
      ...shadows.sm,
    },
    resultLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    resultGpa: {
      fontSize: 48,
      color: colors.text,
      textAlign: 'center',
    },
    resultClassification: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },

    /* Cumulative card */
    cumulativeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      width: '100%',
      ...shadows.sm,
    },
    cumulativeTitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    cumulativeRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    cumulativeInputWrap: {
      flex: 1,
    },
    cumulativeLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    cumulativeInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },

    /* Course list card */
    courseListCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      width: '100%',
      ...shadows.sm,
    },
    compactRow: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    compactRowIncomplete: {
      borderStartWidth: 3,
      borderStartColor: colors.warning,
    },
    compactRowInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      width: '100%',
    },
    compactInfo: {
      flex: 1,
      alignItems: 'flex-start',
    },
    compactLabel: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'right',
    },
    compactName: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: 2,
    },
    compactBadges: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center',
    },
    badge: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 36,
      alignItems: 'center',
    },
    badgeFilled: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    badgeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: fonts.semibold,
      textAlign: 'center',
    },
    badgeTextFilled: {
      color: colors.primary,
    },
    compactActions: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center',
    },
    compactIconBtn: {
      padding: spacing.xs + 2,
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
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: 18,
      color: colors.text,
      textAlign: 'right',
    },
    modalCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    doneButtonText: {
      fontSize: 16,
      color: colors.white,
    },

    nameInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      textAlign: 'right',
    },
    fieldLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'right',
      marginBottom: spacing.sm,
    },

    /* Chips */
    chipsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexWrap: 'wrap',
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: fonts.semibold,
      textAlign: 'right',
    },
    gradeScrollContent: {
      gap: spacing.sm,
      paddingEnd: spacing.sm,
    },

    /* Save button */
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    saveButtonText: {
      fontSize: 15,
      color: colors.white,
    },
    savedButton: {
      borderRadius: 14,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.success + '15',
      borderWidth: 1,
      borderColor: colors.success + '30',
    },
    savedButtonText: {
      fontSize: 15,
    },

    /* Add button */
    addButton: {
      borderRadius: 14,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontFamily: fonts.semibold,
      textAlign: 'right',
    },
  });
