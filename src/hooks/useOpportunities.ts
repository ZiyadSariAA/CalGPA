import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { opportunities as fallbackData, type Opportunity, type OpportunityType } from '../data/opportunities';

/** Deterministic color from string hash */
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 40%)`;
}

function normalizeStatus(raw: string): 'open' | 'closed' {
  if (!raw) return 'closed';
  const lower = raw.toLowerCase().trim();
  if (lower === 'open' || lower === 'مفتوح') return 'open';
  return 'closed';
}

function normalizeType(source: string | undefined, type: string | undefined): OpportunityType | undefined {
  const raw = source || type || '';
  if (raw.includes('تطوير خريجين') || raw.toLowerCase().includes('gdp')) return 'gdp';
  if (raw.includes('تدريب تعاوني') || raw.toLowerCase().includes('coop')) return 'coop';
  return undefined;
}

type IconName = keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;

const KEYWORD_ICON_MAP: { keywords: string[]; icon: IconName; color: string }[] = [
  // بنوك ومالية
  { keywords: ['بنك', 'bank', 'مالية', 'finance', 'تمويل', 'محاسبة', 'accounting', 'استثمار', 'investment', 'مصرف', 'راجحي', 'أهلي', 'الإنماء', 'ساب', 'ساما', 'مالي'], icon: 'cash-outline', color: '#0D9488' },
  // تقنية وبرمجة
  { keywords: ['تقنية', 'برمجة', 'حاسب', 'IT', 'tech', 'software', 'computer', 'نظم معلومات', 'هندسة برمجيات', 'ذكاء اصطناعي', 'AI', 'أمن سيبراني', 'cyber', 'بيانات', 'data', 'digital', 'رقمي', 'STC', 'اتصالات', 'telecom', 'شبكات', 'network'], icon: 'laptop-outline', color: '#7C3AED' },
  // نفط وطاقة
  { keywords: ['نفط', 'بترول', 'oil', 'petroleum', 'طاقة', 'energy', 'أرامكو', 'aramco', 'سابك', 'sabic', 'غاز', 'gas', 'تعدين', 'mining', 'معادن'], icon: 'flame-outline', color: '#DC2626' },
  // صحة وطب
  { keywords: ['صحة', 'طب', 'health', 'medical', 'صيدلة', 'pharmacy', 'مستشفى', 'hospital', 'تمريض', 'nursing', 'أسنان', 'علاج', 'طبي'], icon: 'medkit-outline', color: '#E11D48' },
  // صناعة وهندسة
  { keywords: ['صناع', 'تصنيع', 'manufacturing', 'هندسة', 'engineering', 'مصنع', 'factory', 'صناعي', 'industrial', 'ميكانيك', 'كهرباء', 'electrical', 'مدني', 'civil', 'معماري'], icon: 'construct-outline', color: '#D97706' },
  // تعليم وأكاديمي
  { keywords: ['تعليم', 'جامعة', 'أكاديمية', 'academy', 'education', 'university', 'تدريب', 'training', 'معهد', 'institute', 'مدرسة', 'school', 'طالب', 'student', 'بحث', 'research'], icon: 'school-outline', color: '#2563EB' },
  // حكومة
  { keywords: ['وزارة', 'ministry', 'حكوم', 'government', 'هيئة', 'authority', 'مؤسسة', 'أمانة', 'بلدية', 'ديوان', 'نيوم', 'neom', 'رؤية', 'vision'], icon: 'business-outline', color: '#4338CA' },
  // تجارة وتسويق
  { keywords: ['تجار', 'commerce', 'تسويق', 'marketing', 'مبيعات', 'sales', 'إدارة أعمال', 'business', 'ريادة', 'موارد بشرية', 'HR', 'إدارة', 'management'], icon: 'storefront-outline', color: '#0891B2' },
  // قانون
  { keywords: ['قانون', 'law', 'legal', 'حقوق', 'محام', 'شريعة', 'نظام', 'قضاء'], icon: 'shield-checkmark-outline', color: '#6D28D9' },
  // لوجستيات ونقل
  { keywords: ['نقل', 'transport', 'لوجستي', 'logistics', 'شحن', 'shipping', 'طيران', 'aviation', 'سعودية', 'خطوط'], icon: 'airplane-outline', color: '#0284C7' },
  // إعلام وتصميم
  { keywords: ['إعلام', 'media', 'تصميم', 'design', 'فن', 'art', 'إبداع', 'creative', 'جرافيك', 'graphic', 'UX', 'UI'], icon: 'color-palette-outline', color: '#DB2777' },
  // زراعة وبيئة
  { keywords: ['زراع', 'agriculture', 'بيئة', 'environment', 'غذاء', 'food', 'مياه', 'water'], icon: 'leaf-outline', color: '#059669' },
];

function pickSmartIcon(company: string, majors: string[]): { icon: IconName; color: string } {
  const searchText = `${company} ${majors.join(' ')}`.toLowerCase();

  for (const entry of KEYWORD_ICON_MAP) {
    for (const kw of entry.keywords) {
      if (searchText.includes(kw.toLowerCase())) {
        return { icon: entry.icon, color: entry.color };
      }
    }
  }

  return { icon: 'briefcase-outline', color: hashColor(company) };
}

function mapFirestoreDoc(doc: any): Opportunity {
  const company = doc.company || doc.title || '';
  const majorsRaw = doc.specializations || '';
  const majors = majorsRaw
    ? majorsRaw.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  const smart = pickSmartIcon(company, majors);

  const opp: Opportunity = {
    id: doc.id,
    company: company,
    companyAr: company,
    program: doc.title || company,
    status: normalizeStatus(doc.status),
    type: normalizeType(doc.source, doc.type),
    logo: doc.logo || undefined,
    logoColor: hashColor(company),
    icon: smart.icon,
    smartIcon: smart.icon,
    smartIconColor: smart.color,
    link: doc.link || '',
    majors,
  };

  if (doc.deadline) {
    opp.nextOpening = typeof doc.deadline === 'object'
      ? (doc.deadline.repr || doc.deadline.value || '')
      : String(doc.deadline);
  }

  return opp;
}

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const snap = await getDocs(collection(db, 'opportunities'));
        if (cancelled) return;

        if (snap.empty) {
          setOpportunities(fallbackData);
        } else {
          const mapped = snap.docs.map((d) =>
            mapFirestoreDoc({ id: d.id, ...d.data() })
          );
          setOpportunities(mapped);
        }
      } catch (err) {
        if (__DEV__) console.warn('Firestore fetch failed, using fallback data:', err);
        if (!cancelled) setOpportunities(fallbackData);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { opportunities, loading };
}
