import { describe, it, expect } from 'vitest';
import { Periodo } from "../../types";

// Mocking the service logic for testing
const parseDate = (value: number | string | undefined): Date => {
  if (!value) return new Date();
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  return new Date(value);
};

const toApi = (periodo: Partial<Periodo>) => {
  const dto: Record<string, unknown> = {};
  if (periodo.description) dto.description = periodo.description;
  if (periodo.startDate) dto.startDate = Math.floor(periodo.startDate.getTime() / 1000);
  if (periodo.endDate) dto.endDate = Math.floor(periodo.endDate.getTime() / 1000);
  if (periodo.periodStatus) dto.periodStatus = periodo.periodStatus;
  if (typeof periodo.status === 'boolean') dto.status = periodo.status;
  if (periodo.periodId) dto.id = periodo.periodId; 
  if (periodo.code) dto.code = periodo.code;
  return dto;
};

describe('PeriodService Date Handling', () => {
  it('converts Date object to Unix timestamp (seconds) for API', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    const periodo: Partial<Periodo> = {
      startDate: date
    };
    const dto = toApi(periodo);
    expect(dto.startDate).toBe(date.getTime() / 1000);
  });

  it('converts ISO string from API to Date object', () => {
    const isoString = '2025-01-01T00:00:00.000Z';
    const date = parseDate(isoString);
    expect(date.toISOString()).toBe(isoString);
  });

  it('converts Unix timestamp (seconds) from API to Date object', () => {
    const seconds = 1735689600; // 2025-01-01T00:00:00Z
    const date = parseDate(seconds);
    expect(date.getTime() / 1000).toBe(seconds);
  });
});
