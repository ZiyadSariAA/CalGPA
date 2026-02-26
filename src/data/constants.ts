export const APP_INFO = {
  name: 'CalGPA',
  version: '1.0.0',
  supportEmail: 'support@calgpa.app',
} as const;

export const UNIVERSITIES = [
  { id: 'kau', label: 'جامعة الملك عبدالعزيز (KAU)' },
  { id: 'ksu', label: 'جامعة الملك سعود (KSU)' },
  { id: 'kfupm', label: 'جامعة الملك فهد للبترول (KFUPM)' },
  { id: 'imam', label: 'جامعة الإمام' },
  { id: 'other', label: 'أخرى' },
] as const;

type Grade = {
  label: string;
  ar: string;
  min: number;
  max: number;
  points: number;
};

type GpaScaleConfig = {
  max: number;
  grades: Grade[];
};

export const GPA_SCALES: Record<'4' | '5', GpaScaleConfig> = {
  '5': {
    max: 5,
    grades: [
      { label: 'A+', ar: 'ممتاز مرتفع', min: 4.75, max: 5.0, points: 5.0 },
      { label: 'A', ar: 'ممتاز', min: 4.5, max: 4.74, points: 4.75 },
      { label: 'B+', ar: 'جيد جداً مرتفع', min: 4.0, max: 4.49, points: 4.5 },
      { label: 'B', ar: 'جيد جداً', min: 3.5, max: 3.99, points: 4.0 },
      { label: 'C+', ar: 'جيد مرتفع', min: 3.0, max: 3.49, points: 3.5 },
      { label: 'C', ar: 'جيد', min: 2.5, max: 2.99, points: 3.0 },
      { label: 'D+', ar: 'مقبول مرتفع', min: 2.0, max: 2.49, points: 2.5 },
      { label: 'D', ar: 'مقبول', min: 1.0, max: 1.99, points: 2.0 },
      { label: 'F', ar: 'راسب', min: 0, max: 0.99, points: 1.0 },
    ],
  },
  '4': {
    max: 4,
    grades: [
      { label: 'A', ar: 'ممتاز', min: 3.75, max: 4.0, points: 4.0 },
      { label: 'A-', ar: 'ممتاز مرتفع', min: 3.5, max: 3.74, points: 3.7 },
      { label: 'B+', ar: 'جيد جداً مرتفع', min: 3.25, max: 3.49, points: 3.3 },
      { label: 'B', ar: 'جيد جداً', min: 3.0, max: 3.24, points: 3.0 },
      { label: 'B-', ar: 'جيد جداً منخفض', min: 2.75, max: 2.99, points: 2.7 },
      { label: 'C+', ar: 'جيد مرتفع', min: 2.5, max: 2.74, points: 2.3 },
      { label: 'C', ar: 'جيد', min: 2.25, max: 2.49, points: 2.0 },
      { label: 'C-', ar: 'جيد منخفض', min: 2.0, max: 2.24, points: 1.7 },
      { label: 'D+', ar: 'مقبول مرتفع', min: 1.75, max: 1.99, points: 1.3 },
      { label: 'D', ar: 'مقبول', min: 1.5, max: 1.74, points: 1.0 },
      { label: 'F', ar: 'راسب', min: 0, max: 1.49, points: 0.0 },
    ],
  },
} as const;
