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

/**
 * Merge two text data maps: fallback provides defaults, API data overrides matching keys.
 * Keys present only in API data are added; keys only in fallback are preserved.
 */
export function mergeTextData(
  fallback: Record<string, Record<string, string>>,
  apiData: Record<string, Record<string, string>>
): Record<string, Record<string, string>> {
  const merged: Record<string, Record<string, string>> = {};
  const allKeys = new Set([...Object.keys(fallback), ...Object.keys(apiData)]);
  for (const key of allKeys) {
    merged[key] = { ...(fallback as any)[key], ...apiData[key] };
  }
  return merged;
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
    // Merge fallbacks with API data: API overrides where it has data, fallback fills gaps
    return mergeTextData(FALLBACK_TEXTOS, grouped);
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
