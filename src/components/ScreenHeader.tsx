import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { Pressable } from './ui/pressable';
import { useThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';

type Props = {
  title: string;
  onBack?: () => void;
  children?: React.ReactNode;
  large?: boolean;
};

export default function ScreenHeader({ title, onBack, children, large }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  if (onBack) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          paddingTop: insets.top + spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.background,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </View>
        </Pressable>
        <Text
          style={{
            fontSize: 17,
            fontFamily: fonts.bold,
            color: colors.text,
            textAlign: 'center',
            flex: 1,
          }}
        >
          {title}
        </Text>
        {children ?? <View style={{ width: 40 }} />}
      </View>
    );
  }

  return (
    <View
      style={{
        paddingStart: 0,
        paddingEnd: spacing.xl,
        paddingBottom: spacing.lg,
        paddingTop: insets.top + spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: '100%',
          alignItems: 'flex-start',
          marginBottom: children ? spacing.md : 0,
        }}
      >
        <Text
          style={{
            fontSize: large ? 28 : 24,
            fontFamily: fonts.bold,
            color: colors.primary,
            textAlign: 'left',
            writingDirection: 'ltr',
            width: '100%', // حتى يكون النص ملتصق من اليمين فعلاً
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
