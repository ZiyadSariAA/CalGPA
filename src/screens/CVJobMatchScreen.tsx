import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { SuggestionCard } from '../components/common';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useCV } from '../context/CVContext';

import { SKILL_MAP, KEYWORD_MAP } from '../data/jobMatchConstants';
import useAIGeneration from '../hooks/useAIGeneration';

type ImprovedExperience = {
  company: string;
  originalDescription: string;
  improvedDescription: string;
};

type Suggestions = {
  improvedSummary: string;
  suggestedSkills: string[];
  improvedExperiences: ImprovedExperience[];
  keywords: string[];
};

/* ─── Offline fallback suggestion generator ─── */

function generateOfflineSuggestions(
  jobDesc: string,
  currentSkills: string[],
  experiences: { company: string; description: string }[],
): Suggestions {
  const lower = jobDesc.toLowerCase();

  const skillSet = new Set<string>();
  const keywordSet = new Set<string>();

  for (const [trigger, skills] of Object.entries(SKILL_MAP)) {
    if (lower.includes(trigger)) {
      for (const s of skills) skillSet.add(s);
    }
  }
  for (const [trigger, kws] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(trigger)) {
      for (const kw of kws) keywordSet.add(kw);
    }
  }

  const capitalTerms = jobDesc.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
  for (const term of capitalTerms.slice(0, 5)) {
    keywordSet.add(term);
  }

  const newSkills = Array.from(skillSet).filter((s) => !currentSkills.includes(s)).slice(0, 6);
  const keywords = Array.from(keywordSet).slice(0, 6);

  if (newSkills.length < 3) {
    const generic = ['Problem Solving', 'Team Collaboration', 'Communication', 'Adaptability', 'Critical Thinking'];
    for (const g of generic) {
      if (!currentSkills.includes(g) && !newSkills.includes(g)) newSkills.push(g);
      if (newSkills.length >= 5) break;
    }
  }
  if (keywords.length < 3) {
    keywords.push('results-oriented', 'detail-oriented', 'collaborative');
  }

  let domain = 'professional';
  if (lower.includes('software') || lower.includes('developer') || lower.includes('engineer')) domain = 'software engineering';
  else if (lower.includes('data') || lower.includes('analyst')) domain = 'data analysis';
  else if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) domain = 'design';
  else if (lower.includes('marketing') || lower.includes('sales')) domain = 'marketing and business development';
  else if (lower.includes('support') || lower.includes('helpdesk')) domain = 'technical support';
  else if (lower.includes('manager') || lower.includes('lead')) domain = 'leadership and management';
  else if (lower.includes('network') || lower.includes('security')) domain = 'IT and cybersecurity';
  else if (lower.includes('medical') || lower.includes('health')) domain = 'healthcare';
  else if (lower.includes('education') || lower.includes('teaching')) domain = 'education';
  else if (lower.includes('accounting') || lower.includes('finance')) domain = 'finance';

  const improvedSummary = `Results-driven ${domain} professional with a proven track record of delivering high-impact solutions. Skilled in ${newSkills.slice(0, 3).join(', ')}, with a strong focus on ${keywords.slice(0, 2).join(' and ')}. Eager to contribute technical expertise and collaborative mindset to drive team success.`;

  const improvedExperiences: ImprovedExperience[] = experiences.map((exp) => ({
    company: exp.company,
    originalDescription: exp.description,
    improvedDescription: exp.description,
  }));

  return {
    improvedSummary,
    suggestedSkills: newSkills.slice(0, 5),
    improvedExperiences,
    keywords: keywords.slice(0, 5),
  };
}

/* ─── Main Screen ─── */

export default function CVJobMatchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { generate, loading } = useAIGeneration({ feature: 'jobMatch', timeoutMs: 30000 });

  const cvId: string | null = route.params?.cvId ?? null;
  const { getCVById, updateCVData } = useCV();
  const cv = cvId ? getCVById(cvId) : undefined;

  const [jobDescription, setJobDescription] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [acceptedSummary, setAcceptedSummary] = useState(false);
  const [acceptedSkills, setAcceptedSkills] = useState<Set<string>>(new Set());
  const [acceptedKeywords, setAcceptedKeywords] = useState<Set<string>>(new Set());
  const [acceptedExperiences, setAcceptedExperiences] = useState<Set<number>>(new Set());

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || loading) return;

    setSuggestions(null);
    setUsedFallback(false);
    setAcceptedSummary(false);
    setAcceptedSkills(new Set());
    setAcceptedKeywords(new Set());
    setAcceptedExperiences(new Set());

    const currentSummary = cv?.data?.summary || '';
    const techSkills = cv?.data?.skills?.technical || [];
    const softSkills = cv?.data?.skills?.soft || [];
    const currentSkills = [...techSkills, ...softSkills];

    const validExperiences = (cv?.data?.experiences || []).filter(
      (e: any) => e.jobTitle || e.company,
    );

    const experiencesForPrompt = validExperiences.map((e: any) => ({
      company: e.company || '',
      jobTitle: e.jobTitle || '',
      description: e.description || '',
    }));

    const experiencesText = experiencesForPrompt.length > 0
      ? experiencesForPrompt
          .map((e: any) => `- ${e.jobTitle} at ${e.company}:\n${e.description}`)
          .join('\n\n')
      : 'None';

    const prompt = `Match this CV to the job description. Return JSON only:
{"improvedSummary":"...","suggestedSkills":[...],"improvedExperiences":[{"company":"...","originalDescription":"...","improvedDescription":"..."}],"keywords":[...]}

JOB:
${jobDescription}

CV:
Summary: ${currentSummary || 'None'}
Skills: ${currentSkills.length > 0 ? currentSkills.join(', ') : 'None listed'}
Experience:
${experiencesText}`;

    const raw = await generate(prompt);

    if (raw) {
      // Parse JSON response with regex fallback
      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }

      if (
        parsed?.improvedSummary &&
        Array.isArray(parsed.suggestedSkills) &&
        Array.isArray(parsed.keywords)
      ) {
        setSuggestions({
          improvedSummary: parsed.improvedSummary,
          suggestedSkills: parsed.suggestedSkills,
          improvedExperiences: Array.isArray(parsed.improvedExperiences) ? parsed.improvedExperiences : [],
          keywords: parsed.keywords,
        });
        setUsedFallback(false);
        return;
      }
    }

    // Fallback: AI failed or returned bad JSON
    const experiencesForFallback = experiencesForPrompt.map((e: any) => ({
      company: e.company,
      description: e.description,
    }));
    setSuggestions(generateOfflineSuggestions(jobDescription, currentSkills, experiencesForFallback));
    setUsedFallback(true);
  };

  const toggleSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAcceptedSkills((prev) => {
      const next = new Set(prev);
      next.has(skill) ? next.delete(skill) : next.add(skill);
      return next;
    });
  };

  const toggleKeyword = (kw: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAcceptedKeywords((prev) => {
      const next = new Set(prev);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return next;
    });
  };

  const toggleExperience = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAcceptedExperiences((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleApply = () => {
    if (!cvId || !suggestions || !cv) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updates: Partial<typeof cv.data> = {};

    // Apply improved summary
    if (acceptedSummary) {
      updates.summary = suggestions.improvedSummary;
    }

    // Apply new skills + keywords
    const newSkills = [...Array.from(acceptedSkills), ...Array.from(acceptedKeywords)];
    if (newSkills.length > 0) {
      const allExisting = [...(cv.data.skills.technical || []), ...(cv.data.skills.soft || [])];
      const uniqueNew = newSkills.filter((sk) => !allExisting.includes(sk));
      if (uniqueNew.length > 0) {
        updates.skills = {
          technical: [...(cv.data.skills.technical || []), ...uniqueNew],
          soft: cv.data.skills.soft || [],
        };
      }
    }

    // Apply improved experience descriptions
    if (acceptedExperiences.size > 0 && suggestions.improvedExperiences.length > 0) {
      const updatedExperiences = cv.data.experiences.map((exp, idx) => {
        if (!acceptedExperiences.has(idx)) return exp;
        const improved = suggestions.improvedExperiences[idx];
        if (improved) {
          return { ...exp, description: improved.improvedDescription };
        }
        return exp;
      });
      updates.experiences = updatedExperiences;
    }

    if (Object.keys(updates).length > 0) {
      updateCVData(cvId, updates);
    }
    navigation.goBack();
  };

  const hasAcceptedAnything =
    acceptedSummary ||
    acceptedSkills.size > 0 ||
    acceptedKeywords.size > 0 ||
    acceptedExperiences.size > 0;

  return (
    <ScreenLayout>
      <ScreenHeader title="تخصيص للوظيفة" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Job description input */}
        <AnimatedView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <View style={s.inputCard}>
            <View style={s.inputHeader}>
              <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
              <RNText style={s.inputTitle}>الصق وصف الوظيفة</RNText>
            </View>
            <RNText style={s.inputHint}>
              الصق إعلان الوظيفة أدناه وسنقترح تحسينات لسيرتك الذاتية
            </RNText>
            <TextInput
              style={s.jobInput}
              value={jobDescription}
              onChangeText={setJobDescription}
              placeholder="Paste the full job description here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlign="left"
              textAlignVertical="top"
              editable={!loading}
            />
            <Pressable onPress={handleAnalyze} disabled={loading || !jobDescription.trim()}>
              <View style={[s.analyzeBtn, (!jobDescription.trim() || loading) && s.analyzeBtnDisabled]}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="sparkles" size={18} color={colors.white} />
                )}
                <RNText style={s.analyzeBtnText}>{loading ? 'جاري التحليل...' : 'تحليل واقتراح'}</RNText>
              </View>
            </Pressable>
          </View>
        </AnimatedView>

        {/* Suggestions */}
        {suggestions && (
          <>
            {/* Fallback notice */}
            {usedFallback && (
              <AnimatedView
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                <View style={[s.inputCard, { paddingVertical: 12 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="wifi-outline" size={18} color={colors.warning} />
                    <RNText style={[s.suggestionHint, { marginBottom: 0, color: colors.warning }]}>
                      تم التحليل بدون إنترنت — النتائج تقريبية
                    </RNText>
                  </View>
                </View>
              </AnimatedView>
            )}

            {/* Improved Summary */}
            <SuggestionCard title="ملخص محسّن" icon="document-text" index={0}>
              <RNText style={s.suggestionBody}>{suggestions.improvedSummary}</RNText>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAcceptedSummary(!acceptedSummary);
                }}
              >
                <View style={[s.acceptBtn, acceptedSummary && s.acceptBtnActive]}>
                  <Ionicons
                    name={acceptedSummary ? 'checkmark-circle' : 'add-circle-outline'}
                    size={18}
                    color={acceptedSummary ? colors.white : colors.primary}
                  />
                  <RNText style={[s.acceptBtnText, acceptedSummary && s.acceptBtnTextActive]}>
                    {acceptedSummary ? 'تم القبول' : 'قبول الملخص'}
                  </RNText>
                </View>
              </Pressable>
            </SuggestionCard>

            {/* Improved Experiences */}
            {suggestions.improvedExperiences.length > 0 && (
              <SuggestionCard title="تحسين الخبرات" icon="briefcase" index={1}>
                <RNText style={s.suggestionHint}>وصف محسّن لكل خبرة بكلمات مفتاحية من الوظيفة</RNText>
                {suggestions.improvedExperiences.map((exp, idx) => {
                  const accepted = acceptedExperiences.has(idx);
                  return (
                    <View key={idx} style={s.expCard}>
                      <View style={s.expCardHeader}>
                        <Ionicons name="business" size={16} color={colors.primary} />
                        <RNText style={s.expCardCompany}>{exp.company}</RNText>
                      </View>

                      {/* Original */}
                      <View style={s.expDescBlock}>
                        <RNText style={s.expDescLabel}>الأصلي:</RNText>
                        <RNText style={s.expDescText}>{exp.originalDescription}</RNText>
                      </View>

                      {/* Improved */}
                      <View style={[s.expDescBlock, s.expDescImproved]}>
                        <RNText style={[s.expDescLabel, { color: colors.primary }]}>المحسّن:</RNText>
                        <RNText style={s.expDescText}>{exp.improvedDescription}</RNText>
                      </View>

                      <Pressable onPress={() => toggleExperience(idx)}>
                        <View style={[s.acceptBtn, accepted && s.acceptBtnActive]}>
                          <Ionicons
                            name={accepted ? 'checkmark-circle' : 'swap-horizontal'}
                            size={18}
                            color={accepted ? colors.white : colors.primary}
                          />
                          <RNText style={[s.acceptBtnText, accepted && s.acceptBtnTextActive]}>
                            {accepted ? 'تم القبول' : 'استبدال بالمحسّن'}
                          </RNText>
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </SuggestionCard>
            )}

            {/* Suggested Skills */}
            {suggestions.suggestedSkills.length > 0 && (
              <SuggestionCard title="مهارات مقترحة" icon="bulb" index={2}>
                <RNText style={s.suggestionHint}>اضغط لإضافتها إلى سيرتك الذاتية</RNText>
                <View style={s.chipWrap}>
                  {suggestions.suggestedSkills.map((skill) => {
                    const accepted = acceptedSkills.has(skill);
                    return (
                      <Pressable key={skill} onPress={() => toggleSkill(skill)}>
                        <View style={[s.suggestionChip, accepted && s.suggestionChipActive]}>
                          <Ionicons
                            name={accepted ? 'checkmark' : 'add'}
                            size={14}
                            color={accepted ? colors.white : colors.primary}
                          />
                          <RNText style={[s.suggestionChipText, accepted && s.suggestionChipTextActive]}>
                            {skill}
                          </RNText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </SuggestionCard>
            )}

            {/* Keywords */}
            {suggestions.keywords.length > 0 && (
              <SuggestionCard title="كلمات مفتاحية مهمة" icon="key" index={3}>
                <RNText style={s.suggestionHint}>كلمات مفتاحية مهمة من وصف الوظيفة</RNText>
                <View style={s.chipWrap}>
                  {suggestions.keywords.map((kw) => {
                    const accepted = acceptedKeywords.has(kw);
                    return (
                      <Pressable key={kw} onPress={() => toggleKeyword(kw)}>
                        <View style={[s.suggestionChip, accepted && s.suggestionChipActive]}>
                          <Ionicons
                            name={accepted ? 'checkmark' : 'add'}
                            size={14}
                            color={accepted ? colors.white : colors.secondary}
                          />
                          <RNText style={[s.suggestionChipText, accepted && s.suggestionChipTextActive, !accepted && { color: colors.secondary }]}>
                            {kw}
                          </RNText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </SuggestionCard>
            )}

            {/* Apply button */}
            <AnimatedView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 450 }}
            >
              <Pressable onPress={handleApply} disabled={!hasAcceptedAnything}>
                <View style={[s.applyBtn, !hasAcceptedAnything && s.applyBtnDisabled]}>
                  <Ionicons name="checkmark-done" size={20} color={colors.white} />
                  <RNText style={s.applyBtnText}>تطبيق التغييرات على السيرة الذاتية</RNText>
                </View>
              </Pressable>
            </AnimatedView>
          </>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

/* ─── Styles ─── */

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: spacing['3xl'],
      gap: spacing.lg,
    },

    /* Input card */
    inputCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    inputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    inputTitle: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    inputHint: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 20,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    jobInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 150,
      marginBottom: spacing.md,
    },
    analyzeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
      ...shadows.sm,
    },
    analyzeBtnDisabled: {
      opacity: 0.5,
    },
    analyzeBtnText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.white,
      writingDirection: 'rtl',
    },

    /* Suggestion content */
    suggestionBody: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: 21,
      marginBottom: spacing.md,
    },
    suggestionHint: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* Accept button */
    acceptBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      gap: 6,
    },
    acceptBtnActive: {
      backgroundColor: colors.success,
    },
    acceptBtnText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },
    acceptBtnTextActive: {
      color: colors.white,
    },

    /* Chips */
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      gap: 4,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    suggestionChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    suggestionChipText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    suggestionChipTextActive: {
      color: colors.white,
    },

    /* Experience improvement cards */
    expCard: {
      marginBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
    },
    expCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.sm,
    },
    expCardCompany: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    expDescBlock: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 12,
      marginBottom: spacing.sm,
    },
    expDescImproved: {
      borderWidth: 1,
      borderColor: colors.primary + '30',
      backgroundColor: colors.primaryLight,
    },
    expDescLabel: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
      marginBottom: 4,
      writingDirection: 'rtl',
    },
    expDescText: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.text,
      lineHeight: 19,
    },

    /* Apply button */
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      gap: 8,
      ...shadows.md,
    },
    applyBtnDisabled: {
      opacity: 0.5,
    },
    applyBtnText: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.white,
      writingDirection: 'rtl',
    },

  });
