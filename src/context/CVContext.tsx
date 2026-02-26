import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_CV_DATA } from '../data/cvDummyData';
import type { CV, CVData, CVTemplate } from '../types/cv';

type CVContextType = {
  cvs: CV[];
  loaded: boolean;
  currentCvId: string | null;
  currentCvData: CVData | null;
  currentTemplate: CVTemplate;
  createNewCV: () => string;
  loadCV: (id: string) => void;
  updateCurrentData: (data: CVData) => void;
  updateCurrentTemplate: (template: CVTemplate) => void;
  saveAsComplete: () => void;
  deleteCV: (id: string) => void;
  updateCVData: (id: string, partial: Partial<CVData>) => void;
  getCVById: (id: string) => CV | undefined;
};

const STORAGE_KEY = 'cv_list';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const CVContext = createContext<CVContextType>({
  cvs: [],
  loaded: false,
  currentCvId: null,
  currentCvData: null,
  currentTemplate: 'professional',
  createNewCV: () => '',
  loadCV: () => {},
  updateCurrentData: () => {},
  updateCurrentTemplate: () => {},
  saveAsComplete: () => {},
  deleteCV: () => {},
  updateCVData: () => {},
  getCVById: () => undefined,
});

export function CVProvider({ children }: { children: ReactNode }) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentCvId, setCurrentCvId] = useState<string | null>(null);
  const [currentCvData, setCurrentCvData] = useState<CVData | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<CVTemplate>('professional');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cvsRef = useRef(cvs);
  cvsRef.current = cvs;

  // Hydrate from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: CV[] = JSON.parse(raw);
          const migrated = parsed.map(cv => {
            const d = { ...cv.data } as any;
            if (Array.isArray(d.skills)) {
              d.skills = { technical: d.skills, soft: [] };
            }
            if (!d.personalInfo.professionalTitle) {
              d.personalInfo = { ...d.personalInfo, professionalTitle: '' };
            }
            if (!Array.isArray(d.projects)) {
              d.projects = [];
            }
            return { ...cv, data: d as typeof cv.data };
          });
          setCvs(migrated);
        }
      } catch (e) {
        if (__DEV__) console.warn('[CVContext] Failed to load CVs:', e);
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((next: CV[]) => {
    setCvs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const createNewCV = useCallback((): string => {
    const id = generateId();
    const now = Date.now();
    const newCV: CV = {
      id,
      name: 'New CV',
      data: { ...EMPTY_CV_DATA, experiences: [{ ...EMPTY_CV_DATA.experiences[0] }], languages: [{ ...EMPTY_CV_DATA.languages[0] }] },
      template: 'professional',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    const next = [...cvsRef.current, newCV];
    persist(next);
    setCurrentCvId(id);
    setCurrentCvData(newCV.data);
    setCurrentTemplate(newCV.template);
    return id;
  }, [persist]);

  const loadCV = useCallback((id: string) => {
    const cv = cvsRef.current.find((c) => c.id === id);
    if (cv) {
      setCurrentCvId(id);
      let data = { ...cv.data } as any;
      if (Array.isArray(data.skills)) {
        data.skills = { technical: data.skills as unknown as string[], soft: [] };
      }
      if (!Array.isArray(data.projects)) {
        data.projects = [];
      }
      setCurrentCvData(data as typeof cv.data);
      setCurrentTemplate(cv.template);
    }
  }, []);

  const updateCurrentData = useCallback((data: CVData) => {
    setCurrentCvData(data);
    // Debounced auto-save as draft
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCvs((prev) => {
        const next = prev.map((cv) =>
          cv.id === currentCvId
            ? { ...cv, data, name: data.personalInfo.fullName || 'New CV', updatedAt: Date.now() }
            : cv,
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }, 1000);
  }, [currentCvId]);

  const updateCurrentTemplate = useCallback((template: CVTemplate) => {
    setCurrentTemplate(template);
    if (currentCvId) {
      setCvs((prev) => {
        const next = prev.map((cv) =>
          cv.id === currentCvId ? { ...cv, template, updatedAt: Date.now() } : cv,
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [currentCvId]);

  const saveAsComplete = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCvs((prev) => {
      const next = prev.map((cv) =>
        cv.id === currentCvId
          ? {
              ...cv,
              data: currentCvData!,
              template: currentTemplate,
              name: currentCvData?.personalInfo.fullName || 'New CV',
              status: 'complete' as const,
              updatedAt: Date.now(),
            }
          : cv,
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [currentCvId, currentCvData, currentTemplate]);

  const deleteCV = useCallback((id: string) => {
    const next = cvsRef.current.filter((c) => c.id !== id);
    persist(next);
    if (currentCvId === id) {
      setCurrentCvId(null);
      setCurrentCvData(null);
    }
  }, [persist, currentCvId]);

  const updateCVData = useCallback((id: string, partial: Partial<CVData>) => {
    setCvs((prev) => {
      const next = prev.map((cv) =>
        cv.id === id
          ? { ...cv, data: { ...cv.data, ...partial }, updatedAt: Date.now() }
          : cv,
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    // Also update current editing state if it's the same CV
    if (id === currentCvId && currentCvData) {
      setCurrentCvData((prev) => (prev ? { ...prev, ...partial } : prev));
    }
  }, [currentCvId, currentCvData]);

  const getCVById = useCallback((id: string): CV | undefined => {
    return cvsRef.current.find((c) => c.id === id);
  }, []);

  return (
    <CVContext.Provider
      value={{
        cvs,
        loaded,
        currentCvId,
        currentCvData,
        currentTemplate,
        createNewCV,
        loadCV,
        updateCurrentData,
        updateCurrentTemplate,
        saveAsComplete,
        deleteCV,
        updateCVData,
        getCVById,
      }}
    >
      {children}
    </CVContext.Provider>
  );
}

export const useCV = () => useContext(CVContext);
