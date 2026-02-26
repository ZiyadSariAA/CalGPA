import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_DAILY_KEY = 'ai_daily_usage';
const DAILY_FEATURE_LIMIT = 1;

export type FeatureKey = 'description' | 'title' | 'summary' | 'jobMatch' | 'projectDescription';

type DailyUsage = {
  date: string;
  description: number;
  title: number;
  summary: number;
  jobMatch: number;
  projectDescription: number;
};

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getDailyUsage(): Promise<DailyUsage> {
  try {
    const raw = await AsyncStorage.getItem(AI_DAILY_KEY);
    if (raw) {
      const parsed: DailyUsage = JSON.parse(raw);
      if (parsed.date === getTodayDate()) return parsed;
    }
  } catch {}
  return { date: getTodayDate(), description: 0, title: 0, summary: 0, jobMatch: 0, projectDescription: 0 };
}

async function saveDailyUsage(usage: DailyUsage): Promise<void> {
  await AsyncStorage.setItem(AI_DAILY_KEY, JSON.stringify(usage));
}

export async function canUseAI(
  feature: FeatureKey,
  isPremium: boolean = false,
): Promise<{ allowed: boolean; reason?: string }> {
  if (isPremium) return { allowed: true };

  if (feature === 'jobMatch') {
    return {
      allowed: false,
      reason: 'تحليل توافق الوظائف متاح فقط للمشتركين في النسخة المميزة',
    };
  }

  const usage = await getDailyUsage();
  if (usage[feature] >= DAILY_FEATURE_LIMIT) {
    return {
      allowed: false,
      reason: 'تم الوصول إلى الحد الأقصى للاستخدام اليومي. اشترك في النسخة المميزة للاستخدام بلا حدود',
    };
  }
  return { allowed: true };
}

export async function recordAIUsage(
  feature: FeatureKey,
  isPremium: boolean = false,
): Promise<void> {
  if (isPremium) return;
  const usage = await getDailyUsage();
  usage[feature] = (usage[feature] ?? 0) + 1;
  await saveDailyUsage(usage);
}

export async function getRemainingUses(
  feature: FeatureKey,
  isPremium: boolean = false,
): Promise<number> {
  if (isPremium) return 999;
  const usage = await getDailyUsage();
  return Math.max(0, DAILY_FEATURE_LIMIT - (usage[feature] ?? 0));
}
