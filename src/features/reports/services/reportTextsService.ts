import apiClient from '../../../api/apiClient';
import { FALLBACK_TEXTOS } from '../utils/documentTexts';

export async function getDocumentText(
  reportType: string,
  section: string
): Promise<string> {
  try {
    const response = await apiClient.get(`/report-texts/${reportType}/${section}`);
    return response.data?.contentTemplate;
  } catch {
    return FALLBACK_TEXTOS[reportType]?.[section] ?? '';
  }
}

export async function getAllDocumentTexts(): Promise<Record<string, Record<string, string>>> {
  try {
    const response = await apiClient.get('/report-texts');
    const textos = response.data?.data ?? [];
    const grouped: Record<string, Record<string, string>> = {};
    for (const t of textos) {
      if (!grouped[t.reportType]) grouped[t.reportType] = {};
      grouped[t.reportType][t.section] = t.contentTemplate;
    }
    return grouped;
  } catch {
    return FALLBACK_TEXTOS;
  }
}

export async function fetchDocumentTextsForReport(
  reportType: string,
  sections: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const fetches = sections.map(async (section) => {
    const text = await getDocumentText(reportType, section);
    result[section] = text;
  });
  await Promise.all(fetches);
  return result;
}

export const reportTextsService = {
  getText: getDocumentText,
  getAll: getAllDocumentTexts,
  getForReport: fetchDocumentTextsForReport,
};

export default reportTextsService;
