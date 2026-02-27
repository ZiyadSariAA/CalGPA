import { useState, useMemo } from 'react';
import { StyleSheet, View, Text as RNText, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../utils/haptics';
import { Field } from '../../common';
import { Pressable } from '../../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../../theme';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/fonts';
import { createSharedStepStyles } from './sharedStyles';
import { nextId } from '../../../data/cvFormConstants';
import useAIGeneration from '../../../hooks/useAIGeneration';
import type { CVData, CVProject } from '../../../types/cv';

type Props = {
  data: CVData;
  onChange: (d: CVData) => void;
};

export default function ProjectsStep({ data, onChange }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => ({ ...createSharedStepStyles(colors), ...createStyles(colors) }), [colors]);
  const projects = data.projects;
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const { generate } = useAIGeneration({ feature: 'projectDescription' });

  const updateProject = (id: string, key: keyof CVProject, val: string) => {
    onChange({ ...data, projects: projects.map((p) => (p.id === id ? { ...p, [key]: val } : p)) });
  };

  const addProject = () => {
    onChange({ ...data, projects: [...projects, { id: nextId(), name: '', description: '', technologies: '', link: '' }] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeProject = (id: string) => {
    onChange({ ...data, projects: projects.filter((p) => p.id !== id) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const generateProjectDescription = async (proj: CVProject) => {
    if (!proj.name.trim() || !proj.technologies.trim()) {
      Alert.alert('تنبيه', 'يرجى تعبئة اسم المشروع والتقنيات أولاً');
      return;
    }

    setAiLoadingId(proj.id);
    updateProject(proj.id, 'description', '');

    const major = data.education?.major || '';
    const skills = [...(data.skills?.technical || []), ...(data.skills?.soft || [])];
    const currentDescription = proj.description.trim();

    const prompt = `Write a 2-3 sentence project description (20-50 words, no bullets, start with action verb, mention technologies).

Project: ${proj.name}
Technologies: ${proj.technologies}
${major ? `Major: ${major}` : ''}
${currentDescription ? `Current: ${currentDescription}` : ''}`;

    const raw = await generate(prompt);
    if (raw) {
      updateProject(proj.id, 'description', raw);
    } else {
      const fallback = `Developed ${proj.name} using ${proj.technologies || 'relevant technologies'}. ${skills.length > 0 ? `Applied ${skills.slice(0, 2).join(' and ')} skills.` : 'Focused on delivering a functional and well-structured solution.'}`;
      updateProject(proj.id, 'description', fallback);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setAiLoadingId(null);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {projects.length === 0 ? (
        <View style={s.emptyStateBlock}>
          <Ionicons name="rocket-outline" size={36} color={colors.textSecondary} />
          <RNText style={s.emptyHint}>لا توجد مشاريع - يمكنك التخطي</RNText>
        </View>
      ) : (
        projects.map((proj, i) => (
          <View key={proj.id} style={s.experienceBlock}>
            <View style={s.expHeader}>
              <RNText style={s.expNumber}>مشروع {i + 1}</RNText>
              <Pressable onPress={() => removeProject(proj.id)}>
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </Pressable>
            </View>
            <Field label="اسم المشروع" value={proj.name} onChangeText={(v) => updateProject(proj.id, 'name', v)} placeholder="Project Name" />
            <Field label="التقنيات المستخدمة" value={proj.technologies} onChangeText={(v) => updateProject(proj.id, 'technologies', v)} placeholder="React, Node.js, Python..." />

            <View style={s.fieldWrap}>
              <RNText style={s.fieldLabel}>الوصف</RNText>
              <Pressable onPress={aiLoadingId === proj.id ? undefined : () => generateProjectDescription(proj)} disabled={aiLoadingId === proj.id}>
                <View style={[s.aiDescBtn, aiLoadingId === proj.id && s.aiDescBtnLoading]}>
                  {aiLoadingId === proj.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <RNText style={s.aiDescIcon}>🤖</RNText>
                  )}
                  <RNText style={s.aiDescText}>
                    {aiLoadingId === proj.id ? 'جاري الكتابة...' : proj.description.trim() ? 'أعد الكتابة' : 'اكتب بالذكاء الاصطناعي'}
                  </RNText>
                </View>
              </Pressable>
              <TextInput
                style={[s.fieldInput, s.fieldInputMultiline]}
                value={proj.description}
                onChangeText={(v) => updateProject(proj.id, 'description', v)}
                placeholder={"Describe your project here or tap the button to auto-generate...\n\nExample:\nBuilt a mobile app using React Native and Firebase that helps students calculate their GPA."}
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlign="left"
              />
            </View>

            <Field label="الرابط (اختياري)" value={proj.link} onChangeText={(v) => updateProject(proj.id, 'link', v)} placeholder="github.com/..." />
          </View>
        ))
      )}

      <Pressable onPress={addProject}>
        <View style={s.addBtn}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <RNText style={s.addBtnText}>إضافة مشروع</RNText>
        </View>
      </Pressable>
    </View>
  );
}

// All styles come from shared — no local overrides needed
const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({});
