export type TabType = 'auth' | 'changes' | 'activities';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    let date: Date;
    if (typeof dateStr === 'string') {
      if (dateStr.includes('Z') || dateStr.includes('+')) {
        date = new Date(dateStr);
      } else if (dateStr.includes('T') && !dateStr.includes('Z')) {
        date = new Date(dateStr);
      } else if (dateStr.includes(' ') && !dateStr.includes('T')) {
        date = new Date(dateStr.replace(' ', 'T'));
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) {
      return String(dateStr);
    }
    return date.toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateStr || '-');
  }
}
