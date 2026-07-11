export interface PendingWithdrawal {
  practiceId: number;
  studentName: string;
  studentCi: string;
  practiceType: string;
  period: string;
  retiroDate: string;
  originalEndDate: string;
  startDate: string;
  observation: string;
}

export interface BatchActionPayload {
  ids: number[];
  action: 'extend' | 'reprobar';
  newEndDate?: string;
  reason: string;
}

export interface BatchActionResult {
  total: number;
  successes: number;
  failures: number;
  details: Array<{
    practiceId: number;
    success: boolean;
    error?: string;
  }>;
}
