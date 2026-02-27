import { useState, useMemo } from 'react';
import { StyleSheet, View, Text as RNText, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../utils/haptics';
import { Field } from '../../common';
import MonthYearPicker from '../../MonthYearPicker';
import { Pressable } from '../../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../../theme';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/fonts';
import { createSharedStepStyles } from './sharedStyles';
import { nextId } from '../../../data/cvFormConstants';
import useAIGeneration from '../../../hooks/useAIGeneration';
import type { CVData, CVExperience } from '../../../types/cv';

type Props = {
  data: CVData;
  onChange: (d: CVData) => void;
};

export default function ExperienceStep({ data, onChange }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => ({ ...createSharedStepStyles(colors), ...createStyles(colors) }), [colors]);
  const exps = data.experiences;
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const { generate } = useAIGeneration({ feature: 'description' });

  const updateExp = (id: string, key: keyof CVExperience, val: string) => {
    onChange({ ...data, experiences: exps.map((ex) => (ex.id === id ? { ...ex, [key]: val } : ex)) });
  };

  const addExp = () => {
    onChange({
      ...data,
      experiences: [...exps, { id: nextId(), jobTitle: '', company: '', startDate: '', endDate: '', description: '' }],
    });
  };

  const removeExp = (id: string) => {
    onChange({ ...data, experiences: exps.filter((e) => e.id !== id) });
  };

  const generateDescription = async (exp: CVExperience) => {
    if (!exp.jobTitle.trim() || !exp.company.trim() || !exp.startDate.trim()) {
      Alert.alert('تنبيه', 'يرجى تعبئة المسمى الوظيفي والشركة والتاريخ أولاً');
      return;
    }

    setAiLoadingId(exp.id);
    updateExp(exp.id, 'description', '');

    const duration = `${exp.startDate} to ${exp.endDate || 'Present'}`;
    const major = data.education?.major || '';
    const skills = [...(data.skills?.technical || []), ...(data.skills?.soft || [])];
    const currentDescription = exp.description.trim();

    const prompt = `Generate 3 CV bullet points (each 15-35 words, starting with action verb, format: "• text").

Position: ${exp.jobTitle}
Company: ${exp.company}
Duration: ${duration}
${major ? `Major: ${major}` : ''}
${skills.length > 0 ? `Skills: ${skills.join(', ')}` : ''}
${currentDescription ? `Current: ${currentDescription}` : ''}`;

    const raw = await generate(prompt);
    if (raw) {
      const cleaned = raw
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => {
          const stripped = line.replace(/^[\•\-\*\–\—]\s*/, '').trim();
          return stripped ? `• ${stripped}` : '';
        })
        .filter((line: string) => line.length > 0)
        .slice(0, 3)
        .join('\n');
      updateExp(exp.id, 'description', cleaned);
    } else {
      const fallback = `• Supported ${exp.company} operations as ${exp.jobTitle}\n• Collaborated with team members on key projects\n• Applied ${skills.length > 0 ? skills.slice(0, 2).join(' and ') : 'relevant skills'} in daily tasks`;
      updateExp(exp.id, 'description', fallback);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setAiLoadingId(null);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {exps.length === 0 ? (
        <View style={s.emptyStateBlock}>
          <Ionicons name="briefcase-outline" size={36} color={colors.textSecondary} />
          <RNText style={s.emptyHint}>لا توجد خبرات - يمكنك التخطي</RNText>
        </View>
      ) : (
        exps.map((exp, i) => (
          <View key={exp.id} style={s.experienceBlock}>
            <View style={s.expHeader}>
              <RNText style={s.expNumber}>خبرة {i + 1}</RNText>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); removeExp(exp.id); }}>
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </Pressable>
            </View>
            <Field label="المسمى الوظيفي" value={exp.jobTitle} onChangeText={(v) => updateExp(exp.id, 'jobTitle', v)} placeholder="Job Title" />
            <Field label="الشركة" value={exp.company} onChangeText={(v) => updateExp(exp.id, 'company', v)} placeholder="Company" />
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <MonthYearPicker label="تاريخ البداية" value={exp.startDate} onSelect={(v) => updateExp(exp.id, 'startDate', v)} colors={colors} />
              </View>
              <View style={{ flex: 1 }}>
                <MonthYearPicker label="تاريخ النهاية" value={exp.endDate} onSelect={(v) => updateExp(exp.id, 'endDate', v)} colors={colors} allowPresent />
              </View>
            </View>

            <View style={s.fieldWrap}>
              <RNText style={s.fieldLabel}>الوصف</RNText>
              <Pressable onPress={aiLoadingId === exp.id ? undefined : () => generateDescription(exp)} disabled={aiLoadingId === exp.id}>
                <View style={[s.aiDescBtn, aiLoadingId === exp.id && s.aiDescBtnLoading]}>
                  {aiLoadingId === exp.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <RNText style={s.aiDescIcon}>🤖</RNText>
                  )}
                  <RNText style={s.aiDescText}>
                    {aiLoadingId === exp.id ? 'جاري الكتابة...' : exp.description.trim() ? 'أعد الكتابة' : 'اكتب بالذكاء الاصطناعي'}
                  </RNText>
                </View>
              </Pressable>
              <TextInput
                style={[s.fieldInput, s.fieldInputMultiline]}
                value={exp.description}
                onChangeText={(v) => updateExp(exp.id, 'description', v)}
                placeholder={"Describe your tasks here or tap the button to auto-generate...\n\nExample:\n- Provided technical support for users\n- Configured hardware and software\n- Resolved customer issues"}
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlign="left"
              />
            </View>
          </View>
        ))
      )}

      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); addExp(); }}>
        <View style={s.addBtn}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <RNText style={s.addBtnText}>إضافة خبرة أخرى</RNText>
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
  });
