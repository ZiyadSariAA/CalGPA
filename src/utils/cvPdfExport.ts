import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateCVHtml } from './cvPdfTemplates';
import type { CVData, CVTemplate } from '../types/cv';

export async function exportCVAsPdf(
  data: CVData,
  template: CVTemplate,
  filename?: string,
): Promise<void> {
  const html = generateCVHtml(data, template);
  const fullName = data.personalInfo.fullName?.trim();
  const title = data.personalInfo.professionalTitle?.trim();
  const parts = [fullName, title].filter(Boolean).join(' - ');
  const name = parts || filename || 'CV';
  const sanitized = name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'CV';

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `${sanitized}.pdf`,
    UTI: 'com.adobe.pdf',
  });
}
