import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/config';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  link?: string;
  createdAt: number;
};

const LAST_SEEN_KEY = 'notifications_last_seen';
const CLEARED_AT_KEY = 'notifications_cleared_at';

export function useNotifications() {
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [clearedAt, setClearedAt] = useState<number>(0);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(LAST_SEEN_KEY),
      AsyncStorage.getItem(CLEARED_AT_KEY),
    ]).then(([seenRaw, clearedRaw]) => {
      if (seenRaw) setLastSeen(Number(seenRaw));
      if (clearedRaw) setClearedAt(Number(clearedRaw));
      setStorageLoaded(true);
    });
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items: AppNotification[] = snap.docs.map((doc) => {
          const d = doc.data();
          const ts = d.createdAt?.toMillis?.() ?? d.createdAt ?? 0;
          return {
            id: doc.id,
            title: d.title ?? '',
            message: d.message ?? '',
            date: d.date ?? '',
            link: d.link ?? '',
            createdAt: ts,
          };
        });
        setAllNotifications(items);
        setLoading(false);
      },
      (error) => {
        if (__DEV__) console.warn('[Notifications] listener error:', error.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const notifications = storageLoaded
    ? allNotifications.filter((n) => n.createdAt > clearedAt)
    : [];

  const unreadCount = notifications.filter((n) => n.createdAt > lastSeen).length;

  const markAllRead = useCallback(async () => {
    const now = Date.now();
    setLastSeen(now);
    await AsyncStorage.setItem(LAST_SEEN_KEY, String(now));
  }, []);

  const clearAll = useCallback(async () => {
    const now = Date.now();
    setClearedAt(now);
    setLastSeen(now);
    await AsyncStorage.setItem(CLEARED_AT_KEY, String(now));
    await AsyncStorage.setItem(LAST_SEEN_KEY, String(now));
  }, []);

  return { notifications, loading, unreadCount, lastSeen, markAllRead, clearAll };
}
