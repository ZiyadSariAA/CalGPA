export type OpportunityStatus = 'open' | 'closed';

export type OpportunityType = 'gdp' | 'coop';

export type Opportunity = {
  id: string;
  company: string;
  companyAr: string;
  program: string;
  status: OpportunityStatus;
  type?: OpportunityType;
  logo?: string;
  logoColor: string;
  icon: string;
  smartIcon: string;
  smartIconColor: string;
  link: string;
  majors: string[];
  dates?: { start: string; end: string };
  nextOpening?: string;
};

export const opportunities: Opportunity[] = [
  {
    id: '1',
    company: 'The Financial Academy',
    companyAr: 'الأكاديمية المالية',
    program: 'CBP',
    status: 'open',
    type: 'gdp',
    logoColor: '#1E3A8A',
    icon: 'cash-outline',
    smartIcon: 'cash-outline',
    smartIconColor: '#0D9488',
    link: 'https://fa.gov.sa',
    majors: ['Finance', 'Business', 'Accounting'],
    dates: { start: 'يناير', end: 'فبراير' },
  },
  {
    id: '2',
    company: 'GOSI',
    companyAr: 'التأمينات الاجتماعية',
    program: 'Nokhbah نخبة',
    status: 'open',
    type: 'gdp',
    logoColor: '#1D4ED8',
    icon: 'business-outline',
    smartIcon: 'business-outline',
    smartIconColor: '#4338CA',
    link: 'https://gosi.gov.sa',
    majors: ['IT', 'HR', 'Finance'],
    dates: { start: 'مارس', end: 'أبريل' },
  },
  {
    id: '3',
    company: 'NHC',
    companyAr: 'الشركة الوطنية للإسكان',
    program: 'Waaed واعد',
    status: 'open',
    type: 'gdp',
    logoColor: '#059669',
    icon: 'construct-outline',
    smartIcon: 'construct-outline',
    smartIconColor: '#D97706',
    link: 'https://nhc.sa',
    majors: ['Engineering', 'Business'],
    dates: { start: 'فبراير', end: 'مارس' },
  },
  {
    id: '4',
    company: 'Bank Albilad',
    companyAr: 'بنك البلاد',
    program: "Bilad's Future",
    status: 'open',
    type: 'gdp',
    logoColor: '#DC2626',
    icon: 'cash-outline',
    smartIcon: 'cash-outline',
    smartIconColor: '#0D9488',
    link: 'https://bankalbilad.com',
    majors: ['Finance', 'IT'],
    dates: { start: 'يناير', end: 'مارس' },
  },
  {
    id: '5',
    company: 'Zain',
    companyAr: 'زين',
    program: 'Evolve',
    status: 'open',
    type: 'gdp',
    logoColor: '#7C3AED',
    icon: 'laptop-outline',
    smartIcon: 'laptop-outline',
    smartIconColor: '#7C3AED',
    link: 'https://zain.com',
    majors: ['IT', 'Marketing', 'Engineering'],
    dates: { start: 'أبريل', end: 'مايو' },
  },
  {
    id: '6',
    company: 'SABIC',
    companyAr: 'سابك',
    program: 'Leadership',
    status: 'closed',
    type: 'gdp',
    logoColor: '#0891B2',
    icon: 'flame-outline',
    smartIcon: 'flame-outline',
    smartIconColor: '#DC2626',
    link: 'https://sabic.com',
    majors: ['Engineering', 'Chemistry'],
    nextOpening: 'سبتمبر 2025',
  },
  {
    id: '7',
    company: 'Aramco',
    companyAr: 'أرامكو',
    program: 'CDPNE',
    status: 'closed',
    type: 'gdp',
    logoColor: '#065F46',
    icon: 'flame-outline',
    smartIcon: 'flame-outline',
    smartIconColor: '#DC2626',
    link: 'https://aramco.com',
    majors: ['Engineering', 'IT', 'Geoscience'],
    nextOpening: 'أكتوبر 2025',
  },
  {
    id: '8',
    company: 'STC',
    companyAr: 'الاتصالات السعودية',
    program: 'Talent',
    status: 'closed',
    type: 'gdp',
    logoColor: '#4F46E5',
    icon: 'laptop-outline',
    smartIcon: 'laptop-outline',
    smartIconColor: '#7C3AED',
    link: 'https://stc.com.sa',
    majors: ['IT', 'Business', 'Engineering'],
    nextOpening: 'يوليو 2025',
  },
  {
    id: '9',
    company: 'Tamara',
    companyAr: 'تمارا',
    program: 'Builders',
    status: 'closed',
    type: 'gdp',
    logoColor: '#0D9488',
    icon: 'laptop-outline',
    smartIcon: 'laptop-outline',
    smartIconColor: '#7C3AED',
    link: 'https://tamara.co',
    majors: ['Engineering', 'Product', 'Data'],
    nextOpening: 'أغسطس 2025',
  },
  {
    id: '10',
    company: 'Saudi Downtown',
    companyAr: 'داون تاون السعودية',
    program: 'TUMOOH',
    status: 'closed',
    type: 'gdp',
    logoColor: '#EA580C',
    icon: 'construct-outline',
    smartIcon: 'construct-outline',
    smartIconColor: '#D97706',
    link: 'https://sdc.com.sa',
    majors: ['Architecture', 'Business'],
    nextOpening: 'نوفمبر 2025',
  },
];
