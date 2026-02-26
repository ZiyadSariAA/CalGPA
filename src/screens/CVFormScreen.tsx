import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text as RNText,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import DropdownField from '../components/DropdownField';
import LocationSearchField from '../components/LocationSearchField';
import MonthYearPicker from '../components/MonthYearPicker';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';
import { TEMPLATE_INFO } from '../data/cvDummyData';
import { chevronForward, chevronBack } from '../theme/rtl';
import { useCV } from '../context/CVContext';
import { canUseAI, recordAIUsage } from '../utils/aiRateLimit';
import { useSubscription } from '../context/SubscriptionContext';
import type { CVData, CVExperience, CVProject, CVCertification, CVLanguage, CVTemplate } from '../types/cv';

const STEPS = [
  { key: 'personal', title: 'المعلومات الشخصية', icon: 'person' as const },
  { key: 'education', title: 'التعليم', icon: 'school' as const },
  { key: 'experience', title: 'الخبرات', icon: 'briefcase' as const },
  { key: 'projects', title: 'المشاريع', icon: 'rocket' as const },
  { key: 'skills', title: 'المهارات واللغات', icon: 'bulb' as const },
  { key: 'summary', title: 'الملخص والشهادات', icon: 'ribbon' as const },
  { key: 'template', title: 'القالب', icon: 'color-palette' as const },
];

const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Beginner'] as const;

const COMMON_LANGUAGES = [
  'Arabic', 'English', 'French', 'Spanish', 'German',
  'Chinese', 'Japanese', 'Korean', 'Turkish', 'Urdu',
] as const;

/* ─── Field / Domain Skill Suggestions ─── */

type FieldKey = 'tech' | 'medical' | 'business' | 'engineering' | 'design' | 'education' | 'law' | 'other';

const FIELDS: { key: FieldKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'tech', label: 'تقنية المعلومات', icon: 'code-slash' },
  { key: 'medical', label: 'طبي / صحي', icon: 'medkit' },
  { key: 'business', label: 'إدارة أعمال', icon: 'trending-up' },
  { key: 'engineering', label: 'هندسة', icon: 'construct' },
  { key: 'design', label: 'تصميم', icon: 'color-palette' },
  { key: 'education', label: 'تعليم', icon: 'book' },
  { key: 'law', label: 'قانون', icon: 'document-text' },
  { key: 'other', label: 'أخرى', icon: 'ellipsis-horizontal' },
];

const FIELD_SKILLS: Record<FieldKey, string[]> = {
  tech: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'React Native',
    'Node.js', 'SQL', 'MongoDB', 'Git', 'Docker', 'AWS', 'REST APIs',
    'CI/CD', 'Agile', 'Linux', 'Data Structures', 'Machine Learning', 'Cybersecurity',
  ],
  medical: [
    'Patient Care', 'Clinical Assessment', 'Electronic Health Records (EHR)',
    'Medical Terminology', 'HIPAA Compliance', 'CPR/BLS Certified',
    'Vital Signs Monitoring', 'Infection Control', 'Pharmacology',
    'Lab Analysis', 'Radiology', 'Surgical Assistance', 'Triage',
    'Patient Education', 'Medical Research',
  ],
  business: [
    'Financial Analysis', 'Project Management', 'Strategic Planning', 'Marketing',
    'Sales', 'CRM (Salesforce)', 'Data Analysis', 'Excel', 'Power BI',
    'Budgeting', 'Supply Chain Management', 'Business Development',
    'Market Research', 'Accounting', 'SAP',
  ],
  engineering: [
    'AutoCAD', 'SolidWorks', 'MATLAB', 'Structural Analysis', 'Project Management',
    'Quality Control', 'Lean Manufacturing', 'PLC Programming', 'Electrical Circuits',
    'Thermodynamics', 'CAD/CAM', 'Six Sigma', 'Technical Drawing',
    'Safety Standards', 'BIM',
  ],
  design: [
    'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Sketch',
    'UI/UX Design', 'Wireframing', 'Prototyping', 'Typography',
    'Branding', 'Motion Graphics', 'After Effects', 'InDesign',
    'Design Systems', 'User Research',
  ],
  education: [
    'Curriculum Development', 'Classroom Management', 'Lesson Planning',
    'Student Assessment', 'E-Learning', 'Educational Technology',
    'Special Education', 'Differentiated Instruction', 'Mentoring',
    'Academic Advising', 'Research', 'Public Speaking',
    'Learning Management Systems (LMS)', 'Tutoring', 'Content Creation',
  ],
  law: [
    'Legal Research', 'Contract Drafting', 'Litigation', 'Compliance',
    'Corporate Law', 'Intellectual Property', 'Case Management',
    'Legal Writing', 'Negotiation', 'Due Diligence', 'Regulatory Analysis',
    'Client Counseling', 'Court Procedures', 'Arbitration', 'Legal Documentation',
  ],
  other: [
    'Microsoft Office', 'Data Entry', 'Customer Service', 'Research',
    'Writing', 'Social Media Management', 'Event Planning',
    'Translation', 'Content Creation', 'Photography',
  ],
};

const SOFT_SKILLS = [
  'Teamwork', 'Communication', 'Problem Solving', 'Time Management',
  'Leadership', 'Adaptability', 'Critical Thinking', 'Work Under Pressure',
  'Attention to Detail', 'Creativity', 'Conflict Resolution', 'Decision Making',
  'Multitasking', 'Organization', 'Interpersonal Skills', 'Emotional Intelligence',
];

const SAUDI_UNIVERSITIES = [
  'King Abdulaziz University',
  'King Saud University',
  'King Fahd University of Petroleum and Minerals',
  'KAUST',
  'Imam Abdulrahman Bin Faisal University',
  'Umm Al-Qura University',
  'King Khalid University',
  'Taif University',
  'Jazan University',
  'University of Tabuk',
  'University of Hail',
  'Najran University',
  'Al-Jouf University',
  'Albaha University',
  'Northern Border University',
  'Shaqra University',
  'Majmaah University',
  'Princess Nourah University',
  'Prince Sultan University',
  'Dar Al-Hekma University',
  'Effat University',
  'Alfaisal University',
] as const;

const DEGREE_OPTIONS = ["Diploma", "Bachelor's", "Master's", "PhD"] as const;

const GRADUATION_YEARS = Array.from({ length: 31 }, (_, i) => String(2030 - i));

const nextId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ─── Input Field ─── */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  s,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={s.fieldWrap}>
      <RNText style={s.fieldLabel}>{label}</RNText>
      <TextInput
        style={[s.fieldInput, multiline && s.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlign="left"
      />
    </View>
  );
}

/* ─── Step 1: Personal Info ─── */

function PersonalInfoStep({
  data,
  onChange,
  s,
  colors,
}: {
  data: CVData;
  onChange: (d: CVData) => void;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const p = data.personalInfo;
  const set = (key: keyof typeof p, val: string) =>
    onChange({ ...data, personalInfo: { ...p, [key]: val } });

  return (
    <View style={s.stepContent}>
      <Field label="الاسم الكامل" value={p.fullName} onChangeText={(v) => set('fullName', v)} placeholder="Full Name" s={s} colors={colors} />
      <Field label="البريد الإلكتروني" value={p.email} onChangeText={(v) => set('email', v)} placeholder="Email" keyboardType="email-address" s={s} colors={colors} />
      <Field label="رقم الهاتف" value={p.phone} onChangeText={(v) => set('phone', v)} placeholder="Phone" keyboardType="phone-pad" s={s} colors={colors} />
      <Field label="رابط LinkedIn" value={p.linkedin} onChangeText={(v) => set('linkedin', v)} placeholder="linkedin.com/in/..." s={s} colors={colors} />
      <LocationSearchField
        label="الموقع"
        value={p.location}
        onSelect={(v) => set('location', v)}
        placeholder="Search city..."
        colors={colors}
      />
    </View>
  );
}

/* ─── Step 2: Education ─── */

function EducationStep({
  data,
  onChange,
  s,
  colors,
}: {
  data: CVData;
  onChange: (d: CVData) => void;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const e = data.education;
  const set = (key: keyof typeof e, val: string) =>
    onChange({ ...data, education: { ...e, [key]: val } });

  return (
    <View style={s.stepContent}>
      <DropdownField
        label="الجامعة"
        value={e.university}
        options={[...SAUDI_UNIVERSITIES]}
        onSelect={(v) => set('university', v)}
        placeholder="Select University"
        allowCustom
        colors={colors}
      />
      <DropdownField
        label="الدرجة العلمية"
        value={e.degree}
        options={[...DEGREE_OPTIONS]}
        onSelect={(v) => set('degree', v)}
        placeholder="Select Degree"
        colors={colors}
      />
      <Field label="التخصص" value={e.major} onChangeText={(v) => set('major', v)} placeholder="Major" s={s} colors={colors} />
      <Field label="المعدل" value={e.gpa} onChangeText={(v) => set('gpa', v)} placeholder="GPA" keyboardType="numeric" s={s} colors={colors} />
      <DropdownField
        label="سنة التخرج"
        value={e.graduationYear}
        options={GRADUATION_YEARS}
        onSelect={(v) => set('graduationYear', v)}
        placeholder="Select Year"
        colors={colors}
      />
    </View>
  );
}

/* ─── Step 3: Experience ─── */

function ExperienceStep({
  data,
  onChange,
  s,
  colors,
  isPremium,
  presentPaywall,
}: {
  data: CVData;
  onChange: (d: CVData) => void;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  isPremium: boolean;
  presentPaywall: () => Promise<boolean>;
}) {
  const exps = data.experiences;
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const updateExp = (id: string, key: keyof CVExperience, val: string) => {
    onChange({
      ...data,
      experiences: exps.map((ex) => (ex.id === id ? { ...ex, [key]: val } : ex)),
    });
  };

  const addExp = () => {
    onChange({
      ...data,
      experiences: [
        ...exps,
        { id: nextId(), jobTitle: '', company: '', startDate: '', endDate: '', description: '' },
      ],
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

    const check = await canUseAI('description', isPremium);
    if (!check.allowed) {
      Alert.alert('تنبيه', check.reason!, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اشترك في النسخة المميزة', onPress: () => presentPaywall() },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoadingId(exp.id);

    // Clear the field immediately so user sees it's being replaced
    updateExp(exp.id, 'description', '');

    const duration = `${exp.startDate} to ${exp.endDate || 'Present'}`;
    const major = data.education?.major || '';
    const skills = [...(data.skills?.technical || []), ...(data.skills?.soft || [])];
    const currentDescription = exp.description.trim();

    const prompt = `Generate 3 bullet points for this CV experience entry.

Position: ${exp.jobTitle}
Company: ${exp.company}
Duration: ${duration}
${major ? `User's Major: ${major}` : ''}
${skills.length > 0 ? `User's Skills: ${skills.join(', ')}` : ''}
${currentDescription ? `Existing Description (if any): ${currentDescription}` : ''}

RULES:
- EXACTLY 3 bullet points, no more
- Each bullet should be 15-35 words (1-2 sentences)
- Start each with action verb (Managed, Developed, Supported, Implemented)
- If existing description is in Arabic, translate and improve it
- ATS-friendly, realistic, no fake numbers
- Be descriptive but concise

FORMAT: Return ONLY 3 bullets, each on new line starting with •`;



    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);



      if (response.ok) {
        const json = await response.json();
        const raw = json.choices?.[0]?.message?.content?.trim();

        if (raw) {
          // Clean up: normalize bullets to one per line
          const cleaned = raw
            .replace(/\\n/g, '\n')           // literal \n → real newline
            .replace(/\r\n/g, '\n')           // Windows line endings
            .replace(/\n{2,}/g, '\n')         // collapse multiple newlines
            .split('\n')                       // split into lines
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
            .map((line: string) => {
              // Remove leading bullet/dash/star, then re-add clean bullet
              const stripped = line.replace(/^[\•\-\*\–\—]\s*/, '').trim();
              return stripped ? `• ${stripped}` : '';
            })
            .filter((line: string) => line.length > 0)
            .slice(0, 3)
            .join('\n');

          updateExp(exp.id, 'description', cleaned);
          await recordAIUsage('description', isPremium);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setAiLoadingId(null);
          return;
        }
      }
    } catch (err: any) {
    }

    // Offline fallback
    const fallback = `• Supported ${exp.company} operations as ${exp.jobTitle}\n• Collaborated with team members on key projects\n• Applied ${skills.length > 0 ? skills.slice(0, 2).join(' and ') : 'relevant skills'} in daily tasks`;
    updateExp(exp.id, 'description', fallback);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAiLoadingId(null);
  };

  return (
    <View style={s.stepContent}>
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
            <Field label="المسمى الوظيفي" value={exp.jobTitle} onChangeText={(v) => updateExp(exp.id, 'jobTitle', v)} placeholder="Job Title" s={s} colors={colors} />
            <Field label="الشركة" value={exp.company} onChangeText={(v) => updateExp(exp.id, 'company', v)} placeholder="Company" s={s} colors={colors} />
            <View style={s.row}>
              <View style={s.halfField}>
                <MonthYearPicker
                  label="تاريخ البداية"
                  value={exp.startDate}
                  onSelect={(v) => updateExp(exp.id, 'startDate', v)}
                  colors={colors}
                />
              </View>
              <View style={s.halfField}>
                <MonthYearPicker
                  label="تاريخ النهاية"
                  value={exp.endDate}
                  onSelect={(v) => updateExp(exp.id, 'endDate', v)}
                  colors={colors}
                  allowPresent
                />
              </View>
            </View>

            {/* Description with AI button */}
            <View style={s.fieldWrap}>
              <RNText style={s.fieldLabel}>الوصف</RNText>
              <Pressable
                onPress={aiLoadingId === exp.id ? undefined : () => generateDescription(exp)}
                disabled={aiLoadingId === exp.id}
              >
                <View style={[s.aiDescBtn, aiLoadingId === exp.id && s.aiDescBtnLoading]}>
                  {aiLoadingId === exp.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <RNText style={s.aiDescIcon}>🤖</RNText>
                  )}
                  <RNText style={s.aiDescText}>
                    {aiLoadingId === exp.id
                      ? 'جاري الكتابة...'
                      : exp.description.trim()
                        ? 'أعد الكتابة'
                        : 'اكتب بالذكاء الاصطناعي'}
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

/* ─── Step 4: Projects ─── */

function ProjectsStep({
  data,
  onChange,
  s,
  colors,
  isPremium,
  presentPaywall,
}: {
  data: CVData;
  onChange: (d: CVData) => void;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  isPremium: boolean;
  presentPaywall: () => Promise<boolean>;
}) {
  const projects = data.projects;
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const updateProject = (id: string, key: keyof CVProject, val: string) => {
    onChange({
      ...data,
      projects: projects.map((p) => (p.id === id ? { ...p, [key]: val } : p)),
    });
  };

  const addProject = () => {
    onChange({
      ...data,
      projects: [
        ...projects,
        { id: nextId(), name: '', description: '', technologies: '', link: '' },
      ],
    });
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

    const check = await canUseAI('projectDescription', isPremium);
    if (!check.allowed) {
      Alert.alert('تنبيه', check.reason!, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اشترك في النسخة المميزة', onPress: () => presentPaywall() },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoadingId(proj.id);

    const major = data.education?.major || '';
    const skills = [...(data.skills?.technical || []), ...(data.skills?.soft || [])];
    const currentDescription = proj.description.trim();

    // Clear the field immediately so user sees it's being replaced
    updateProject(proj.id, 'description', '');

    const prompt = `Generate a professional description for this CV project entry.

Project Name: ${proj.name}
Technologies Used: ${proj.technologies}
${major ? `User's Major: ${major}` : ''}
${skills.length > 0 ? `User's Skills: ${skills.join(', ')}` : ''}
${currentDescription ? `Existing Description (improve/rewrite this): ${currentDescription}` : ''}

RULES:
- EXACTLY 2-3 sentences, no more (20-50 words total)
- Start with a strong action verb (Developed, Built, Designed, Implemented, Created)
- Mention key technologies naturally within the sentences
- Highlight what the project does and the user's contribution
- If existing description is in Arabic, translate and improve it
- ATS-friendly, realistic, no fake metrics
- Be descriptive but concise

FORMAT: Return ONLY the description text, no bullet points, no formatting.`;


    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);


      if (response.ok) {
        const json = await response.json();
        const raw = json.choices?.[0]?.message?.content?.trim();

        if (raw) {
          updateProject(proj.id, 'description', raw);
          await recordAIUsage('projectDescription', isPremium);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setAiLoadingId(null);
          return;
        }
      }
    } catch (err: any) {
    }

    // Offline fallback
    const fallback = `Developed ${proj.name} using ${proj.technologies || 'relevant technologies'}. ${skills.length > 0 ? `Applied ${skills.slice(0, 2).join(' and ')} skills.` : 'Focused on delivering a functional and well-structured solution.'}`;
    updateProject(proj.id, 'description', fallback);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAiLoadingId(null);
  };

  return (
    <View style={s.stepContent}>
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
            <Field label="اسم المشروع" value={proj.name} onChangeText={(v) => updateProject(proj.id, 'name', v)} placeholder="Project Name" s={s} colors={colors} />
            <Field label="التقنيات المستخدمة" value={proj.technologies} onChangeText={(v) => updateProject(proj.id, 'technologies', v)} placeholder="React, Node.js, Python..." s={s} colors={colors} />

            {/* Description with AI button */}
            <View style={s.fieldWrap}>
              <RNText style={s.fieldLabel}>الوصف</RNText>
              <Pressable
                onPress={aiLoadingId === proj.id ? undefined : () => generateProjectDescription(proj)}
                disabled={aiLoadingId === proj.id}
              >
                <View style={[s.aiDescBtn, aiLoadingId === proj.id && s.aiDescBtnLoading]}>
                  {aiLoadingId === proj.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <RNText style={s.aiDescIcon}>🤖</RNText>
                  )}
                  <RNText style={s.aiDescText}>
                    {aiLoadingId === proj.id
                      ? 'جاري الكتابة...'
                      : proj.description.trim()
                        ? 'أعد الكتابة'
                        : 'اكتب بالذكاء الاصطناعي'}
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

            <Field label="الرابط (اختياري)" value={proj.link} onChangeText={(v) => updateProject(proj.id, 'link', v)} placeholder="github.com/..." s={s} colors={colors} />
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

/* ─── Step 5: Skills & Languages ─── */

function SkillsStep({
  data,
  onChange,
  s,
  colors,
  scrollViewRef,
  isPremium,
  presentPaywall,
}: {
  data: CVData;
  onChange: (d: CVData) => void;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  isPremium: boolean;
  presentPaywall: () => Promise<boolean>;
}) {
  const [skillInput, setSkillInput] = useState('');
  const [selectedField, setSelectedField] = useState<FieldKey | null>(null);
  const [showSoftSkills, setShowSoftSkills] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [titleLoading, setTitleLoading] = useState(false);

  const p = data.personalInfo;
  const setPersonal = (key: keyof typeof p, val: string) =>
    onChange({ ...data, personalInfo: { ...p, [key]: val } });

  const suggestTitles = async () => {
    const check = await canUseAI('title', isPremium);
    if (!check.allowed) {
      Alert.alert('تنبيه', check.reason!, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اشترك في النسخة المميزة', onPress: () => presentPaywall() },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTitleLoading(true);
    setTitleSuggestions([]);

    const { education, experiences, skills } = data;
    const expTitles = experiences.filter(e => e.jobTitle).map(e => e.jobTitle).join(', ') || 'Fresh graduate';
    const techSkills = skills.technical.join(', ') || 'None listed';

    const prompt = `Suggest exactly 3 professional job titles for this person's CV.

Their Background:
- Degree: ${education.degree} in ${education.major} from ${education.university}
- Skills: ${techSkills}
- Experience: ${expTitles}

RULES:
- Suggest 3 realistic job titles they could apply for
- Based on their actual background
- Keep titles short (2-4 words max)
- Common industry titles (ATS-friendly)

Return ONLY a JSON array: ["Title 1", "Title 2", "Title 3"]`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const text = json.choices?.[0]?.message?.content?.trim() || '';
        let parsed: string[] = [];
        try {
          parsed = JSON.parse(text);
        } catch {
          const match = text.match(/\[[\s\S]*\]/);
          if (match) try { parsed = JSON.parse(match[0]); } catch {}
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTitleSuggestions(parsed.slice(0, 3));
          await recordAIUsage('title', isPremium);
          setTitleLoading(false);
          return;
        }
      }
    } catch {}

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
    setTitleLoading(false);
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
    onChange({
      ...data,
      languages: data.languages.map((l) => (l.id === id ? { ...l, [key]: val } : l)),
    });
  };

  const addLang = () => {
    onChange({
      ...data,
      languages: [...data.languages, { id: nextId(), language: '', proficiency: 'Intermediate' }],
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeLang = (id: string) => {
    onChange({ ...data, languages: data.languages.filter((l) => l.id !== id) });
  };

  const suggestedSkills = selectedField ? FIELD_SKILLS[selectedField] : [];

  return (
    <View style={s.stepContent}>
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
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <View style={[s.chipWrap, { marginBottom: spacing.sm }]}>
              {titleSuggestions.map((title) => {
                const active = p.professionalTitle === title;
                return (
                  <Pressable
                    key={title}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPersonal('professionalTitle', title);
                    }}
                  >
                    <View style={[s.suggestChip, active && s.suggestChipAdded]}>
                      <Ionicons
                        name={active ? 'checkmark' : 'add'}
                        size={14}
                        color={active ? '#FFFFFF' : colors.primary}
                      />
                      <RNText style={[s.suggestChipText, active && s.suggestChipTextAdded]}>
                        {title}
                      </RNText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </MotiView>
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

      {/* المهارات — single unified section */}
      <RNText style={[s.sectionLabel, { marginTop: spacing.xl }]}>المهارات</RNText>

      {/* Field / Domain Selector */}
      <RNText style={s.fieldHint}>اختر مجالك لعرض مهارات مقترحة</RNText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fieldScroll} contentContainerStyle={s.fieldScrollContent}>
        {FIELDS.map((field) => {
          const active = selectedField === field.key;
          return (
            <Pressable
              key={field.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedField(active ? null : field.key);
              }}
            >
              <View style={[s.fieldChip, active && s.fieldChipActive]}>
                <Ionicons
                  name={field.icon}
                  size={16}
                  color={active ? '#FFFFFF' : colors.primary}
                />
                <RNText style={[s.fieldChipText, active && s.fieldChipTextActive]}>
                  {field.label}
                </RNText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Suggested Skills from Field */}
      {selectedField && (
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 250 }}
        >
          <View style={s.suggestedSection}>
            <RNText style={s.suggestedLabel}>مهارات مقترحة — اضغط للإضافة</RNText>
            <View style={s.chipWrap}>
              {suggestedSkills.map((skill) => {
                const added = data.skills.technical.includes(skill) || data.skills.soft.includes(skill);
                return (
                  <Pressable key={skill} onPress={() => toggleSkill(skill)}>
                    <View style={[s.suggestChip, added && s.suggestChipAdded]}>
                      <Ionicons
                        name={added ? 'checkmark' : 'add'}
                        size={14}
                        color={added ? '#FFFFFF' : colors.primary}
                      />
                      <RNText style={[s.suggestChipText, added && s.suggestChipTextAdded]}>
                        {skill}
                      </RNText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </MotiView>
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
            <Ionicons name="add" size={20} color="#FFFFFF" />
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

      {/* Soft Skills (Optional) */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowSoftSkills(!showSoftSkills);
        }}
      >
        <View style={s.softSkillsToggle}>
          <View style={s.softSkillsToggleLeft}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <RNText style={s.softSkillsToggleText}>مهارات شخصية (اختياري)</RNText>
          </View>
          <Ionicons
            name={showSoftSkills ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      {showSoftSkills && (
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <RNText style={s.softSkillsHint}>اضغط لإضافة أو إزالة</RNText>
          <View style={s.chipWrap}>
            {SOFT_SKILLS.map((skill) => {
              const added = data.skills.soft.includes(skill) || data.skills.technical.includes(skill);
              return (
                <Pressable key={skill} onPress={() => toggleSoftSkill(skill)}>
                  <View style={[s.softChip, added && s.softChipAdded]}>
                    <Ionicons
                      name={added ? 'checkmark' : 'add'}
                      size={13}
                      color={added ? '#FFFFFF' : colors.secondary}
                    />
                    <RNText style={[s.softChipText, added && s.softChipTextAdded]}>
                      {skill}
                    </RNText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </MotiView>
      )}

      {/* Languages */}
      <RNText style={[s.sectionLabel, { marginTop: spacing.xl }]}>اللغات</RNText>
      <RNText style={s.fieldHint}>اضغط لإضافة أو إزالة</RNText>
      <View style={s.chipWrap}>
        {COMMON_LANGUAGES.map((lang) => {
          const existing = data.languages.find((l) => l.language === lang);
          const added = !!existing;
          return (
            <Pressable
              key={lang}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (added) {
                  removeLang(existing!.id);
                } else {
                  onChange({
                    ...data,
                    languages: [...data.languages, { id: nextId(), language: lang, proficiency: 'Intermediate' }],
                  });
                }
              }}
            >
              <View style={[s.suggestChip, added && s.suggestChipAdded]}>
                <Ionicons
                  name={added ? 'checkmark' : 'add'}
                  size={14}
                  color={added ? '#FFFFFF' : colors.primary}
                />
                <RNText style={[s.suggestChipText, added && s.suggestChipTextAdded]}>
                  {lang}
                </RNText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Proficiency for added languages */}
      {data.languages.filter(l => l.language.trim()).map((lang) => (
        <View key={lang.id} style={[s.langRow, { marginTop: spacing.sm }]}>
          <RNText style={[s.suggestChipText, { width: 70, color: colors.text }]}>{lang.language}</RNText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.proficiencyScroll}>
            {PROFICIENCY_LEVELS.map((level) => (
              <Pressable
                key={level}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateLang(lang.id, 'proficiency', level);
                }}
              >
                <View
                  style={[
                    s.profChip,
                    lang.proficiency === level && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <RNText
                    style={[
                      s.profChipText,
                      lang.proficiency === level && { color: '#FFFFFF' },
                    ]}
                  >
                    {level}
                  </RNText>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

/* ─── Step 5: Summary & Certifications ─── */

function SummaryStep({
  data,
  onChange,
  s,
  colors,
  isPremium,
  presentPaywall,
}: {
  data: CVData;
  onChange: (d: CVData) => void;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  isPremium: boolean;
  presentPaywall: () => Promise<boolean>;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const certs = data.certifications;

  const updateCert = (id: string, key: keyof CVCertification, val: string) => {
    onChange({
      ...data,
      certifications: certs.map((c) => (c.id === id ? { ...c, [key]: val } : c)),
    });
  };

  const addCert = () => {
    onChange({
      ...data,
      certifications: [...certs, { id: nextId(), name: '', issuer: '', date: '' }],
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeCert = (id: string) => {
    onChange({ ...data, certifications: certs.filter((c) => c.id !== id) });
  };

  const generateSummary = async () => {
    const check = await canUseAI('summary', isPremium);
    if (!check.allowed) {
      Alert.alert('تنبيه', check.reason!, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اشترك في النسخة المميزة', onPress: () => presentPaywall() },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoading(true);
    setAiError(false);

    const { personalInfo, education, experiences, skills } = data;
    const allSkills = [...skills.technical, ...skills.soft];

    const expText = experiences
      .filter((e) => e.jobTitle || e.company)
      .map((e) => `${e.jobTitle} at ${e.company}${e.description ? ': ' + e.description : ''}`)
      .join('; ');

    const prompt = `Generate a professional ATS-friendly CV summary (2-3 sentences).
RULES:
- Use strong action words and ATS keywords
- Make it sound professional and impressive
- But ONLY based on actual data provided - don't invent fake achievements
- If no experience, focus on education, skills, and eagerness to learn

User: ${personalInfo.fullName}, ${education.degree} in ${education.major} from ${education.university}
Skills: ${allSkills.length > 0 ? allSkills.join(', ') : 'None listed'}
Experience: ${expText || 'Fresh graduate'}

Return ONLY the summary, optimized for ATS.`;

    const endpoints = [
      {
        name: 'groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] },
        extract: (d: any) => d.choices?.[0]?.message?.content,
      },
    ];

    for (const api of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 20000);

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

        const text = api.extract(json)?.trim();

        if (text) {
          onChange({ ...data, summary: text });
          await recordAIUsage('summary', isPremium);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setAiLoading(false);
          return;
        }

      } catch (err: any) {
      }
    }

    // All APIs failed — offline fallback
    const major = education.major || 'the relevant field';
    const degree = education.degree || 'degree';
    const skillsPart = allSkills.length > 0 ? ` with skills in ${allSkills.slice(0, 3).join(', ')}` : '';
    const fallback = experiences.length > 0
      ? `${degree} graduate in ${major}${skillsPart}. ${experiences[0].jobTitle ? `Has experience as ${experiences[0].jobTitle}${experiences[0].company ? ` at ${experiences[0].company}` : ''}.` : ''} Seeking to apply knowledge and skills in a professional setting.`
      : `Recent ${degree} graduate in ${major}${skillsPart}. Seeking an opportunity to apply academic knowledge and grow professionally.`;
    onChange({ ...data, summary: fallback });
    setAiError(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAiLoading(false);
  };

  return (
    <View style={s.stepContent}>
      <RNText style={s.sectionLabel}>الملخص المهني</RNText>

      {/* AI Suggest Button */}
      <Pressable onPress={aiLoading ? undefined : generateSummary} disabled={aiLoading}>
        <View style={[s.aiSuggestBtn, aiLoading && s.aiSuggestBtnLoading]}>
          {aiLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <RNText style={s.aiSuggestIcon}>🤖</RNText>
          )}
          <RNText style={s.aiSuggestText}>
            {aiLoading ? 'جاري الإنشاء...' : 'اقترح لي ملخص'}
          </RNText>
        </View>
      </Pressable>

      {/* Error toast */}
      {aiError && (
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <View style={s.aiErrorToast}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <RNText style={s.aiErrorText}>تعذر الاتصال بالذكاء الاصطناعي — تم إنشاء ملخص تلقائي</RNText>
          </View>
        </MotiView>
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
          <Field label="اسم الشهادة" value={cert.name} onChangeText={(v) => updateCert(cert.id, 'name', v)} placeholder="Certificate Name" s={s} colors={colors} />
          <Field label="الجهة المانحة" value={cert.issuer} onChangeText={(v) => updateCert(cert.id, 'issuer', v)} placeholder="Issuer" s={s} colors={colors} />
          <MonthYearPicker
            label="التاريخ"
            value={cert.date}
            onSelect={(v) => updateCert(cert.id, 'date', v)}
            colors={colors}
          />
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

/* ─── Step 6: Template Selection ─── */

function TemplateStep({
  selected,
  onSelect,
  s,
  colors,
}: {
  selected: CVTemplate;
  onSelect: (t: CVTemplate) => void;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={s.stepContent}>
      <RNText style={s.sectionLabel}>اختر قالبًا</RNText>
      <RNText style={s.templateHint}>جميع القوالب متوافقة مع أنظمة ATS</RNText>
      {TEMPLATE_INFO.map((tmpl, i) => {
        const active = selected === tmpl.id;
        return (
          <MotiView
            key={tmpl.id}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: i * 60 }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(tmpl.id);
              }}
            >
              <View style={[s.templateCard, active && s.templateCardActive]}>
                <View style={s.templateCardInner}>
                  <View style={[s.templatePreview, active && s.templatePreviewActive]}>
                    <View style={s.previewLine1} />
                    <View style={s.previewLine2} />
                    <View style={s.previewLine3} />
                    <View style={s.previewLine2} />
                  </View>
                  <View style={s.templateTextWrap}>
                    <RNText style={[s.templateName, active && { color: colors.primary }]}>
                      {tmpl.name}
                    </RNText>
                    <RNText style={s.templateNameAr}>{tmpl.nameAr}</RNText>
                    <RNText style={s.templateDesc}>{tmpl.description}</RNText>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>
              </View>
            </Pressable>
          </MotiView>
        );
      })}
    </View>
  );
}

/* ─── Progress Bar ─── */

function ProgressBar({
  current,
  total,
  s,
  colors,
}: {
  current: number;
  total: number;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={s.progressWrap}>
      <View style={s.progressTrack}>
        <MotiView
          animate={{ width: `${((current + 1) / total) * 100}%` as any }}
          transition={{ type: 'timing', duration: 300 }}
          style={s.progressFill}
        />
      </View>
      <RNText style={s.progressText}>
        {current + 1} / {total}
      </RNText>
    </View>
  );
}

/* ─── Main Screen ─── */

export default function CVFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const cvId: string | null = route.params?.cvId ?? null;
  const { isPremium, presentPaywall } = useSubscription();

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
  }, [isLast, step, template, cvId, saveAsComplete]);

  const goBack = useCallback(() => {
    if (isFirst) {
      navigation.goBack();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s - 1);
  }, [isFirst, step]);

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
      case 0: return <PersonalInfoStep data={cvData} onChange={handleDataChange} s={s} colors={colors} />;
      case 1: return <EducationStep data={cvData} onChange={handleDataChange} s={s} colors={colors} />;
      case 2: return <ExperienceStep data={cvData} onChange={handleDataChange} s={s} colors={colors} isPremium={isPremium} presentPaywall={presentPaywall} />;
      case 3: return <ProjectsStep data={cvData} onChange={handleDataChange} s={s} colors={colors} isPremium={isPremium} presentPaywall={presentPaywall} />;
      case 4: return <SkillsStep data={cvData} onChange={handleDataChange} s={s} colors={colors} scrollViewRef={scrollViewRef} isPremium={isPremium} presentPaywall={presentPaywall} />;
      case 5: return <SummaryStep data={cvData} onChange={handleDataChange} s={s} colors={colors} isPremium={isPremium} presentPaywall={presentPaywall} />;
      case 6: return <TemplateStep selected={template} onSelect={updateCurrentTemplate} s={s} colors={colors} />;
      default: return null;
    }
  };

  return (
    <ScreenLayout>
      <ScreenHeader
        title={STEPS[step].title}
        onBack={goBack}
      />

      <ProgressBar current={step} total={STEPS.length} s={s} colors={colors} />

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
                color={i === step ? '#FFFFFF' : i < step ? colors.success : colors.textSecondary}
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
          <MotiView
            key={step}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            {renderStep()}
          </MotiView>
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
            <Ionicons name={isLast ? 'eye' : (chevronForward as any)} size={18} color="#FFFFFF" />
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
    stepContent: {
      gap: spacing.sm,
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

    /* Progress */
    progressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    progressText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
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
      color: '#FFFFFF',
    },

    /* Fields */
    fieldWrap: {
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 6,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    fieldInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fieldInputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },

    /* Section label */
    sectionLabel: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* Experience */
    experienceBlock: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    expNumber: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    halfField: {
      flex: 1,
    },

    /* Add button */
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      gap: 6,
      marginTop: spacing.sm,
    },
    addBtnText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },

    /* Skills */
    skillInputRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    skillInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skillAddBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    skillChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 4,
    },
    skillChipText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    emptyHint: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    emptyStateBlock: {
      alignItems: 'center',
      paddingVertical: spacing['2xl'],
      gap: spacing.md,
    },

    /* Field / Domain selector */
    fieldHint: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    fieldScroll: {
      maxHeight: 48,
      marginBottom: spacing.md,
    },
    fieldScrollContent: {
      gap: spacing.sm,
      alignItems: 'center',
    },
    fieldChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: colors.primary + '30',
      gap: 6,
    },
    fieldChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    fieldChipText: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },
    fieldChipTextActive: {
      color: '#FFFFFF',
    },

    /* Suggested skills */
    suggestedSection: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    suggestedLabel: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    suggestChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary + '25',
      gap: 4,
    },
    suggestChipAdded: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    suggestChipText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    suggestChipTextAdded: {
      color: '#FFFFFF',
    },

    /* Soft skills */
    softSkillsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    softSkillsToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    softSkillsToggleText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
      writingDirection: 'rtl',
    },
    softSkillsHint: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    softChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: colors.secondary + '15',
      borderWidth: 1,
      borderColor: colors.secondary + '30',
      gap: 4,
    },
    softChipAdded: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    softChipText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.secondary,
    },
    softChipTextAdded: {
      color: '#FFFFFF',
    },

    /* Languages */
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    proficiencyScroll: {
      flex: 1,
    },
    profChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginEnd: 4,
    },
    profChipText: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    /* Certifications */
    certBlock: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },

    /* AI Description (Experience) */
    aiDescBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      gap: 6,
      marginBottom: spacing.sm,
    },
    aiDescBtnLoading: {
      opacity: 0.6,
    },
    aiDescIcon: {
      fontSize: 14,
    },
    aiDescText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },

    /* AI Suggest */
    aiSuggestBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.primary,
      gap: 8,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    aiSuggestBtnLoading: {
      opacity: 0.7,
    },
    aiSuggestIcon: {
      fontSize: 18,
    },
    aiSuggestText: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },
    aiErrorToast: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.warning + '18',
      borderWidth: 1,
      borderColor: colors.warning + '40',
      marginBottom: spacing.md,
    },
    aiErrorText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.warning,
      writingDirection: 'rtl',
      flex: 1,
      textAlign: 'center',
    },

    /* Template selection */
    templateHint: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    templateCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    templateCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    templateCardInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    templatePreview: {
      width: 48,
      height: 64,
      borderRadius: 6,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
      justifyContent: 'space-between',
      marginEnd: spacing.md,
    },
    templatePreviewActive: {
      borderColor: colors.primary,
    },
    previewLine1: {
      height: 4,
      width: '60%',
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    previewLine2: {
      height: 2,
      width: '100%',
      borderRadius: 1,
      backgroundColor: colors.border,
    },
    previewLine3: {
      height: 2,
      width: '80%',
      borderRadius: 1,
      backgroundColor: colors.border,
    },
    templateTextWrap: {
      flex: 1,
    },
    templateName: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    templateNameAr: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    templateDesc: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
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
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },
  });
