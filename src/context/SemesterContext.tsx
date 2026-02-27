import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from './SettingsContext';

export type SavedCourse = { name: string; creditHours: number; grade: string };

export type SavedSemester = {
  id: string;
  label: string;
  gpa: number;
  creditHours: number;
  gpaScale: '4' | '5';
  courses: SavedCourse[];
  createdAt: number;
};

type SemesterContextType = {
  semesters: SavedSemester[];
  addSemester: (semester: Omit<SavedSemester, 'id' | 'createdAt'>) => string;
  updateSemester: (id: string, updates: Partial<Omit<SavedSemester, 'id' | 'createdAt'>>) => void;
  deleteSemester: (id: string) => void;
  cumulativeGpa: number;
  totalCredits: number;
  loaded: boolean;
};

const STORAGE_KEY = 'saved_semesters';

const SemesterContext = createContext<SemesterContextType>({
  semesters: [],
  addSemester: () => '',
  updateSemester: () => {},
  deleteSemester: () => {},
  cumulativeGpa: 0,
  totalCredits: 0,
  loaded: false,
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function SemesterProvider({ children }: { children: ReactNode }) {
  const { gpaScale } = useSettings();
  const [semesters, setSemesters] = useState<SavedSemester[]>([]);
  const [loaded, setLoaded] = useState(false);
  const semestersRef = useRef(semesters);
  semestersRef.current = semesters;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSemesters(JSON.parse(raw));
      } catch (e) {
        if (__DEV__) console.warn('[SemesterContext] Failed to load semesters:', e);
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((next: SavedSemester[]) => {
    setSemesters(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addSemester = useCallback((data: Omit<SavedSemester, 'id' | 'createdAt'>): string => {
    const id = generateId();
    const semester: SavedSemester = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    persist([...semestersRef.current, semester]);
    return id;
  }, [persist]);

  const updateSemester = useCallback((id: string, updates: Partial<Omit<SavedSemester, 'id' | 'createdAt'>>) => {
    persist(semestersRef.current.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, [persist]);

  const deleteSemester = useCallback((id: string) => {
    persist(semestersRef.current.filter((s) => s.id !== id));
  }, [persist]);

  const { cumulativeGpa, totalCredits } = useMemo(() => {
    const matching = semesters.filter((s) => s.gpaScale === gpaScale);
    if (matching.length === 0) return { cumulativeGpa: 0, totalCredits: 0 };
    let totalPoints = 0;
    let totalHrs = 0;
    for (const s of matching) {
      totalPoints += s.gpa * s.creditHours;
      totalHrs += s.creditHours;
    }
    return {
      cumulativeGpa: totalHrs > 0 ? totalPoints / totalHrs : 0,
      totalCredits: totalHrs,
    };
  }, [semesters, gpaScale]);

  return (
    <SemesterContext.Provider
      value={{ semesters, addSemester, updateSemester, deleteSemester, cumulativeGpa, totalCredits, loaded }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export const useSemesters = () => useContext(SemesterContext);
