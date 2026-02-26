import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { useCV } from '../context/CVContext';
import { canUseAI, recordAIUsage } from '../utils/aiRateLimit';
import { useSubscription } from '../context/SubscriptionContext';

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

/* ─── Keyword-to-Skills mapping for offline fallback ─── */

const SKILL_MAP: Record<string, string[]> = {
  react: ['React', 'React Native', 'JSX', 'Component Architecture'],
  javascript: ['JavaScript', 'ES6+', 'TypeScript'],
  typescript: ['TypeScript', 'Type Safety'],
  python: ['Python', 'Data Analysis', 'Scripting'],
  java: ['Java', 'OOP', 'Spring Boot'],
  'c++': ['C++', 'Systems Programming'],
  node: ['Node.js', 'Express.js', 'REST APIs'],
  sql: ['SQL', 'Database Management', 'Query Optimization'],
  database: ['SQL', 'MongoDB', 'Database Design'],
  cloud: ['AWS', 'Cloud Computing', 'Deployment'],
  aws: ['AWS', 'EC2', 'S3', 'Cloud Architecture'],
  azure: ['Microsoft Azure', 'Cloud Services'],
  docker: ['Docker', 'Containerization', 'DevOps'],
  kubernetes: ['Kubernetes', 'Container Orchestration'],
  api: ['REST APIs', 'API Design', 'Integration'],
  mobile: ['Mobile Development', 'React Native', 'Cross-Platform'],
  ios: ['iOS Development', 'Swift', 'Mobile Apps'],
  android: ['Android Development', 'Kotlin', 'Mobile Apps'],
  web: ['Web Development', 'HTML/CSS', 'Responsive Design'],
  frontend: ['Frontend Development', 'UI/UX', 'CSS'],
  backend: ['Backend Development', 'Server Architecture', 'APIs'],
  fullstack: ['Full-Stack Development', 'Frontend', 'Backend'],
  'full-stack': ['Full-Stack Development', 'Frontend', 'Backend'],
  devops: ['DevOps', 'CI/CD', 'Infrastructure'],
  agile: ['Agile Methodology', 'Scrum', 'Sprint Planning'],
  scrum: ['Scrum', 'Agile', 'Sprint Management'],
  git: ['Git', 'Version Control', 'GitHub'],
  linux: ['Linux', 'Shell Scripting', 'System Administration'],
  security: ['Cybersecurity', 'Security Protocols', 'Risk Assessment'],
  network: ['Networking', 'TCP/IP', 'Network Security'],
  data: ['Data Analysis', 'Data Visualization', 'Reporting'],
  machine: ['Machine Learning', 'AI', 'Data Science'],
  ai: ['Artificial Intelligence', 'Machine Learning', 'NLP'],
  design: ['UI/UX Design', 'Figma', 'User Research'],
  figma: ['Figma', 'UI Design', 'Prototyping'],
  project: ['Project Management', 'Planning', 'Stakeholder Communication'],
  management: ['Management', 'Team Leadership', 'Strategic Planning'],
  marketing: ['Digital Marketing', 'SEO', 'Content Strategy'],
  sales: ['Sales', 'CRM', 'Business Development'],
  support: ['Technical Support', 'Troubleshooting', 'Customer Service'],
  excel: ['Microsoft Excel', 'Data Analysis', 'Reporting'],
  power: ['Power BI', 'Data Visualization', 'Analytics'],
  communication: ['Communication', 'Presentation Skills', 'Writing'],
  leadership: ['Leadership', 'Team Management', 'Mentoring'],
  accounting: ['Accounting', 'Financial Analysis', 'Budgeting'],
  finance: ['Financial Analysis', 'Budgeting', 'Forecasting'],
  engineering: ['Engineering', 'Problem Solving', 'Technical Documentation'],
  testing: ['Unit Testing', 'QA', 'Test Automation'],
  automation: ['Test Automation', 'CI/CD', 'Scripting'],
};

const KEYWORD_MAP: Record<string, string[]> = {
  react: ['component-driven', 'SPA', 'state management'],
  python: ['automation', 'scripting', 'data processing'],
  cloud: ['scalable', 'cloud-native', 'microservices'],
  agile: ['agile methodology', 'sprint planning', 'iterative'],
  management: ['stakeholder management', 'KPIs', 'strategic'],
  data: ['data-driven', 'analytics', 'insights'],
  design: ['user-centric', 'responsive', 'accessibility'],
  security: ['compliance', 'risk mitigation', 'secure coding'],
  devops: ['continuous integration', 'deployment pipeline', 'monitoring'],
  mobile: ['cross-platform', 'responsive', 'native performance'],
  web: ['responsive design', 'SEO', 'performance optimization'],
  fullstack: ['end-to-end', 'full lifecycle', 'architecture'],
  'full-stack': ['end-to-end', 'full lifecycle', 'architecture'],
  leadership: ['cross-functional', 'mentoring', 'decision-making'],
  support: ['SLA', 'incident resolution', 'customer satisfaction'],
};

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

/* ─── API call with fallback ─── */

async function tryAPICall(
  prompt: string,
  jobDesc: string,
  currentSkills: string[],
  experiences: { company: string; description: string }[],
): Promise<{ suggestions: Suggestions; usedFallback: boolean }> {
  const API_ENDPOINTS = [
    {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      },
      body: { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] },
      extract: (data: any) => data.choices?.[0]?.message?.content,
    },
  ];

  for (const api of API_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(api.url, {
        method: 'POST',
        headers: api.headers,
        body: JSON.stringify(api.body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const json = await response.json();
      const text = api.extract(json) ?? '';

      if (!text) continue;

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }

      if (
        parsed?.improvedSummary &&
        Array.isArray(parsed.suggestedSkills) &&
        Array.isArray(parsed.keywords)
      ) {
        const suggestions: Suggestions = {
          improvedSummary: parsed.improvedSummary,
          suggestedSkills: parsed.suggestedSkills,
          improvedExperiences: Array.isArray(parsed.improvedExperiences) ? parsed.improvedExperiences : [],
          keywords: parsed.keywords,
        };
        return { suggestions, usedFallback: false };
      }
    } catch (err: any) {
    }
  }

  return { suggestions: generateOfflineSuggestions(jobDesc, currentSkills, experiences), usedFallback: true };
}

/* ─── Suggestion Card ─── */

function SuggestionCard({
  title,
  icon,
  children,
  index,
  s,
  colors,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  index: number;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: index * 100 }}
    >
      <View style={s.suggestionCard}>
        <View style={s.suggestionHeader}>
          <View style={s.suggestionIconWrap}>
            <Ionicons name={icon} size={18} color={colors.primary} />
          </View>
          <RNText style={s.suggestionTitle}>{title}</RNText>
        </View>
        {children}
      </View>
    </MotiView>
  );
}

/* ─── Main Screen ─── */

export default function CVJobMatchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { isPremium, presentPaywall } = useSubscription();

  const cvId: string | null = route.params?.cvId ?? null;
  const { getCVById, updateCVData } = useCV();
  const cv = cvId ? getCVById(cvId) : undefined;

  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [acceptedSummary, setAcceptedSummary] = useState(false);
  const [acceptedSkills, setAcceptedSkills] = useState<Set<string>>(new Set());
  const [acceptedKeywords, setAcceptedKeywords] = useState<Set<string>>(new Set());
  const [acceptedExperiences, setAcceptedExperiences] = useState<Set<number>>(new Set());

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || loading) return;

    const check = await canUseAI('jobMatch', isPremium);
    if (!check.allowed) {
      Alert.alert('تنبيه', check.reason!, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اشترك في النسخة المميزة', onPress: () => presentPaywall() },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
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

    const prompt = `Analyze this job description against the user's CV. Be ATS-optimized but HONEST — never invent fake experience or lie.

Job Description:
${jobDescription}

User's Current CV:
Summary: ${currentSummary || 'None'}
Skills: ${currentSkills.length > 0 ? currentSkills.join(', ') : 'None listed'}
Experience:
${experiencesText}

Respond ONLY with a valid JSON object (no markdown, no code blocks, no explanation). Use this EXACT format:
{
  "improvedSummary": "ATS-optimized summary (2-3 sentences). Keep same length as original. Don't make it shorter!",
  "suggestedSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "improvedExperiences": [${experiencesForPrompt.map((e: any) => `{"company": "${e.company}", "originalDescription": "${e.description.replace(/"/g, '\\"').replace(/\n/g, '\\n')}", "improvedDescription": "Better version with job-relevant keywords, same length, honest"}`).join(', ')}],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

RULES:
- improvedSummary: Rewrite to match job keywords. Keep 2-3 sentences. Don't shorten it!
- suggestedSkills: Skills the user should ADD (not already in their CV). Relevant to the job.
- improvedExperiences: Rewrite each experience description to use job-relevant keywords. Keep same length. Be HONEST — don't add fake achievements or lie about what they did.
- keywords: Important ATS terms from the job description that should appear in the CV.`;

    const experiencesForFallback = experiencesForPrompt.map((e: any) => ({
      company: e.company,
      description: e.description,
    }));

    const result = await tryAPICall(prompt, jobDescription, currentSkills, experiencesForFallback);
    if (!result.usedFallback) {
      await recordAIUsage('jobMatch', isPremium);
    }
    setSuggestions(result.suggestions);
    setUsedFallback(result.usedFallback);
    setLoading(false);
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
      const uniqueNew = newSkills.filter((s) => !allExisting.includes(s));
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

  if (!isPremium) {
    return (
      <ScreenLayout>
        <ScreenHeader title="تخصيص للوظيفة" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 140 }}
          >
            <View style={s.lockCard}>
              <View style={s.lockIconWrap}>
                <Ionicons name="lock-closed" size={32} color={colors.primary} />
              </View>
              <RNText style={s.lockTitle}>ميزة مميزة</RNText>
              <RNText style={s.lockMessage}>
                تحليل توافق السيرة الذاتية مع الوظائف متاح فقط للمشتركين في النسخة المميزة
              </RNText>
              <Pressable onPress={() => presentPaywall()}>
                <View style={s.lockUpgradeBtn}>
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                  <RNText style={s.lockUpgradeBtnText}>اشترك الآن</RNText>
                </View>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScreenHeader title="تخصيص للوظيفة" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Job description input */}
        <MotiView
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                )}
                <RNText style={s.analyzeBtnText}>{loading ? 'جاري التحليل...' : 'تحليل واقتراح'}</RNText>
              </View>
            </Pressable>
          </View>
        </MotiView>

        {/* Suggestions */}
        {suggestions && (
          <>
            {/* Fallback notice */}
            {usedFallback && (
              <MotiView
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
              </MotiView>
            )}

            {/* Improved Summary */}
            <SuggestionCard title="ملخص محسّن" icon="document-text" index={0} s={s} colors={colors}>
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
                    color={acceptedSummary ? '#FFFFFF' : colors.primary}
                  />
                  <RNText style={[s.acceptBtnText, acceptedSummary && s.acceptBtnTextActive]}>
                    {acceptedSummary ? 'تم القبول' : 'قبول الملخص'}
                  </RNText>
                </View>
              </Pressable>
            </SuggestionCard>

            {/* Improved Experiences */}
            {suggestions.improvedExperiences.length > 0 && (
              <SuggestionCard title="تحسين الخبرات" icon="briefcase" index={1} s={s} colors={colors}>
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
                            color={accepted ? '#FFFFFF' : colors.primary}
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
              <SuggestionCard title="مهارات مقترحة" icon="bulb" index={2} s={s} colors={colors}>
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
                            color={accepted ? '#FFFFFF' : colors.primary}
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
              <SuggestionCard title="كلمات مفتاحية مهمة" icon="key" index={3} s={s} colors={colors}>
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
                            color={accepted ? '#FFFFFF' : colors.secondary}
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
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 450 }}
            >
              <Pressable onPress={handleApply} disabled={!hasAcceptedAnything}>
                <View style={[s.applyBtn, !hasAcceptedAnything && s.applyBtnDisabled]}>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  <RNText style={s.applyBtnText}>تطبيق التغييرات على السيرة الذاتية</RNText>
                </View>
              </Pressable>
            </MotiView>
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
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },

    /* Suggestion cards */
    suggestionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    suggestionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    suggestionTitle: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.text,
      writingDirection: 'rtl',
    },
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
      color: '#FFFFFF',
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
      color: '#FFFFFF',
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
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },

    /* Lock card */
    lockCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing['2xl'],
      alignItems: 'center' as const,
      ...shadows.md,
    },
    lockIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    lockTitle: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: spacing.sm,
      writingDirection: 'rtl' as const,
    },
    lockMessage: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 22,
      marginBottom: spacing.xl,
      writingDirection: 'rtl' as const,
    },
    lockUpgradeBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 32,
      gap: 8,
      ...shadows.sm,
    },
    lockUpgradeBtnText: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      writingDirection: 'rtl' as const,
    },
  });
