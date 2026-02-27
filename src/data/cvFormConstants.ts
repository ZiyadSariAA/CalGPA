import type { Ionicons } from '@expo/vector-icons';

export type FieldKey = 'tech' | 'medical' | 'business' | 'engineering' | 'design' | 'education' | 'law' | 'other';

export const STEPS = [
  { key: 'personal', title: 'المعلومات الشخصية', icon: 'person' as const },
  { key: 'education', title: 'التعليم', icon: 'school' as const },
  { key: 'experience', title: 'الخبرات', icon: 'briefcase' as const },
  { key: 'projects', title: 'المشاريع', icon: 'rocket' as const },
  { key: 'skills', title: 'المهارات واللغات', icon: 'bulb' as const },
  { key: 'summary', title: 'الملخص والشهادات', icon: 'ribbon' as const },
  { key: 'template', title: 'القالب', icon: 'color-palette' as const },
];

export const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Beginner'] as const;

export const COMMON_LANGUAGES = [
  'Arabic', 'English', 'French', 'Spanish', 'German',
  'Chinese', 'Japanese', 'Korean', 'Turkish', 'Urdu',
] as const;

export const FIELDS: { key: FieldKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'tech', label: 'تقنية المعلومات', icon: 'code-slash' },
  { key: 'medical', label: 'طبي / صحي', icon: 'medkit' },
  { key: 'business', label: 'إدارة أعمال', icon: 'trending-up' },
  { key: 'engineering', label: 'هندسة', icon: 'construct' },
  { key: 'design', label: 'تصميم', icon: 'color-palette' },
  { key: 'education', label: 'تعليم', icon: 'book' },
  { key: 'law', label: 'قانون', icon: 'document-text' },
  { key: 'other', label: 'أخرى', icon: 'ellipsis-horizontal' },
];

export const FIELD_SKILLS: Record<FieldKey, string[]> = {
  tech: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'React Native',
    'Node.js', 'SQL', 'MongoDB', 'Git', 'Docker', 'AWS', 'REST APIs',
    'CI/CD', 'Agile', 'Linux', 'Data Structures', 'Machine Learning', 'Cybersecurity',
  ],
  medical: [
    'Patient Care', 'Clinical Assessment', 'Electronic Health Records (EHR)',
    'Medical Terminology', 'HIPAA Compliance', 'CPR/BLS Certified',
    'Vital Signs Monitoring', 'Infection Control', 'Pharmacology',
    'Lab Analysis', 'Radiology', 'Surgical Assistance', 'Triage',
    'Patient Education', 'Medical Research',
  ],
  business: [
    'Financial Analysis', 'Project Management', 'Strategic Planning', 'Marketing',
    'Sales', 'CRM (Salesforce)', 'Data Analysis', 'Excel', 'Power BI',
    'Budgeting', 'Supply Chain Management', 'Business Development',
    'Market Research', 'Accounting', 'SAP',
  ],
  engineering: [
    'AutoCAD', 'SolidWorks', 'MATLAB', 'Structural Analysis', 'Project Management',
    'Quality Control', 'Lean Manufacturing', 'PLC Programming', 'Electrical Circuits',
    'Thermodynamics', 'CAD/CAM', 'Six Sigma', 'Technical Drawing',
    'Safety Standards', 'BIM',
  ],
  design: [
    'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Sketch',
    'UI/UX Design', 'Wireframing', 'Prototyping', 'Typography',
    'Branding', 'Motion Graphics', 'After Effects', 'InDesign',
    'Design Systems', 'User Research',
  ],
  education: [
    'Curriculum Development', 'Classroom Management', 'Lesson Planning',
    'Student Assessment', 'E-Learning', 'Educational Technology',
    'Special Education', 'Differentiated Instruction', 'Mentoring',
    'Academic Advising', 'Research', 'Public Speaking',
    'Learning Management Systems (LMS)', 'Tutoring', 'Content Creation',
  ],
  law: [
    'Legal Research', 'Contract Drafting', 'Litigation', 'Compliance',
    'Corporate Law', 'Intellectual Property', 'Case Management',
    'Legal Writing', 'Negotiation', 'Due Diligence', 'Regulatory Analysis',
    'Client Counseling', 'Court Procedures', 'Arbitration', 'Legal Documentation',
  ],
  other: [
    'Microsoft Office', 'Data Entry', 'Customer Service', 'Research',
    'Writing', 'Social Media Management', 'Event Planning',
    'Translation', 'Content Creation', 'Photography',
  ],
};

export const SOFT_SKILLS = [
  'Teamwork', 'Communication', 'Problem Solving', 'Time Management',
  'Leadership', 'Adaptability', 'Critical Thinking', 'Work Under Pressure',
  'Attention to Detail', 'Creativity', 'Conflict Resolution', 'Decision Making',
  'Multitasking', 'Organization', 'Interpersonal Skills', 'Emotional Intelligence',
];

export const SAUDI_UNIVERSITIES = [
  'King Abdulaziz University',
  'King Saud University',
  'King Fahd University of Petroleum and Minerals',
  'KAUST',
  'Imam Abdulrahman Bin Faisal University',
  'Umm Al-Qura University',
  'King Khalid University',
  'Taif University',
  'Jazan University',
  'University of Tabuk',
  'University of Hail',
  'Najran University',
  'Al-Jouf University',
  'Albaha University',
  'Northern Border University',
  'Shaqra University',
  'Majmaah University',
  'Princess Nourah University',
  'Prince Sultan University',
  'Dar Al-Hekma University',
  'Effat University',
  'Alfaisal University',
] as const;

export const DEGREE_OPTIONS = ["Diploma", "Bachelor's", "Master's", "PhD"] as const;

export const GRADUATION_YEARS = Array.from({ length: 31 }, (_, i) => String(2030 - i));

export const nextId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
