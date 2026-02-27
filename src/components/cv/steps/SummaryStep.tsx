import { useState, useMemo } from 'react';
import { StyleSheet, View, Text as RNText, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../../AnimatedView';
import * as Haptics from '../../../utils/haptics';
import { Field } from '../../common';
import MonthYearPicker from '../../MonthYearPicker';
import { Pressable } from '../../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../../theme';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/fonts';
import { shadows } from '../../../theme/shadows';
import { createSharedStepStyles } from './sharedStyles';
import { nextId } from '../../../data/cvFormConstants';
import useAIGeneration from '../../../hooks/useAIGeneration';
import type { CVData, CVCertification } from '../../../types/cv';

type Props = {
  data: CVData;
  onChange: (d: CVData) => void;
};

export default function SummaryStep({ data, onChange }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => ({ ...createSharedStepStyles(colors), ...createStyles(colors) }), [colors]);
  const [aiError, setAiError] = useState(false);
  const { generate, loading: aiLoading } = useAIGeneration({ feature: 'summary' });
  const certs = data.certifications;

  const updateCert = (id: string, key: keyof CVCertification, val: string) => {
    onChange({ ...data, certifications: certs.map((c) => (c.id === id ? { ...c, [key]: val } : c)) });
  };

  const addCert = () => {
    onChange({ ...data, certifications: [...certs, { id: nextId(), name: '', issuer: '', date: '' }] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeCert = (id: string) => {
    onChange({ ...data, certifications: certs.filter((c) => c.id !== id) });
  };

  const generateSummary = async () => {
    setAiError(false);
    const { personalInfo, education, experiences, skills } = data;
    const allSkills = [...skills.technical, ...skills.soft];
    const expText = experiences.filter((e) => e.jobTitle || e.company).map((e) => `${e.jobTitle} at ${e.company}${e.description ? ': ' + e.description : ''}`).join('; ');

    const prompt = `Write a 2-3 sentence professional summary for ATS.

Name: ${personalInfo.fullName}
Education: ${education.degree} in ${education.major}, ${education.university}
Skills: ${allSkills.length > 0 ? allSkills.join(', ') : 'None listed'}
Experience: ${expText || 'Fresh graduate'}`;

    const raw = await generate(prompt);
    if (raw) {
      onChange({ ...data, summary: raw });
    } else {
      // Offline fallback
      const major = education.major || 'the relevant field';
      const degree = education.degree || 'degree';
      const skillsPart = allSkills.length > 0 ? ` with skills in ${allSkills.slice(0, 3).join(', ')}` : '';
      const fallback = experiences.length > 0
        ? `${degree} graduate in ${major}${skillsPart}. ${experiences[0].jobTitle ? `Has experience as ${experiences[0].jobTitle}${experiences[0].company ? ` at ${experiences[0].company}` : ''}.` : ''} Seeking to apply knowledge and skills in a professional setting.`
        : `Recent ${degree} graduate in ${major}${skillsPart}. Seeking an opportunity to apply academic knowledge and grow professionally.`;
      onChange({ ...data, summary: fallback });
      setAiError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <RNText style={s.sectionLabel}>الملخص المهني</RNText>

      <Pressable onPress={aiLoading ? undefined : generateSummary} disabled={aiLoading}>
        <View style={[s.aiSuggestBtn, aiLoading && s.aiSuggestBtnLoading]}>
          {aiLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <RNText style={s.aiSuggestIcon}>🤖</RNText>
          )}
          <RNText style={s.aiSuggestText}>
            {aiLoading ? 'جاري الإنشاء...' : 'اقترح لي ملخص'}
          </RNText>
        </View>
      </Pressable>

      {aiError && (
        <AnimatedView from={{ opacity: 0, translateY: -6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 200 }}>
          <View style={s.aiErrorToast}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <RNText style={s.aiErrorText}>تعذر الاتصال بالذكاء الاصطناعي — تم إنشاء ملخص تلقائي</RNText>
          </View>
        </AnimatedView>
      )}

      <TextInput
        style={[s.fieldInput, s.fieldInputMultiline, { minHeight: 120 }]}
        value={data.summary}
        onChangeText={(v) => onChange({ ...data, summary: v })}
        placeholder="Write a brief professional summary..."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlign="left"
      />

      <RNText style={[s.sectionLabel, { marginTop: spacing['2xl'] }]}>الشهادات (اختياري)</RNText>
      {certs.map((cert, i) => (
        <View key={cert.id} style={s.certBlock}>
          <View style={s.expHeader}>
            <RNText style={s.expNumber}>شهادة {i + 1}</RNText>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); removeCert(cert.id); }}>
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </Pressable>
          </View>
          <Field label="اسم الشهادة" value={cert.name} onChangeText={(v) => updateCert(cert.id, 'name', v)} placeholder="Certificate Name" />
          <Field label="الجهة المانحة" value={cert.issuer} onChangeText={(v) => updateCert(cert.id, 'issuer', v)} placeholder="Issuer" />
          <MonthYearPicker label="التاريخ" value={cert.date} onSelect={(v) => updateCert(cert.id, 'date', v)} colors={colors} />
        </View>
      ))}
      <Pressable onPress={addCert}>
        <View style={s.addBtn}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <RNText style={s.addBtnText}>إضافة شهادة</RNText>
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    aiSuggestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.primary, gap: 8, marginBottom: spacing.md, ...shadows.sm },
    aiSuggestBtnLoading: { opacity: 0.7 },
    aiSuggestIcon: { fontSize: 18 },
    aiSuggestText: { fontSize: 14, fontFamily: fonts.bold, color: colors.white, writingDirection: 'rtl' },
    aiErrorToast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.warning + '18', borderWidth: 1, borderColor: colors.warning + '40', marginBottom: spacing.md },
    aiErrorText: { fontSize: 12, fontFamily: fonts.medium, color: colors.warning, writingDirection: 'rtl', flex: 1, textAlign: 'center' },
    certBlock: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  });
