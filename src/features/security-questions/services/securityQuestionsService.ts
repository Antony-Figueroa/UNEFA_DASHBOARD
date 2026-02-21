import apiClient from '../../../api/apiClient';

export interface PresetQuestion {
  PRESET_QUESTION_ID: number;
  DESCRIPTION: string;
}

export interface UserQuestion {
  USER_QUESTION_ID: number;
  USER_ID: number;
  QUESTION_TYPE: 'PRESET' | 'CUSTOM';
  PRESET_QUESTION_ID: number | null;
  CUSTOM_QUESTION: string | null;
  ANSWER: string;
  ORDER_NUM: number;
  questionText: string;
  hasAnswer: boolean;
}

export interface SecurityQuestionsState {
  questions: UserQuestion[];
  hasQuestions: boolean;
}

export const securityQuestionsService = {
  getPresetQuestions: async (): Promise<PresetQuestion[]> => {
    const response = await apiClient.get('/security-questions/preset');
    return response.data.data || [];
  },

  getUserQuestions: async (): Promise<SecurityQuestionsState> => {
    const response = await apiClient.get('/security-questions/my');
    return {
      questions: response.data.data || [],
      hasQuestions: response.data.hasQuestions || false
    };
  },

  saveUserQuestions: async (questions: Array<{
    questionType: 'PRESET' | 'CUSTOM';
    presetQuestionId?: number;
    customQuestion?: string;
    answer: string;
  }>): Promise<void> => {
    await apiClient.post('/security-questions/save', { questions });
  }
};
