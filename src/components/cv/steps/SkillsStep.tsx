import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../../AnimatedView';
import * as Haptics from '../../../utils/haptics';
import { Pressable } from '../../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../../theme';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/fonts';
import { createSharedStepStyles } from './sharedStyles';
import {
  FIELDS, FIELD_SKILLS, SOFT_SKILLS, COMMON_LANGUAGES, PROFICIENCY_LEVELS, nextId,
  type FieldKey,
} from '../../../data/cvFormConstants';
import useAIGeneration from '../../../hooks/useAIGeneration';
import type { CVData, CVLanguage } from '../../../types/cv';

type Props = {
  data: CVData;
  onChange: (d: CVData) => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
};

export default function SkillsStep({ data, onChange, scrollViewRef }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => ({ ...createSharedStepStyles(colors), ...createStyles(colors) }), [colors]);
  const [skillInput, setSkillInput] = useState('');
  const [selectedField, setSelectedField] = useState<FieldKey | null>(null);
  const [showSoftSkills, setShowSoftSkills] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const { generate, loading: titleLoading } = useAIGeneration({ feature: 'title' });

  const p = data.personalInfo;
  const setPersonal = (key: keyof typeof p, val: string) =>
    onChange({ ...data, personalInfo: { ...p, [key]: val } });

  const suggestTitles = async () => {
    setTitleSuggestions([]);
    const { education, experiences, skills } = data;
    const expTitles = experiences.filter(e => e.jobTitle).map(e => e.jobTitle).join(', ') || 'Fresh graduate';
    const techSkills = skills.technical.join(', ') || 'None listed';

    const prompt = `Suggest 3 realistic job titles (2-4 words each). Return JSON: ["Title 1","Title 2","Title 3"]

Degree: ${education.degree} in ${education.major} (${education.university})
Skills: ${techSkills}
Experience: ${expTitles}`;

    const raw = await generate(prompt);
    if (raw) {
      let parsed: string[] = [];
      try { parsed = JSON.parse(raw); } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) try { parsed = JSON.parse(match[0]); } catch {}
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        setTitleSuggestions(parsed.slice(0, 3));
        return;
      }
    }
    // Offline fallback
    const major = education.major?.toLowerCase() || '';
    if (major.includes('computer') || major.includes('software') || major.includes('it')) {
      setTitleSuggestions(['Software Developer', 'IT Support Specialist', 'Web Developer']);
    } else if (major.includes('business') || major.includes('admin')) {
      setTitleSuggestions(['Business Analyst', 'Project Coordinator', 'Operations Associate']);
    } else if (major.includes('engineer')) {
      setTitleSuggestions(['Junior Engineer', 'Technical Analyst', 'Project Engineer']);
    } else {
      setTitleSuggestions(['Junior Analyst', 'Research Assistant', 'Administrative Coordinator']);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || data.skills.technical.includes(trimmed) || data.skills.soft.includes(trimmed)) return;
    onChange({ ...data, skills: { ...data.skills, technical: [...data.skills.technical, trimmed] } });
    setSkillInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (data.skills.technical.includes(skill)) {
      onChange({ ...data, skills: { ...data.skills, technical: data.skills.technical.filter((s) => s !== skill) } });
    } else if (!data.skills.soft.includes(skill)) {
      onChange({ ...data, skills: { ...data.skills, technical: [...data.skills.technical, skill] } });
    }
  };

  const toggleSoftSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (data.skills.soft.includes(skill)) {
      onChange({ ...data, skills: { ...data.skills, soft: data.skills.soft.filter((s) => s !== skill) } });
    } else if (!data.skills.technical.includes(skill)) {
      onChange({ ...data, skills: { ...data.skills, soft: [...data.skills.soft, skill] } });
    }
  };

  const removeSkill = (skill: string) => {
    onChange({ ...data, skills: { ...data.skills, technical: data.skills.technical.filter((s) => s !== skill) } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateLang = (id: string, key: keyof CVLanguage, val: string) => {
    onChange({ ...data, languages: data.languages.map((l) => (l.id === id ? { ...l, [key]: val } : l)) });
  };

  const addLang = () => {
    onChange({ ...data, languages: [...data.languages, { id: nextId(), language: '', proficiency: 'Intermediate' }] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeLang = (id: string) => {
    onChange({ ...data, languages: data.languages.filter((l) => l.id !== id) });
  };

  const suggestedSkills = selectedField ? FIELD_SKILLS[selectedField] : [];

  return (
    <View style={{ gap: spacing.sm }}>
      {/* العنوان الوظيفي المستهدف */}
      <RNText style={s.sectionLabel}>العنوان الوظيفي المستهدف</RNText>
      <View style={s.fieldWrap}>
        <Pressable onPress={titleLoading ? undefined : suggestTitles} disabled={titleLoading}>
          <View style={[s.aiDescBtn, titleLoading && s.aiDescBtnLoading]}>
            {titleLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RNText style={s.aiDescIcon}>🤖</RNText>
            )}
            <RNText style={s.aiDescText}>
              {titleLoading ? 'جاري الاقتراح...' : 'اقتراحات'}
            </RNText>
          </View>
        </Pressable>
        {titleSuggestions.length > 0 && (
          <AnimatedView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <View style={[s.chipWrap, { marginBottom: spacing.sm }]}>
              {titleSuggestions.map((title) => {
                const active = p.professionalTitle === title;
                return (
                  <Pressable key={title} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPersonal('professionalTitle', title); }}>
                    <View style={[s.suggestChip, active && s.suggestChipAdded]}>
                      <Ionicons name={active ? 'checkmark' : 'add'} size={14} color={active ? colors.white : colors.primary} />
                      <RNText style={[s.suggestChipText, active && s.suggestChipTextAdded]}>{title}</RNText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </AnimatedView>
        )}
        <TextInput
          style={s.fieldInput}
          value={p.professionalTitle || ''}
          onChangeText={(v) => setPersonal('professionalTitle', v)}
          placeholder="e.g. IT Support Specialist"
          placeholderTextColor={colors.textSecondary}
          textAlign="left"
        />
      </View>

      {/* المهارات */}
      <RNText style={[s.sectionLabel, { marginTop: spacing.xl }]}>المهارات</RNText>

      {/* Field / Domain Selector */}
      <RNText style={s.fieldHint}>اختر مجالك لعرض مهارات مقترحة</RNText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fieldScroll} contentContainerStyle={s.fieldScrollContent}>
        {FIELDS.map((field) => {
          const active = selectedField === field.key;
          return (
            <Pressable key={field.key} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedField(active ? null : field.key); }}>
              <View style={[s.fieldChip, active && s.fieldChipActive]}>
                <Ionicons name={field.icon} size={16} color={active ? colors.white : colors.primary} />
                <RNText style={[s.fieldChipText, active && s.fieldChipTextActive]}>{field.label}</RNText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Suggested Skills */}
      {selectedField && (
        <AnimatedView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250 }}>
          <View style={s.suggestedSection}>
            <RNText style={s.suggestedLabel}>مهارات مقترحة — اضغط للإضافة</RNText>
            <View style={s.chipWrap}>
              {suggestedSkills.map((skill) => {
                const added = data.skills.technical.includes(skill) || data.skills.soft.includes(skill);
                return (
                  <Pressable key={skill} onPress={() => toggleSkill(skill)}>
                    <View style={[s.suggestChip, added && s.suggestChipAdded]}>
                      <Ionicons name={added ? 'checkmark' : 'add'} size={14} color={added ? colors.white : colors.primary} />
                      <RNText style={[s.suggestChipText, added && s.suggestChipTextAdded]}>{skill}</RNText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </AnimatedView>
      )}

      {/* Manual add + all added skills */}
      <View style={s.skillInputRow}>
        <TextInput
          style={s.skillInput}
          value={skillInput}
          onChangeText={setSkillInput}
          placeholder="Or type a skill manually..."
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={addSkill}
          onFocus={() => setTimeout(() => scrollViewRef?.current?.scrollToEnd({ animated: true }), 100)}
          textAlign="left"
        />
        <Pressable onPress={addSkill}>
          <View style={s.skillAddBtn}>
            <Ionicons name="add" size={20} color={colors.white} />
          </View>
        </Pressable>
      </View>
      <View style={s.chipWrap}>
        {data.skills.technical.map((skill) => (
          <Pressable key={skill} onPress={() => removeSkill(skill)}>
            <View style={s.skillChip}>
              <RNText style={s.skillChipText}>{skill}</RNText>
              <Ionicons name="close" size={14} color={colors.primary} />
            </View>
          </Pressable>
        ))}
        {data.skills.technical.length === 0 && data.skills.soft.length === 0 && (
          <RNText style={s.emptyHint}>لم تتم إضافة مهارات بعد - يمكنك التخطي</RNText>
        )}
      </View>

      {/* Soft Skills */}
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSoftSkills(!showSoftSkills); }}>
        <View style={s.softSkillsToggle}>
          <View style={s.softSkillsToggleLeft}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <RNText style={s.softSkillsToggleText}>مهارات شخصية (اختياري)</RNText>
          </View>
          <Ionicons name={showSoftSkills ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </View>
      </Pressable>

      {showSoftSkills && (
        <AnimatedView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 200 }}>
          <RNText style={s.softSkillsHint}>اضغط لإضافة أو إزالة</RNText>
          <View style={s.chipWrap}>
            {SOFT_SKILLS.map((skill) => {
              const added = data.skills.soft.includes(skill) || data.skills.technical.includes(skill);
              return (
                <Pressable key={skill} onPress={() => toggleSoftSkill(skill)}>
                  <View style={[s.softChip, added && s.softChipAdded]}>
                    <Ionicons name={added ? 'checkmark' : 'add'} size={13} color={added ? colors.white : colors.secondary} />
                    <RNText style={[s.softChipText, added && s.softChipTextAdded]}>{skill}</RNText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </AnimatedView>
      )}

      {/* Languages */}
      <RNText style={[s.sectionLabel, { marginTop: spacing.xl }]}>اللغات</RNText>
      <RNText style={s.fieldHint}>اضغط لإضافة أو إزالة</RNText>
      <View style={s.chipWrap}>
        {COMMON_LANGUAGES.map((lang) => {
          const existing = data.languages.find((l) => l.language === lang);
          const added = !!existing;
          return (
            <Pressable key={lang} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (added) { removeLang(existing!.id); }
              else { onChange({ ...data, languages: [...data.languages, { id: nextId(), language: lang, proficiency: 'Intermediate' }] }); }
            }}>
              <View style={[s.suggestChip, added && s.suggestChipAdded]}>
                <Ionicons name={added ? 'checkmark' : 'add'} size={14} color={added ? colors.white : colors.primary} />
                <RNText style={[s.suggestChipText, added && s.suggestChipTextAdded]}>{lang}</RNText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Proficiency */}
      {data.languages.filter(l => l.language.trim()).map((lang) => (
        <View key={lang.id} style={[s.langRow, { marginTop: spacing.sm }]}>
          <RNText style={[s.suggestChipText, { width: 70, color: colors.text }]}>{lang.language}</RNText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {PROFICIENCY_LEVELS.map((level) => (
              <Pressable key={level} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateLang(lang.id, 'proficiency', level); }}>
                <View style={[s.profChip, lang.proficiency === level && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <RNText style={[s.profChipText, lang.proficiency === level && { color: colors.white }]}>{level}</RNText>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fieldHint: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: spacing.md, textAlign: 'center', writingDirection: 'rtl' },
    fieldScroll: { maxHeight: 48, marginBottom: spacing.md },
    fieldScrollContent: { gap: spacing.sm, alignItems: 'center' },
    fieldChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary + '30', gap: 6 },
    fieldChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    fieldChipText: { fontSize: 13, fontFamily: fonts.semibold, color: colors.primary, writingDirection: 'rtl' },
    fieldChipTextActive: { color: colors.white },
    suggestedSection: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
    suggestedLabel: { fontSize: 13, fontFamily: fonts.semibold, color: colors.textSecondary, marginBottom: spacing.md, textAlign: 'center', writingDirection: 'rtl' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    suggestChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary + '25', gap: 4 },
    suggestChipAdded: { backgroundColor: colors.primary, borderColor: colors.primary },
    suggestChipText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },
    suggestChipTextAdded: { color: colors.white },
    skillInputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    skillInput: { flex: 1, backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: fonts.regular, color: colors.text, borderWidth: 1, borderColor: colors.border },
    skillAddBtn: { backgroundColor: colors.primary, borderRadius: 12, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    skillChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
    skillChipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
    softSkillsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg, marginBottom: spacing.sm },
    softSkillsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    softSkillsToggleText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text, writingDirection: 'rtl' },
    softSkillsHint: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: spacing.sm, textAlign: 'center', writingDirection: 'rtl' },
    softChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18, backgroundColor: colors.secondary + '15', borderWidth: 1, borderColor: colors.secondary + '30', gap: 4 },
    softChipAdded: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    softChipText: { fontSize: 12, fontFamily: fonts.medium, color: colors.secondary },
    softChipTextAdded: { color: colors.white },
    langRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    profChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginEnd: 4 },
    profChipText: { fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary },
  });
