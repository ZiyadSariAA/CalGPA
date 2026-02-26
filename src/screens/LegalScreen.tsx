import React, { useState } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import ScreenHeader from '../components/ScreenHeader';
import { Pressable } from '../components/ui/pressable';
import { useThemeColors } from '../theme';
import { spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';

const CONTENT = {
  privacy: {
    ar: {
      title: 'سياسة الخصوصية',
      body: `آخر تحديث: فبراير 2026

مرحبًا بك في تطبيق CalGPA. نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام التطبيق.

البيانات التي نجمعها
• بيانات المعدل الدراسي: الدرجات والمواد التي تدخلها لحساب المعدل التراكمي. تُخزَّن هذه البيانات محليًا على جهازك فقط.
• بيانات السيرة الذاتية: المعلومات التي تدخلها عند إنشاء سيرتك الذاتية، وتُحفظ محليًا على جهازك.
• بيانات الاستخدام: قد نجمع بيانات مجهولة الهوية حول كيفية استخدامك للتطبيق لتحسين تجربة المستخدم.

كيف نستخدم بياناتك
• حساب معدلك التراكمي وعرض النتائج.
• إنشاء وتخزين سيرتك الذاتية محليًا.
• تحسين أداء التطبيق وتجربة المستخدم.

خدمات الطرف الثالث
• قد يستخدم التطبيق خدمات ذكاء اصطناعي (مثل Groq AI API) لتقديم توصيات أو تحليلات. تُرسل البيانات الضرورية فقط لهذه الخدمات ولا تُخزَّن لديها بشكل دائم.

تخزين البيانات
• جميع بياناتك الشخصية تُخزَّن محليًا على جهازك باستخدام AsyncStorage.
• لا نرسل بياناتك الشخصية إلى خوادم خارجية إلا عند الحاجة لخدمات الطرف الثالث المذكورة أعلاه.

حقوقك
• يمكنك حذف جميع بياناتك في أي وقت عن طريق حذف التطبيق من جهازك.
• يمكنك التواصل معنا لأي استفسار يتعلق ببياناتك.

التواصل معنا
لأي أسئلة أو استفسارات حول سياسة الخصوصية، يرجى التواصل معنا من خلال صفحة "تواصل معنا" في التطبيق.`,
    },
    en: {
      title: 'Privacy Policy',
      body: `Last updated: February 2026

Welcome to CalGPA. We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information when you use the app.

Data We Collect
• Academic data: The grades and courses you enter to calculate your GPA. This data is stored locally on your device only.
• Resume data: The information you enter when creating your resume, stored locally on your device.
• Usage data: We may collect anonymous data about how you use the app to improve the user experience.

How We Use Your Data
• Calculate your GPA and display results.
• Create and store your resume locally.
• Improve app performance and user experience.

Third-Party Services
• The app may use AI services (such as Groq AI API) to provide recommendations or analytics. Only necessary data is sent to these services and is not permanently stored by them.

Data Storage
• All your personal data is stored locally on your device using AsyncStorage.
• We do not send your personal data to external servers except when needed for the third-party services mentioned above.

Your Rights
• You can delete all your data at any time by deleting the app from your device.
• You can contact us for any inquiries regarding your data.

Contact Us
For any questions or inquiries about the privacy policy, please use the "Contact Us" page in the app.`,
    },
  },
  terms: {
    ar: {
      title: 'اتفاقية الاستخدام',
      body: `آخر تحديث: فبراير 2026

مرحبًا بك في تطبيق CalGPA. باستخدامك لهذا التطبيق، فإنك توافق على الشروط والأحكام التالية. يرجى قراءتها بعناية.

استخدام التطبيق
• تطبيق CalGPA مصمم لمساعدتك في حساب معدلك التراكمي وإدارة بياناتك الأكاديمية.
• يجب استخدام التطبيق للأغراض الشخصية والتعليمية فقط.
• أنت مسؤول عن دقة البيانات التي تدخلها في التطبيق.

الاستخدام المقبول
• يجب عدم استخدام التطبيق لأي غرض غير قانوني أو غير مصرح به.
• يجب عدم محاولة اختراق أو تعديل أو إلحاق الضرر بالتطبيق أو خوادمه.
• يجب عدم استخدام التطبيق بطريقة قد تضر بالمستخدمين الآخرين.

الملكية الفكرية
• جميع حقوق الملكية الفكرية المتعلقة بالتطبيق، بما في ذلك التصميم والشعارات والمحتوى، محفوظة لفريق CalGPA.
• لا يجوز نسخ أو توزيع أو تعديل أي جزء من التطبيق دون إذن كتابي مسبق.

إخلاء المسؤولية
• يُقدَّم التطبيق "كما هو" دون أي ضمانات صريحة أو ضمنية.
• نتائج حساب المعدل هي تقديرية وقد تختلف عن النتائج الرسمية لمؤسستك التعليمية.
• لا نضمن أن التطبيق سيعمل دون انقطاع أو أخطاء.

حدود المسؤولية
• لا يتحمل فريق CalGPA أي مسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام التطبيق.
• لا نتحمل مسؤولية أي قرارات تُتخذ بناءً على نتائج التطبيق.

التعديلات
• نحتفظ بالحق في تعديل هذه الشروط في أي وقت.
• سيتم إعلامك بأي تغييرات جوهرية عبر التطبيق.
• استمرارك في استخدام التطبيق بعد التعديل يعني موافقتك على الشروط الجديدة.

التواصل معنا
لأي أسئلة أو استفسارات حول اتفاقية الاستخدام، يرجى التواصل معنا من خلال صفحة "تواصل معنا" في التطبيق.`,
    },
    en: {
      title: 'Terms of Use',
      body: `Last updated: February 2026

Welcome to CalGPA. By using this app, you agree to the following terms and conditions. Please read them carefully.

App Usage
• CalGPA is designed to help you calculate your GPA and manage your academic data.
• The app must be used for personal and educational purposes only.
• You are responsible for the accuracy of the data you enter in the app.

Acceptable Use
• You must not use the app for any illegal or unauthorized purpose.
• You must not attempt to hack, modify, or damage the app or its servers.
• You must not use the app in a way that may harm other users.

Intellectual Property
• All intellectual property rights related to the app, including design, logos, and content, are reserved by the CalGPA team.
• No part of the app may be copied, distributed, or modified without prior written permission.

Disclaimer
• The app is provided "as is" without any express or implied warranties.
• GPA calculation results are estimates and may differ from the official results of your educational institution.
• We do not guarantee that the app will operate without interruption or errors.

Limitation of Liability
• The CalGPA team is not responsible for any direct or indirect damages resulting from the use of the app.
• We are not responsible for any decisions made based on the app's results.

Modifications
• We reserve the right to modify these terms at any time.
• You will be notified of any significant changes through the app.
• Your continued use of the app after modification means you agree to the new terms.

Contact Us
For any questions or inquiries about the terms of use, please use the "Contact Us" page in the app.`,
    },
  },
} as const;

export default function LegalScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const type: 'privacy' | 'terms' = route.params?.type ?? 'privacy';
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const { title, body } = CONTENT[type][lang];
  const isEn = lang === 'en';

  return (
    <ScreenLayout>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <View style={styles.langBar}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLang(isEn ? 'ar' : 'en');
          }}
          style={[
            styles.langBtn,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <Ionicons
            name="language"
            size={16}
            color={colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.langLabel, { color: colors.primary }]}>
            {isEn ? 'العربية' : 'English'}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={isEn ? styles.scrollEn : undefined}
      >
        <View style={isEn ? styles.containerEn : styles.containerAr}>
          <Text
            style={[
              styles.body,
              { color: colors.text },
              isEn && styles.bodyEn,
            ]}
          >
            {body}
          </Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  langBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  scrollEn: {
    direction: 'ltr',
  },
  containerAr: {
    direction: 'rtl',
  },
  containerEn: {
    direction: 'ltr',
  },
  body: {
    fontSize: 15,
    lineHeight: 26,
    fontFamily: fonts.regular,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  bodyEn: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
