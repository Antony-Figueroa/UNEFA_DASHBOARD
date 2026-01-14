import apiClient from "../../../api/apiClient";

export interface AuthUser {
  id: number;
  userCi: string;
  name: string;
  secondName?: string;
  surname: string;
  secondSurname?: string;
  email: string;
  phoneNumber?: string;
  role: number;
}

export interface UpdateProfileData {
  name: string;
  secondName?: string;
  surname: string;
  secondSurname?: string;
  email: string;
  phoneNumber?: string;
}

export interface LoginResponse {
  message: string;
  user?: AuthUser;
  requirePasswordChange?: boolean;
  userId?: number;
}

export interface SecurityQuestion {
  id: number;
  description: string;
}

export interface SecurityAnswer {
  questionId: number;
  answer: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

export interface SecurityQuestionsResponse {
  success: boolean;
  userId: number;
  questions: SecurityQuestion[];
  message?: string;
}

export interface VerifyQuestionsResponse {
  success: boolean;
  resetToken?: string;
  message?: string;
}

export interface PresetQuestionsResponse {
  success: boolean;
  questions: SecurityQuestion[];
}

export const login = async (userCi: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", { userCi, password });
  return response.data;
};

export const getMe = async (): Promise<{ success: boolean; user: AuthUser }> => {
  const response = await apiClient.get<{ success: boolean; user: AuthUser }>("/auth/me");
  return response.data;
};

export const updateProfile = async (data: UpdateProfileData): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.put<{ success: boolean; message: string }>("/auth/profile", data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const changePassword = async (userId: number, newPassword: string, securityQuestions?: SecurityAnswer[]): Promise<PasswordChangeResponse> => {
  const response = await apiClient.post<PasswordChangeResponse>("/auth/change-password", { userId, newPassword, securityQuestions });
  return response.data;
};

export const getSecurityQuestions = async (userCi: string): Promise<SecurityQuestionsResponse> => {
  const response = await apiClient.get<SecurityQuestionsResponse>(`/auth/security-questions/${userCi}`);
  return response.data;
};

export const verifySecurityQuestions = async (userId: number, answers: SecurityAnswer[]): Promise<VerifyQuestionsResponse> => {
  const response = await apiClient.post<VerifyQuestionsResponse>("/auth/verify-questions", { userId, answers });
  return response.data;
};

export const getPresetQuestions = async (): Promise<PresetQuestionsResponse> => {
  const response = await apiClient.get<PresetQuestionsResponse>("/auth/preset-questions");
  return response.data;
};

export const resetPassword = async (userId: number, newPassword: string): Promise<PasswordChangeResponse> => {
  const response = await apiClient.post<PasswordChangeResponse>("/auth/reset-password", { userId, newPassword });
  return response.data;
};
