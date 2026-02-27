import { View } from 'react-native';
import { Field } from '../../common';
import LocationSearchField from '../../LocationSearchField';
import { useThemeColors } from '../../../theme';
import type { CVData } from '../../../types/cv';

type Props = {
  data: CVData;
  onChange: (d: CVData) => void;
};

export default function PersonalInfoStep({ data, onChange }: Props) {
  const colors = useThemeColors();
  const p = data.personalInfo;
  const set = (key: keyof typeof p, val: string) =>
    onChange({ ...data, personalInfo: { ...p, [key]: val } });

  return (
    <View style={{ gap: 8 }}>
      <Field label="الاسم الكامل" value={p.fullName} onChangeText={(v) => set('fullName', v)} placeholder="Full Name" />
      <Field label="البريد الإلكتروني" value={p.email} onChangeText={(v) => set('email', v)} placeholder="Email" keyboardType="email-address" />
      <Field label="رقم الهاتف" value={p.phone} onChangeText={(v) => set('phone', v)} placeholder="Phone" keyboardType="phone-pad" />
      <Field label="رابط LinkedIn" value={p.linkedin} onChangeText={(v) => set('linkedin', v)} placeholder="linkedin.com/in/..." />
      <LocationSearchField
        label="الموقع"
        value={p.location}
        onSelect={(v) => set('location', v)}
        placeholder="Search city..."
        colors={colors}
      />
    </View>
  );
}
