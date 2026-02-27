import type { CVData } from '../types/cv';

export const EMPTY_CV_DATA: CVData = {
  personalInfo: {
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
  },
  education: {
    university: '',
    degree: '',
    major: '',
    gpa: '',
    graduationYear: '',
  },
  experiences: [
    {
      id: '1',
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  ],
  skills: { technical: [], soft: [] },
  languages: [
    { id: '1', language: '', proficiency: 'Intermediate' },
  ],
  summary: '',
  projects: [],
  certifications: [],
};

export const TEMPLATE_INFO = [
  {
    id: 'classic' as const,
    name: 'Classic',
    nameAr: 'كلاسيكي',
    description: 'ATS-optimized single-column layout with standard section headers and clean formatting',
  },
  {
    id: 'professional' as const,
    name: 'Professional',
    nameAr: 'احترافي',
    description: 'ATS-friendly sans-serif design — no tables, no graphics, parsed perfectly by all ATS systems',
  },
  {
    id: 'modern' as const,
    name: 'Modern',
    nameAr: 'عصري',
    description: 'Clean single-column with subtle accent — fully ATS-compatible, no text boxes or columns',
  },
  {
    id: 'minimal' as const,
    name: 'Minimal',
    nameAr: 'بسيط',
    description: 'Maximum readability with simple lines — ideal for ATS parsing with zero formatting issues',
  },
  {
    id: 'executive' as const,
    name: 'Executive',
    nameAr: 'تنفيذي',
    description: 'Formal ATS-safe structure with prominent name and standard chronological layout',
  },
];
