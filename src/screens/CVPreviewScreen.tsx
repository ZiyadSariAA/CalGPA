import { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText, Alert } from 'react-native';
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
import { TEMPLATE_INFO } from '../data/cvDummyData';
import { useCV } from '../context/CVContext';
import { exportCVAsPdf } from '../utils/cvPdfExport';
import type { CVData, CVTemplate } from '../types/cv';

/* ─── CV Content Preview ─── */

function CVContentPreview({
  data,
  s,
  colors,
  template,
}: {
  data: CVData;
  s: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  template: CVTemplate;
}) {
  const accent = colors.primary;

  // Template-specific header styles
  const centerHeader = template === 'classic' || template === 'executive';
  const headerStyle: any[] = [s.pvHeader];
  if (template === 'modern') headerStyle.push({ borderLeftWidth: 5, borderLeftColor: accent, paddingLeft: 16 });
  if (centerHeader) headerStyle.push({ alignItems: 'center' });
  if (template === 'professional') headerStyle.push({ borderBottomWidth: 3, borderBottomColor: '#1A1A1A', paddingBottom: 12 });
  if (template === 'executive') headerStyle.push({ borderBottomWidth: 1, borderBottomColor: '#999', paddingBottom: 14 });

  // Template-specific name styles
  const nameStyle: any[] = [s.pvName];
  if (template === 'classic') nameStyle.push({ textTransform: 'uppercase', letterSpacing: 2, fontSize: 24 });
  if (template === 'executive') nameStyle.push({ fontSize: 30, letterSpacing: 1 });
  if (template === 'modern') nameStyle.push({ color: accent, fontSize: 24 });
  if (template === 'minimal') nameStyle.push({ fontWeight: '300', letterSpacing: 3, textTransform: 'uppercase' });

  // Template-specific prof title
  const profTitleStyle: any[] = [s.pvProfTitle];
  if (template === 'executive') profTitleStyle.push({ fontStyle: 'italic', fontSize: 15 });
  if (template === 'minimal') profTitleStyle.push({ color: '#888', fontWeight: '300' });
  if (centerHeader) profTitleStyle.push({ textAlign: 'center' });

  // Template-specific contact
  const contactStyle: any[] = [s.pvContact];
  if (template === 'minimal') contactStyle.push({ color: '#999' });
  if (centerHeader) contactStyle.push({ textAlign: 'center' });

  // Template-specific section title
  const sectionTitleStyle = (base: any[]) => {
    const out = [...base];
    if (template === 'modern') out.push({ color: accent, borderBottomWidth: 0 });
    if (template === 'professional') out.push({ borderBottomWidth: 2, borderBottomColor: '#333' });
    if (template === 'classic') out.push({ borderBottomWidth: 2, borderBottomColor: '#1A1A1A', fontSize: 12 });
    if (template === 'minimal') out.push({ borderBottomWidth: 0, color: '#999', letterSpacing: 2.5, fontSize: 10 });
    if (template === 'executive') out.push({ letterSpacing: 3, borderBottomWidth: 1, borderBottomColor: '#CCC' });
    return out;
  };

  // Template-specific section wrapper
  const sectionStyle = (base: any[]) => {
    const out = [...base];
    if (template === 'modern') out.push({ borderLeftWidth: 3, borderLeftColor: accent, paddingLeft: 14 });
    if (template === 'minimal') out.push({ marginBottom: 20 });
    if (template === 'executive') out.push({ marginBottom: 18 });
    return out;
  };

  // Template-specific body text
  const bodyTextStyle: any[] = [s.pvBody];
  if (template === 'minimal') bodyTextStyle.push({ color: '#555' });

  // Font family hint (serif for classic/executive)
  const serifHint = template === 'classic' || template === 'executive'
    ? { fontFamily: 'serif' } : {};

  // Show divider?
  const showDivider = template === 'classic' || template === 'executive';

  return (
    <View style={[s.previewPage, template === 'minimal' && { padding: 28 }, template === 'executive' && { padding: 28 }]}>
      {/* Header */}
      <View style={headerStyle}>
        <RNText style={[...nameStyle, serifHint]}>
          {data.personalInfo.fullName}
        </RNText>
        {data.personalInfo.professionalTitle ? (
          <RNText style={profTitleStyle}>{data.personalInfo.professionalTitle}</RNText>
        ) : null}
        <RNText style={contactStyle}>
          {data.personalInfo.email}  |  {data.personalInfo.phone}  |  {data.personalInfo.location}
        </RNText>
        {data.personalInfo.linkedin ? (
          <RNText style={contactStyle}>{data.personalInfo.linkedin}</RNText>
        ) : null}
      </View>

      {showDivider && <View style={[s.pvDivider, template === 'classic' && { height: 2, backgroundColor: '#1A1A1A' }]} />}

      {/* Summary */}
      {data.summary.trim() ? (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            PROFESSIONAL SUMMARY
          </RNText>
          <RNText style={[...bodyTextStyle, serifHint]}>{data.summary}</RNText>
        </View>
      ) : null}

      {/* Education */}
      {(data.education.university || data.education.degree) ? (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            EDUCATION
          </RNText>
          <RNText style={[s.pvBold, serifHint]}>
            {data.education.degree}{data.education.major ? ` in ${data.education.major}` : ''}
          </RNText>
          <RNText style={[...bodyTextStyle, serifHint]}>
            {[data.education.university, data.education.gpa ? `GPA: ${data.education.gpa}` : '', data.education.graduationYear].filter(Boolean).join(' — ')}
          </RNText>
        </View>
      ) : null}

      {/* Experience */}
      {data.experiences.filter(e => e.jobTitle || e.company).length > 0 && (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            WORK EXPERIENCE
          </RNText>
          {data.experiences.filter(e => e.jobTitle || e.company).map((exp) => (
            <View key={exp.id} style={s.pvExpBlock}>
              <RNText style={[s.pvBold, serifHint]}>{exp.jobTitle}</RNText>
              <RNText style={s.pvSubtitle}>
                {exp.company} — {exp.startDate} – {exp.endDate}
              </RNText>
              {exp.description.split('\n').filter(Boolean).map((line, i) => (
                <RNText key={i} style={[s.pvBullet, serifHint]}>• {line.replace(/^[\•\-\*\–\—]\s*/, '')}</RNText>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Projects */}
      {data.projects.filter(p => p.name.trim()).length > 0 && (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            PROJECTS
          </RNText>
          {data.projects.filter(p => p.name.trim()).map((p) => (
            <View key={p.id} style={s.pvExpBlock}>
              <RNText style={[s.pvBold, serifHint]}>{p.name}</RNText>
              {p.description.trim() ? (
                <RNText style={[...bodyTextStyle, serifHint]}>{p.description}</RNText>
              ) : null}
              {p.technologies.trim() ? (
                <RNText style={[s.pvSubtitle, { fontStyle: 'italic' }]}>{p.technologies}</RNText>
              ) : null}
              {p.link.trim() ? (
                <RNText style={contactStyle}>{p.link}</RNText>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Technical Skills */}
      {data.skills.technical.length > 0 && (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            TECHNICAL SKILLS
          </RNText>
          <RNText style={[...bodyTextStyle, serifHint]}>{data.skills.technical.join('  •  ')}</RNText>
        </View>
      )}

      {/* Soft Skills */}
      {data.skills.soft.length > 0 && (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            SOFT SKILLS
          </RNText>
          <RNText style={[...bodyTextStyle, serifHint]}>{data.skills.soft.join('  •  ')}</RNText>
        </View>
      )}

      {/* Languages */}
      {data.languages.filter(l => l.language.trim()).length > 0 && (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            LANGUAGES
          </RNText>
          {data.languages.filter(l => l.language.trim()).map((l) => (
            <RNText key={l.id} style={[...bodyTextStyle, serifHint]}>
              {l.language} — {l.proficiency}
            </RNText>
          ))}
        </View>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <View style={sectionStyle([s.pvSection])}>
          <RNText style={sectionTitleStyle([s.pvSectionTitle])}>
            CERTIFICATIONS
          </RNText>
          {data.certifications.map((c) => (
            <RNText key={c.id} style={[...bodyTextStyle, serifHint]}>
              {c.name} — {c.issuer} ({c.date})
            </RNText>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Main Screen ─── */

export default function CVPreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  const cvId: string | null = route.params?.cvId ?? null;
  const { getCVById } = useCV();
  const cv = cvId ? getCVById(cvId) : undefined;

  const template: CVTemplate = cv?.template ?? route.params?.template ?? 'professional';
  const data: CVData | null = cv?.data ?? null;
  const templateName = TEMPLATE_INFO.find((t) => t.id === template)?.name ?? 'Professional';

  const handleExportPdf = async () => {
    if (!data) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await exportCVAsPdf(data, template, cv?.name);
    } catch {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير الملف.');
    }
  };

  if (!data) {
    return (
      <ScreenLayout>
        <ScreenHeader title="معاينة" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <RNText style={{ color: colors.textSecondary }}>لا توجد بيانات للعرض</RNText>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScreenHeader title="معاينة" onBack={() => navigation.goBack()} />

      {/* Template badge */}
      <View style={s.templateBadgeRow}>
        <View style={s.templateBadge}>
          <Ionicons name="color-palette" size={14} color={colors.primary} />
          <RNText style={s.templateBadgeText}>قالب {templateName}</RNText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        >
          <CVContentPreview data={data} s={s} colors={colors} template={template} />
        </MotiView>
      </ScrollView>

      {/* Bottom actions */}
      <View style={s.bottomActions}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.reset({ index: 1, routes: [{ name: 'Tabs' }, { name: 'CVList' }] });
          }}
        >
          <View style={s.backToListBtn}>
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('CVJobMatch', { cvId });
          }}
        >
          <View style={s.jobMatchBtn}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <RNText style={s.jobMatchBtnText}>تخصيص للوظيفة</RNText>
          </View>
        </Pressable>

        <Pressable onPress={handleExportPdf}>
          <View style={s.exportBtn}>
            <Ionicons name="download" size={18} color="#FFFFFF" />
            <RNText style={s.exportBtnText}>تصدير PDF</RNText>
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
      padding: spacing.lg,
      paddingBottom: spacing['3xl'],
    },

    /* Template badge */
    templateBadgeRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
    },
    templateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    templateBadgeText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.primary,
      writingDirection: 'rtl',
    },

    /* Preview page — English CV content, must be LTR */
    previewPage: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 24,
      ...shadows.md,
      borderWidth: 1,
      borderColor: colors.border,
      direction: 'ltr',
    },
    pvHeader: {
      marginBottom: 12,
    },
    pvName: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    pvProfTitle: {
      fontSize: 14,
      color: '#666666',
      marginBottom: 5,
    },
    pvContact: {
      fontSize: 11,
      color: '#6B6B6B',
      lineHeight: 18,
    },
    pvDivider: {
      height: 1,
      backgroundColor: '#E5E5E5',
      marginVertical: 12,
    },
    pvSection: {
      marginBottom: 14,
    },
    pvSectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: '#1A1A1A',
      letterSpacing: 1.2,
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
      paddingBottom: 4,
    },
    pvBold: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 2,
    },
    pvSubtitle: {
      fontSize: 11,
      color: '#6B6B6B',
      marginBottom: 4,
    },
    pvBody: {
      fontSize: 12,
      color: '#333333',
      lineHeight: 18,
    },
    pvBullet: {
      fontSize: 12,
      color: '#333333',
      lineHeight: 18,
      paddingLeft: 8,
    },
    pvExpBlock: {
      marginBottom: 10,
    },

    /* Bottom actions */
    backToListBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
    },
    bottomActions: {
      flexDirection: 'row',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      gap: spacing.md,
    },
    jobMatchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      gap: 6,
    },
    jobMatchBtnText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },
    exportBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      gap: 6,
      ...shadows.sm,
    },
    exportBtnText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      writingDirection: 'rtl',
    },
  });
