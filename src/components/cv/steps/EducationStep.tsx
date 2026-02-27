import { View } from 'react-native';
import { Field } from '../../common';
import DropdownField from '../../DropdownField';
import { useThemeColors } from '../../../theme';
import { SAUDI_UNIVERSITIES, DEGREE_OPTIONS, GRADUATION_YEARS } from '../../../data/cvFormConstants';
import type { CVData } from '../../../types/cv';

type Props = {
  data: CVData;
  onChange: (d: CVData) => void;
};

export default function EducationStep({ data, onChange }: Props) {
  const colors = useThemeColors();
  const e = data.education;
  const set = (key: keyof typeof e, val: string) =>
    onChange({ ...data, education: { ...e, [key]: val } });

  return (
    <View style={{ gap: 8 }}>
      <DropdownField
        label="الجامعة"
        value={e.university}
        options={[...SAUDI_UNIVERSITIES]}
        onSelect={(v) => set('university', v)}
        placeholder="Select University"
        allowCustom
        colors={colors}
      />
      <DropdownField
        label="الدرجة العلمية"
        value={e.degree}
        options={[...DEGREE_OPTIONS]}
        onSelect={(v) => set('degree', v)}
        placeholder="Select Degree"
        colors={colors}
      />
      <Field label="التخصص" value={e.major} onChangeText={(v) => set('major', v)} placeholder="Major" />
      <Field label="المعدل" value={e.gpa} onChangeText={(v) => set('gpa', v)} placeholder="GPA" keyboardType="numeric" />
      <DropdownField
        label="سنة التخرج"
        value={e.graduationYear}
        options={GRADUATION_YEARS}
        onSelect={(v) => set('graduationYear', v)}
        placeholder="Select Year"
        colors={colors}
      />
    </View>
  );
}
