import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../utils/haptics';
import { useAppConfig } from '../context/AppConfigContext';

/* ─── In-memory response cache (session-scoped, prevents duplicate API calls) ─── */
const MAX_CACHE_ENTRIES = 20;
const responseCache = new Map<string, string>();

function getCacheKey(feature: string, prompt: string): string {
  let hash = 5381;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) + hash + prompt.charCodeAt(i)) | 0;
  }
  return `${feature}:${hash}`;
}

function getCached(key: string): string | undefined {
  return responseCache.get(key);
}

function setCache(key: string, value: string): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey !== undefined) responseCache.delete(firstKey);
  }
  responseCache.set(key, value);
}

/* ─── Local daily usage counter (AsyncStorage) ─── */
function getTodayKey(): string {
  return `ai_usage_${new Date().toISOString().slice(0, 10)}`;
}

async function getDailyCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(getTodayKey());
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

async function incrementDailyCount(): Promise<void> {
  try {
    const count = await getDailyCount();
    await AsyncStorage.setItem(getTodayKey(), String(count + 1));
  } catch {
    // non-critical, best-effort
  }
}

/* ─── Cloud Function URL ─── */
const CLOUD_FUNCTION_URL =
  'https://us-central1-calgpa--org.cloudfunctions.net/aiGenerate';

type UseAIGenerationOptions = {
  feature: string;
  timeoutMs?: number;
};

export default function useAIGeneration({ feature, timeoutMs = 25000 }: UseAIGenerationOptions) {
  const [loading, setLoading] = useState(false);
  const { config } = useAppConfig();

  const generate = useCallback(async (prompt: string): Promise<string | null> => {
    // Check cache first
    const cacheKey = getCacheKey(feature, prompt);
    const cached = getCached(cacheKey);
    if (cached) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return cached;
    }

    // Check local daily rate limit (0 = unlimited)
    const limit = config.aiDailyLimit;
    if (limit > 0) {
      const count = await getDailyCount();
      if (count >= limit) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'تنبيه',
          'لقد وصلت للحد اليومي من استخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.',
        );
        return null;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature, prompt }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const raw = json.content?.trim();

        if (raw) {
          setCache(cacheKey, raw);
          await incrementDailyCount();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setLoading(false);
          return raw;
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('[useAIGeneration] API call failed:', e);
      Alert.alert('تنبيه', 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
    }

    setLoading(false);
    return null;
  }, [feature, timeoutMs, config.aiDailyLimit]);

  return { generate, loading, setLoading };
}
