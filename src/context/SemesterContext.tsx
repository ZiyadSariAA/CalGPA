import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
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

  const persist = (next: SavedSemester[]) => {
    setSemesters(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addSemester = (data: Omit<SavedSemester, 'id' | 'createdAt'>): string => {
    const id = generateId();
    const semester: SavedSemester = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    persist([...semesters, semester]);
    return id;
  };

  const updateSemester = (id: string, updates: Partial<Omit<SavedSemester, 'id' | 'createdAt'>>) => {
    persist(semesters.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSemester = (id: string) => {
    persist(semesters.filter((s) => s.id !== id));
  };

  const { cumulativeGpa, totalCredits } = useMemo(() => {
    if (semesters.length === 0) return { cumulativeGpa: 0, totalCredits: 0 };
    const currentMax = gpaScale === '4' ? 4 : 5;
    let totalPoints = 0;
    let totalHrs = 0;
    for (const s of semesters) {
      const semesterMax = s.gpaScale === '4' ? 4 : 5;
      const normalizedGpa = (s.gpa / semesterMax) * currentMax;
      totalPoints += normalizedGpa * s.creditHours;
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
