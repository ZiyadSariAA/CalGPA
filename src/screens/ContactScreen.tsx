import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AnimatedView from '../components/AnimatedView';
import * as Haptics from '../utils/haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useThemeColors, type ThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { shadows } from '../theme/shadows';

export default function ContactScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !title.trim() || !message.trim()) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      await addDoc(collection(db, 'supportMessages'), {
        title: title.trim(),
        email: email.trim(),
        message: message.trim(),
        status: 'new',
        createdAt: Timestamp.now(),
      });

      setEmail('');
      setTitle('');
      setMessage('');
      Alert.alert('تم الإرسال', 'شكرًا لتواصلك معنا، سنرد عليك في أقرب وقت.', [
        { text: 'حسنًا', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('خطأ', 'حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقًا.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <ScreenHeader title="تواصل معنا" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 50 }}
        >
          <View style={s.card}>
            {/* Email */}
            <Text style={s.label}>البريد الإلكتروني</Text>
            <TextInput
              style={s.input}
              placeholder="example@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              textAlign="right"
            />

            {/* Title */}
            <Text style={s.label}>العنوان</Text>
            <TextInput
              style={s.input}
              placeholder="عنوان الرسالة"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              textAlign="right"
            />

            {/* Message */}
            <Text style={s.label}>الرسالة</Text>
            <TextInput
              style={[s.input, s.multiline]}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              textAlign="right"
            />
          </View>
        </AnimatedView>

        {/* Send Button */}
        <AnimatedView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
        >
          <Pressable
            onPress={handleSend}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            disabled={loading}
          >
            <AnimatedView
              animate={{ scale: pressed ? 0.97 : 1 }}
              transition={{ type: 'timing', duration: 100 }}
              style={[s.sendBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.sendBtnText}>إرسال</Text>
              )}
            </AnimatedView>
          </Pressable>
        </AnimatedView>
      </ScrollView>
    </ScreenLayout>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 40,
      gap: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg + 2,
      ...shadows.md,
    },
    label: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 8,
      marginTop: 12,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: fonts.regular,
      color: colors.text,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      writingDirection: 'rtl',
    },
    multiline: {
      height: 120,
      textAlignVertical: 'top',
    },
    sendBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.md,
    },
    sendBtnText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: fonts.semibold,
    },
  });
