import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../../theme';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/fonts';

/**
 * Shared styles used across CV step components
 * (ExperienceStep, ProjectsStep, SkillsStep, SummaryStep)
 */
export const createSharedStepStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    /* ─── Block / Card ─── */
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

    /* ─── Section ─── */
    sectionLabel: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* ─── Fields ─── */
    fieldWrap: { marginBottom: spacing.sm },
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
    fieldInputMultiline: { minHeight: 80, textAlignVertical: 'top' },

    /* ─── Add Button ─── */
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

    /* ─── AI Description Button ─── */
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
    aiDescBtnLoading: { opacity: 0.6 },
    aiDescIcon: { fontSize: 14 },
    aiDescText: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      color: colors.primary,
      writingDirection: 'rtl',
    },

    /* ─── Empty State ─── */
    emptyStateBlock: {
      alignItems: 'center',
      paddingVertical: spacing['2xl'],
      gap: spacing.md,
    },
    emptyHint: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
  });
