import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text as RNText,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { ProgressBar } from '../components/common';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { chevronForward, chevronBack } from '../theme/rtl';
import { useCV } from '../context/CVContext';

import { STEPS } from '../data/cvFormConstants';
import PersonalInfoStep from '../components/cv/steps/PersonalInfoStep';
import EducationStep from '../components/cv/steps/EducationStep';
import ExperienceStep from '../components/cv/steps/ExperienceStep';
import ProjectsStep from '../components/cv/steps/ProjectsStep';
import SkillsStep from '../components/cv/steps/SkillsStep';
import SummaryStep from '../components/cv/steps/SummaryStep';
import TemplateStep from '../components/cv/steps/TemplateStep';
import type { CVData } from '../types/cv';

/* ─── Main Screen ─── */

export default function CVFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const cvId: string | null = route.params?.cvId ?? null;
  const {
    currentCvData,
    currentTemplate,
    loadCV,
    updateCurrentData,
    updateCurrentTemplate,
    saveAsComplete,
  } = useCV();

  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load CV on mount
  useEffect(() => {
    if (cvId) {
      loadCV(cvId);
    }
    setReady(true);
  }, [cvId, loadCV]);

  const cvData = currentCvData;
  const template = currentTemplate;

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleDataChange = useCallback((data: CVData) => {
    updateCurrentData(data);
  }, [updateCurrentData]);

  const goNext = useCallback(() => {
    if (isLast) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveAsComplete();
      navigation.navigate('CVPreview', { cvId });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
  }, [isLast, cvId, saveAsComplete, navigation]);

  const goBack = useCallback(() => {
    if (isFirst) {
      navigation.goBack();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s - 1);
  }, [isFirst, navigation]);

  if (!ready || !cvData) {
    return (
      <ScreenLayout>
        <ScreenHeader title="السيرة الذاتية" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0: return <PersonalInfoStep data={cvData} onChange={handleDataChange} />;
      case 1: return <EducationStep data={cvData} onChange={handleDataChange} />;
      case 2: return <ExperienceStep data={cvData} onChange={handleDataChange} />;
      case 3: return <ProjectsStep data={cvData} onChange={handleDataChange} />;
      case 4: return <SkillsStep data={cvData} onChange={handleDataChange} scrollViewRef={scrollViewRef} />;
      case 5: return <SummaryStep data={cvData} onChange={handleDataChange} />;
      case 6: return <TemplateStep selected={template} onSelect={updateCurrentTemplate} />;
      default: return null;
    }
  };

  return (
    <ScreenLayout>
      <ScreenHeader
        title={STEPS[step].title}
        onBack={goBack}
      />

      <ProgressBar current={step} total={STEPS.length} />

      {/* English-only note */}
      {step === 0 && (
        <View style={s.englishNote}>
          <Ionicons name="language-outline" size={16} color={colors.primary} />
          <RNText style={s.englishNoteText}>محتوى السيرة الذاتية يُكتب بالإنجليزية فقط</RNText>
        </View>
      )}

      {/* Step indicator chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.stepsScroll} contentContainerStyle={s.stepsScrollContent}>
        {STEPS.map((st, i) => (
          <Pressable
            key={st.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(i);
            }}
          >
            <View style={[s.stepChip, i === step && s.stepChipActive, i < step && s.stepChipDone]}>
              <Ionicons
                name={i < step ? 'checkmark' : (st.icon as any)}
                size={14}
                color={i === step ? colors.white : i < step ? colors.success : colors.textSecondary}
              />
              <RNText style={[s.stepChipText, i === step && s.stepChipTextActive]}>
                {st.title}
              </RNText>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <AnimatedView
            key={step}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            {renderStep()}
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <Pressable onPress={goBack}>
          <View style={s.navBtnSecondary}>
            <Ionicons name={chevronBack as any} size={18} color={colors.primary} />
            <RNText style={s.navBtnSecondaryText}>{isFirst ? 'إلغاء' : 'رجوع'}</RNText>
          </View>
        </Pressable>
        <Pressable onPress={goNext}>
          <View style={s.navBtnPrimary}>
            <RNText style={s.navBtnPrimaryText}>{isLast ? 'معاينة' : 'التالي'}</RNText>
            <Ionicons name={isLast ? 'eye' : (chevronForward as any)} size={18} color={colors.white} />
          </View>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

/* ─── Styles ─── */

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 350,
    },

    /* English note */
    englishNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
    },
    englishNoteText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.primary,
      writingDirection: 'rtl',
    },

    /* Steps scroll */
    stepsScroll: {
      maxHeight: 44,
    },
    stepsScrollContent: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
      alignItems: 'center',
    },
    stepChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    stepChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    stepChipDone: {
      borderColor: colors.success,
      backgroundColor: colors.success + '15',
    },
    stepChipText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
    stepChipTextActive: {
      color: colors.white,
    },

    /* Bottom nav */
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      gap: spacing.md,
    },
    navBtnSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      gap: 4,
    },
    navBtnSecondaryText: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },
    navBtnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      gap: 6,
      ...shadows.sm,
    },
    navBtnPrimaryText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.white,
      writingDirection: 'rtl',
    },
  });
