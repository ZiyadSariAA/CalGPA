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

export const DUMMY_CV_DATA: CVData = {
  personalInfo: {
    fullName: 'Ahmed Al-Rashidi',
    professionalTitle: 'Software Engineer',
    email: 'ahmed.rashidi@email.com',
    phone: '+966 55 123 4567',
    linkedin: 'linkedin.com/in/ahmed-rashidi',
    location: 'Jeddah, Saudi Arabia',
  },
  education: {
    university: 'King Abdulaziz University',
    degree: 'Bachelor of Science',
    major: 'Computer Science',
    gpa: '4.50',
    graduationYear: '2026',
  },
  experiences: [
    {
      id: '1',
      jobTitle: 'Software Engineering Intern',
      company: 'Saudi Aramco',
      startDate: 'Jun 2025',
      endDate: 'Aug 2025',
      description: 'Developed internal tools using React and Node.js.\nCollaborated with cross-functional teams on API design.\nImproved build pipeline reducing deploy time by 30%.',
    },
    {
      id: '2',
      jobTitle: 'Teaching Assistant',
      company: 'King Abdulaziz University',
      startDate: 'Sep 2024',
      endDate: 'May 2025',
      description: 'Assisted in Data Structures and Algorithms course.\nConducted weekly lab sessions for 40+ students.\nCreated practice problems and grading rubrics.',
    },
  ],
  skills: {
    technical: ['JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js', 'Python', 'SQL', 'Git', 'Figma', 'Agile'],
    soft: [],
  },
  languages: [
    { id: '1', language: 'Arabic', proficiency: 'Native' },
    { id: '2', language: 'English', proficiency: 'Fluent' },
  ],
  summary:
    'Motivated Computer Science student with hands-on experience in full-stack development and a strong academic record. Passionate about building user-centric mobile and web applications. Seeking a graduate software engineering role.',
  projects: [
    {
      id: '1',
      name: 'CalGPA Mobile App',
      description: 'Built a cross-platform GPA calculator app with CV builder feature using React Native and Expo.',
      technologies: 'React Native, TypeScript, Expo, AsyncStorage',
      link: 'github.com/ahmed/calgpa',
    },
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: 'Mar 2025',
    },
  ],
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
