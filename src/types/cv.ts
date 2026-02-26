export type CVEducation = {
  university: string;
  degree: string;
  major: string;
  gpa: string;
  graduationYear: string;
};

export type CVExperience = {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type CVProject = {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
};

export type CVCertification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
};

export type CVLanguage = {
  id: string;
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Beginner';
};

export type CVData = {
  personalInfo: {
    fullName: string;
    professionalTitle: string;
    email: string;
    phone: string;
    linkedin: string;
    location: string;
  };
  education: CVEducation;
  experiences: CVExperience[];
  skills: {
    technical: string[];
    soft: string[];
  };
  languages: CVLanguage[];
  summary: string;
  projects: CVProject[];
  certifications: CVCertification[];
};

export type CVTemplate = 'classic' | 'professional' | 'modern' | 'minimal' | 'executive';

export type CV = {
  id: string;
  name: string;
  data: CVData;
  template: CVTemplate;
  status: 'draft' | 'complete';
  createdAt: number;
  updatedAt: number;
};
