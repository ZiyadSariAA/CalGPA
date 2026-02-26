import { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text as RNText, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { exportCVAsPdf } from '../utils/cvPdfExport';
import type { CV } from '../types/cv';
import { useState } from 'react';

/* ─── CV Card ─── */

function CVCard({
  cv,
  index,
  colors,
  s,
  onEdit,
  onPdf,
  onDelete,
}: {
  cv: CV;
  index: number;
  colors: ThemeColors;
  s: ReturnType<typeof createStyles>;
  onEdit: () => void;
  onPdf: () => void;
  onDelete: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const updatedDate = new Date(cv.updatedAt).toLocaleDateString('ar-SA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 140, delay: Math.min(index * 80, 300) }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onEdit();
        }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <MotiView
          animate={{ scale: pressed ? 0.97 : 1 }}
          transition={{ type: 'timing', duration: 100 }}
        >
          <View style={s.card}>
            {/* Header row */}
            <View style={s.cardHeader}>
              <View style={s.cardIconWrap}>
                <Ionicons name="document-text" size={22} color={colors.primary} />
              </View>
              <View style={s.cardTextWrap}>
                <RNText style={s.cardName} numberOfLines={1}>{cv.name}</RNText>
                <RNText style={s.cardDate}>آخر تعديل {updatedDate}</RNText>
              </View>
              {cv.status === 'draft' && (
                <View style={s.draftBadge}>
                  <RNText style={s.draftBadgeText}>مسودة</RNText>
                </View>
              )}
              {cv.status === 'complete' && (
                <View style={s.completeBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                </View>
              )}
            </View>

            {/* Template label */}
            <View style={s.templateRow}>
              <Ionicons name="color-palette-outline" size={14} color={colors.textSecondary} />
              <RNText style={s.templateLabel}>
                قالب {cv.template.charAt(0).toUpperCase() + cv.template.slice(1)}
              </RNText>
            </View>

            {/* Action buttons */}
            <View style={s.cardActions}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onEdit();
                }}
              >
                <View style={s.actionBtn}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <RNText style={s.actionBtnText}>تعديل</RNText>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPdf();
                }}
              >
                <View style={s.actionBtn}>
                  <Ionicons name="download-outline" size={16} color={colors.primary} />
                  <RNText style={s.actionBtnText}>PDF</RNText>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onDelete();
                }}
              >
                <View style={[s.actionBtn, s.actionBtnDanger]}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <RNText style={[s.actionBtnText, { color: colors.error }]}>حذف</RNText>
                </View>
              </Pressable>
            </View>
          </View>
        </MotiView>
      </Pressable>
    </MotiView>
  );
}

/* ─── Empty State ─── */

function EmptyState({ colors, s }: { colors: ThemeColors; s: ReturnType<typeof createStyles> }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
    >
      <View style={s.emptyState}>
        <View style={s.emptyIconWrap}>
          <Ionicons name="document-text-outline" size={56} color={colors.textSecondary} />
        </View>
        <RNText style={s.emptyTitle}>لا توجد سير ذاتية</RNText>
        <RNText style={s.emptySubtitle}>
          أنشئ سيرتك الذاتية الأولى وصدّرها كملف PDF احترافي
        </RNText>
      </View>
    </MotiView>
  );
}

/* ─── Main Screen ─── */

export default function CVListScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { cvs, createNewCV, deleteCV } = useCV();

  const handleDelete = (id: string) => {
    Alert.alert('حذف السيرة الذاتية', 'هل أنت متأكد من حذف هذه السيرة الذاتية؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteCV(id);
        },
      },
    ]);
  };

  const handlePdf = async (cv: CV) => {
    try {
      await exportCVAsPdf(cv.data, cv.template, cv.name);
    } catch {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير الملف.');
    }
  };

  return (
    <ScreenLayout>
      <ScreenHeader title="السيرة الذاتية" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {cvs.length === 0 ? (
          <EmptyState colors={colors} s={s} />
        ) : (
          cvs.map((cv, i) => (
            <CVCard
              key={cv.id}
              cv={cv}
              index={i}
              colors={colors}
              s={s}
              onEdit={() => {
                navigation.navigate('CVForm', { cvId: cv.id });
              }}
              onPdf={() => handlePdf(cv)}
              onDelete={() => handleDelete(cv.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Create button */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 200 }}
      >
        <View style={s.bottomBar}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const newId = createNewCV();
              navigation.navigate('CVForm', { cvId: newId });
            }}
          >
            <View style={s.createBtn}>
              <Ionicons name="add-circle" size={22} color="#FFFFFF" style={{ marginEnd: 8 }} />
              <RNText style={s.createBtnText}>إنشاء سيرة ذاتية جديدة</RNText>
            </View>
          </Pressable>
        </View>
      </MotiView>
    </ScreenLayout>
  );
}

/* ─── Styles ─── */

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 100,
      gap: spacing.lg,
    },

    /* Card */
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    cardIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: spacing.md,
    },
    cardTextWrap: {
      flex: 1,
    },
    cardName: {
      fontSize: 16,
      fontFamily: fonts.semibold,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'ltr',
      marginBottom: 2,
    },
    cardDate: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* Badges */
    draftBadge: {
      backgroundColor: colors.warning + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    draftBadgeText: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      writingDirection: 'rtl',
      color: colors.warning,
    },
    completeBadge: {
      marginStart: spacing.sm,
    },

    /* Template row */
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: 6,
    },
    templateLabel: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* Action buttons */
    cardActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.primaryLight,
      gap: 4,
    },
    actionBtnDanger: {
      backgroundColor: colors.error + '15',
    },
    actionBtnText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.primary,
      writingDirection: 'rtl',
    },

    /* Empty state */
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: spacing.xl,
    },
    emptyIconWrap: {
      width: 100,
      height: 100,
      borderRadius: 30,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: spacing.sm,
      writingDirection: 'rtl',
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      writingDirection: 'rtl',
    },

    /* Bottom bar */
    bottomBar: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing['2xl'],
      paddingTop: spacing.md,
    },
    createBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.md,
    },
    createBtnText: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      textAlign: 'left',
      writingDirection: 'rtl',
    },
  });
