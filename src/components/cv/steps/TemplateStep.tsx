import { useMemo } from 'react';
import { StyleSheet, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '../../AnimatedView';
import * as Haptics from '../../../utils/haptics';
import { Pressable } from '../../ui/pressable';
import { useThemeColors, type ThemeColors } from '../../../theme';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/fonts';
import { TEMPLATE_INFO } from '../../../data/cvConstants';
import type { CVTemplate } from '../../../types/cv';

type Props = {
  selected: CVTemplate;
  onSelect: (t: CVTemplate) => void;
};

export default function TemplateStep({ selected, onSelect }: Props) {
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={{ gap: spacing.sm }}>
      <RNText style={s.sectionLabel}>اختر قالبًا</RNText>
      <RNText style={s.templateHint}>جميع القوالب متوافقة مع أنظمة ATS</RNText>
      {TEMPLATE_INFO.map((tmpl, i) => {
        const active = selected === tmpl.id;
        return (
          <AnimatedView
            key={tmpl.id}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: i * 60 }}
          >
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(tmpl.id); }}>
              <View style={[s.templateCard, active && s.templateCardActive]}>
                <View style={s.templateCardInner}>
                  <View style={[s.templatePreview, active && s.templatePreviewActive]}>
                    <View style={s.previewLine1} />
                    <View style={s.previewLine2} />
                    <View style={s.previewLine3} />
                    <View style={s.previewLine2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <RNText style={[s.templateName, active && { color: colors.primary }]}>{tmpl.name}</RNText>
                    <RNText style={s.templateNameAr}>{tmpl.nameAr}</RNText>
                    <RNText style={s.templateDesc}>{tmpl.description}</RNText>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                </View>
              </View>
            </Pressable>
          </AnimatedView>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sectionLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.md, textAlign: 'center', writingDirection: 'rtl' },
    templateHint: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center', writingDirection: 'rtl' },
    templateCard: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.border },
    templateCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    templateCardInner: { flexDirection: 'row', alignItems: 'center' },
    templatePreview: { width: 48, height: 64, borderRadius: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 6, justifyContent: 'space-between', marginEnd: spacing.md },
    templatePreviewActive: { borderColor: colors.primary },
    previewLine1: { height: 4, width: '60%', borderRadius: 2, backgroundColor: colors.primary },
    previewLine2: { height: 2, width: '100%', borderRadius: 1, backgroundColor: colors.border },
    previewLine3: { height: 2, width: '80%', borderRadius: 1, backgroundColor: colors.border },
    templateName: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
    templateNameAr: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 2 },
    templateDesc: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  });
