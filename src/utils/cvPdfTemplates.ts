import type { CVData, CVTemplate } from '../types/cv';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTemplateCSS(template: CVTemplate): string {
  switch (template) {
    /* ── Classic: Serif, centered header, traditional horizontal rules ── */
    case 'classic':
      return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #1A1A1A; line-height: 1.6; padding: 44px; }
        .header { text-align: center; margin-bottom: 14px; }
        .name { font-size: 24px; font-weight: 700; font-family: 'Times New Roman', Times, serif; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
        .prof-title { font-size: 13px; color: #555; margin-bottom: 4px; font-style: italic; }
        .contact { font-size: 11px; color: #555; }
        .section { margin-bottom: 16px; }
        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 2px solid #1A1A1A; }
        .bold { font-weight: 600; font-size: 12px; }
        .subtitle { font-size: 11px; color: #555; margin-bottom: 4px; }
        .body { font-size: 12px; color: #333; }
        .exp-block { margin-bottom: 10px; }
        .bullet { font-size: 12px; color: #333; padding-left: 12px; }
        .divider { height: 2px; background: #1A1A1A; margin: 14px 0; }
      `;

    /* ── Professional: Clean sans-serif, bold dark section borders, compact ── */
    case 'professional':
      return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11.5px; color: #1A1A1A; line-height: 1.5; padding: 36px; }
        .header { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 3px solid #1A1A1A; }
        .name { font-size: 24px; font-weight: 700; margin-bottom: 2px; }
        .prof-title { font-size: 13px; color: #444; margin-bottom: 4px; }
        .contact { font-size: 10.5px; color: #555; }
        .section { margin-bottom: 14px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 2px solid #333; }
        .bold { font-weight: 700; font-size: 12px; }
        .subtitle { font-size: 11px; color: #555; margin-bottom: 3px; }
        .body { font-size: 11.5px; color: #333; }
        .exp-block { margin-bottom: 10px; }
        .bullet { font-size: 11.5px; color: #333; padding-left: 10px; }
        .divider { display: none; }
      `;

    /* ── Modern: Accent color left borders, open feel, no heavy lines ── */
    case 'modern':
      return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-size: 12px; color: #2C2C2C; line-height: 1.55; padding: 40px; }
        .header { border-left: 5px solid #2D5A3D; padding-left: 18px; margin-bottom: 18px; }
        .name { font-size: 26px; font-weight: 700; color: #2D5A3D; margin-bottom: 2px; }
        .prof-title { font-size: 14px; color: #555; margin-bottom: 4px; }
        .contact { font-size: 11px; color: #666; }
        .section { margin-bottom: 16px; border-left: 3px solid #2D5A3D; padding-left: 14px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #2D5A3D; margin-bottom: 6px; border-bottom: none; }
        .bold { font-weight: 600; font-size: 12px; }
        .subtitle { font-size: 11px; color: #777; margin-bottom: 4px; }
        .body { font-size: 12px; color: #444; }
        .exp-block { margin-bottom: 10px; }
        .bullet { font-size: 12px; color: #444; padding-left: 8px; }
        .divider { display: none; }
      `;

    /* ── Minimal: Maximum whitespace, light lines, airy layout ── */
    case 'minimal':
      return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.75; padding: 48px; }
        .header { margin-bottom: 24px; }
        .name { font-size: 22px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; color: #1A1A1A; margin-bottom: 4px; }
        .prof-title { font-size: 13px; color: #888; font-weight: 300; margin-bottom: 6px; }
        .contact { font-size: 11px; color: #999; }
        .section { margin-bottom: 22px; }
        .section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2.5px; color: #999; margin-bottom: 8px; border-bottom: none; }
        .bold { font-weight: 500; font-size: 12px; color: #1A1A1A; }
        .subtitle { font-size: 11px; color: #999; margin-bottom: 4px; }
        .body { font-size: 12px; color: #555; }
        .exp-block { margin-bottom: 12px; }
        .bullet { font-size: 12px; color: #555; padding-left: 8px; }
        .divider { display: none; }
      `;

    /* ── Executive: Large name, formal spacing, strong hierarchy ── */
    case 'executive':
      return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #1A1A1A; line-height: 1.6; padding: 50px; }
        .header { text-align: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #999; }
        .name { font-size: 32px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
        .prof-title { font-size: 15px; color: #555; font-style: italic; margin-bottom: 6px; }
        .contact { font-size: 11px; color: #666; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #CCC; }
        .bold { font-weight: 700; font-size: 13px; }
        .subtitle { font-size: 11px; color: #666; margin-bottom: 4px; }
        .body { font-size: 12px; color: #333; }
        .exp-block { margin-bottom: 12px; }
        .bullet { font-size: 12px; color: #333; padding-left: 10px; }
        .divider { height: 1px; background: #CCC; margin: 16px 0; }
      `;

    default:
      return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1A1A1A; line-height: 1.5; padding: 40px; }
        .header { margin-bottom: 16px; }
        .name { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .prof-title { font-size: 13px; color: #555; margin-bottom: 4px; }
        .contact { font-size: 11px; color: #6B6B6B; }
        .section { margin-bottom: 16px; }
        .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #E5E5E5; }
        .bold { font-weight: 600; }
        .subtitle { font-size: 11px; color: #6B6B6B; margin-bottom: 4px; }
        .body { font-size: 12px; color: #333; }
        .exp-block { margin-bottom: 10px; }
        .bullet { font-size: 12px; color: #333; padding-left: 8px; }
        .divider { height: 1px; background: #E5E5E5; margin: 12px 0; }
      `;
  }
}

export function generateCVHtml(data: CVData, template: CVTemplate): string {
  const css = getTemplateCSS(template);
  const p = data.personalInfo;

  const contactParts = [p.email, p.phone, p.location].filter(Boolean);
  const contactLine = contactParts.map(escapeHtml).join('  |  ');

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>`;

  // Header
  html += `<div class="header">`;
  html += `<div class="name">${escapeHtml(p.fullName)}</div>`;
  if (p.professionalTitle) {
    html += `<div class="prof-title">${escapeHtml(p.professionalTitle)}</div>`;
  }
  html += `<div class="contact">${contactLine}</div>`;
  if (p.linkedin) {
    html += `<div class="contact">${escapeHtml(p.linkedin)}</div>`;
  }
  html += `</div>`;

  if (template !== 'minimal') {
    html += `<div class="divider"></div>`;
  }

  // Summary
  if (data.summary.trim()) {
    html += `<div class="section">`;
    html += `<div class="section-title">PROFESSIONAL SUMMARY</div>`;
    html += `<div class="body">${escapeHtml(data.summary)}</div>`;
    html += `</div>`;
  }

  // Education
  const edu = data.education;
  if (edu.university || edu.degree || edu.major) {
    html += `<div class="section">`;
    html += `<div class="section-title">EDUCATION</div>`;
    html += `<div class="bold">${escapeHtml(edu.degree)}${edu.major ? ` in ${escapeHtml(edu.major)}` : ''}</div>`;
    const eduDetails = [edu.university, edu.gpa ? `GPA: ${edu.gpa}` : '', edu.graduationYear].filter(Boolean);
    html += `<div class="body">${eduDetails.map(escapeHtml).join(' — ')}</div>`;
    html += `</div>`;
  }

  // Experience
  const validExps = data.experiences.filter((e) => e.jobTitle || e.company);
  if (validExps.length > 0) {
    html += `<div class="section">`;
    html += `<div class="section-title">WORK EXPERIENCE</div>`;
    for (const exp of validExps) {
      html += `<div class="exp-block">`;
      html += `<div class="bold">${escapeHtml(exp.jobTitle)}</div>`;
      const dateLine = [exp.company, `${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : ''}`].filter(Boolean);
      html += `<div class="subtitle">${dateLine.map(escapeHtml).join(' — ')}</div>`;
      if (exp.description.trim()) {
        for (const line of exp.description.split('\n').filter(Boolean)) {
          html += `<div class="bullet">• ${escapeHtml(line.replace(/^[\•\-\*\–\—]\s*/, ''))}</div>`;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Projects
  const validProjects = (data.projects || []).filter((p) => p.name.trim());
  if (validProjects.length > 0) {
    html += `<div class="section">`;
    html += `<div class="section-title">PROJECTS</div>`;
    for (const p of validProjects) {
      html += `<div class="exp-block">`;
      html += `<div class="bold">${escapeHtml(p.name)}</div>`;
      if (p.description.trim()) {
        html += `<div class="body">${escapeHtml(p.description)}</div>`;
      }
      if (p.technologies.trim()) {
        html += `<p><em>${escapeHtml(p.technologies)}</em></p>`;
      }
      if (p.link.trim()) {
        html += `<p>${escapeHtml(p.link)}</p>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Skills
  const hasTechnical = data.skills.technical.length > 0;
  const hasSoft = data.skills.soft.length > 0;
  if (hasTechnical || hasSoft) {
    html += `<div class="section">`;
    html += `<div class="section-title">SKILLS</div>`;
    if (hasTechnical) {
      html += `<div class="body"><strong>Technical:</strong> ${data.skills.technical.map(escapeHtml).join(', ')}</div>`;
    }
    if (hasSoft) {
      html += `<div class="body"><strong>Soft Skills:</strong> ${data.skills.soft.map(escapeHtml).join(', ')}</div>`;
    }
    html += `</div>`;
  }

  // Languages
  const validLangs = data.languages.filter((l) => l.language.trim());
  if (validLangs.length > 0) {
    html += `<div class="section">`;
    html += `<div class="section-title">LANGUAGES</div>`;
    for (const l of validLangs) {
      html += `<div class="body">${escapeHtml(l.language)} — ${l.proficiency}</div>`;
    }
    html += `</div>`;
  }

  // Certifications
  if (data.certifications.length > 0) {
    html += `<div class="section">`;
    html += `<div class="section-title">CERTIFICATIONS</div>`;
    for (const c of data.certifications) {
      html += `<div class="body">${escapeHtml(c.name)} — ${escapeHtml(c.issuer)}${c.date ? ` (${escapeHtml(c.date)})` : ''}</div>`;
    }
    html += `</div>`;
  }

  html += `</body></html>`;
  return html;
}
