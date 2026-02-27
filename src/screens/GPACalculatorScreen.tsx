import { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, View, Text as RNText, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import CompactCourseRow from '../components/gpa/CompactCourseRow';
import EditCourseModal from '../components/gpa/EditCourseModal';
import SaveSemesterModal from '../components/gpa/SaveSemesterModal';
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

function generateCourseId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function newCourse(): Course {
  return { id: generateCourseId(), name: '', creditHours: null, grade: null };
}

/* ─── Main Screen ─── */

export default function GPACalculatorScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
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
      id: generateCourseId(),
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
        <AnimatedView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        >
          <View style={[styles.resultCard, { backgroundColor: resultTint }]}>
            <RNText style={styles.resultLabel}>المعدل</RNText>
            <RNText style={styles.resultGpa}>
              {gpaResult != null ? gpaResult.toFixed(2) : '--'}
            </RNText>
            <RNText style={styles.resultClassification}>
              {classification ?? 'أدخل المواد لحساب المعدل'}
            </RNText>
          </View>
        </AnimatedView>

        {/* Save semester button */}
        {gpaResult != null && calcType === 'semester' && (
          <AnimatedView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 100 }}
          >
            {saved ? (
              <View style={styles.savedButton}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <RNText style={[styles.savedButtonText, { color: colors.success }]}>تم الحفظ</RNText>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSaveModal(true);
                }}
              >
                <View style={styles.saveButton}>
                  <Ionicons name="save-outline" size={18} color={colors.white} />
                  <RNText style={styles.saveButtonText}>حفظ الفصل</RNText>
                </View>
              </Pressable>
            )}
          </AnimatedView>
        )}

        {/* Cumulative section */}
        {calcType === 'cumulative' && (
          <AnimatedView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 50 }}
          >
            <View style={styles.cumulativeCard}>
              <RNText style={styles.cumulativeTitle}>البيانات السابقة</RNText>
              <View style={styles.cumulativeRow}>
                <View style={styles.cumulativeInputWrap}>
                  <RNText style={styles.cumulativeLabel}>المعدل السابق</RNText>
                  <TextInput
                    style={styles.cumulativeInput}
                    placeholder={`0.00`}
                    placeholderTextColor={colors.textSecondary}
                    value={prevGpa}
                    onChangeText={(v) => { setPrevGpa(v); setSaved(false); }}
                    keyboardType="decimal-pad"
                    textAlign="center"
                  />
                </View>
                <View style={styles.cumulativeInputWrap}>
                  <RNText style={styles.cumulativeLabel}>الساعات السابقة</RNText>
                  <TextInput
                    style={styles.cumulativeInput}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={prevHours}
                    onChangeText={(v) => { setPrevHours(v); setSaved(false); }}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                </View>
              </View>
            </View>
          </AnimatedView>
        )}

        {/* Course list */}
        <View style={styles.courseListCard}>
          {courses.map((course, index) => (
            <CompactCourseRow
              key={course.id}
              course={course}
              index={index}
              onEdit={() => setEditingCourseId(course.id)}
              onDelete={deleteCourse}
              canDelete={courses.length > 1}
            />
          ))}
        </View>

        {/* Add course button */}
        <Pressable onPress={addCourse}>
          <View style={styles.addButton}>
            <RNText style={styles.addButtonText}>+ أضف مادة</RNText>
          </View>
        </Pressable>
      </ScrollView>

      {/* Save semester modal */}
      <SaveSemesterModal
        visible={showSaveModal}
        title={savedSemesterId ? 'تعديل الفصل' : 'حفظ الفصل'}
        labelValue={saveLabelInput}
        onLabelChange={setSaveLabelInput}
        onSave={() => {
          if (gpaResult == null) return;
          const validCourses = courses.filter((c) => c.creditHours != null && c.grade != null);
          let totalHours = 0;
          for (const c of validCourses) totalHours += c.creditHours!;
          const label = saveLabelInput.trim() || `فصل ${new Date().getFullYear()}`;
          const semesterData = {
            label, gpa: gpaResult, creditHours: totalHours, gpaScale,
            courses: validCourses.map((c) => ({ name: c.name, creditHours: c.creditHours!, grade: c.grade! })),
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
        onClose={() => setShowSaveModal(false)}
      />

      {/* Edit modal */}
      <EditCourseModal
        visible={editingCourseId != null}
        course={editingCourse}
        courseIndex={editingIndex}
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
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    resultGpa: {
      fontSize: 48,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'center',
    },
    resultClassification: {
      fontSize: 16,
      fontFamily: fonts.regular,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.regular,
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
      fontFamily: fonts.regular,
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
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
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
