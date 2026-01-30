/**
 * @file authService.ts
 * @description Service for handling authentication-related API calls.
 */

import apiClient from "../../../api/apiClient";
import {
  AuthUser,
  LoginResponse,
  UpdateProfileData,
  PasswordChangeResponse,
  SecurityQuestionsResponse,
  SecurityAnswer,
  VerifyQuestionsResponse,
  PresetQuestionsResponse,
  AuthActionResponse,
} from "../types";

/**
 * Authenticates a user with their credentials.
 * @param userCi - User's national identification.
 * @param password - User's password.
 * @returns A promise with the login response.
 * @throws Will throw an error if the request fails.
 */
export const login = async (userCi: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", { userCi, password });
  return response.data;
};

/**
 * Retrieves the current authenticated user's information.
 * @returns A promise with the user info.
 */
export const getMe = async (): Promise<{ success: boolean; user: AuthUser }> => {
  const response = await apiClient.get<{ success: boolean; user: AuthUser }>("/auth/me");
  return response.data;
};

/**
 * Updates the current user's profile information.
 * @param data - The new profile data.
 * @returns A promise with the action response.
 */
export const updateProfile = async (data: UpdateProfileData): Promise<AuthActionResponse> => {
  const response = await apiClient.put<AuthActionResponse>("/auth/profile", data);
  return response.data;
};

/**
 * Logs out the current user by invalidating their session.
 */
export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

/**
 * Changes the user's password.
 * @param userId - ID of the user.
 * @param newPassword - The new password.
 * @param securityQuestions - Optional answers to security questions if required.
 * @returns A promise with the change response.
 */
export const changePassword = async (
  userId: number,
  newPassword: string,
  securityQuestions?: SecurityAnswer[]
): Promise<PasswordChangeResponse> => {
  const response = await apiClient.post<PasswordChangeResponse>("/auth/change-password", {
    userId,
    newPassword,
    securityQuestions,
  });
  return response.data;
};

/**
 * Fetches the security questions assigned to a specific user.
 * @param userCi - User's national identification.
 * @returns A promise with the questions response.
 */
export const getSecurityQuestions = async (userCi: string): Promise<SecurityQuestionsResponse> => {
  const response = await apiClient.get<SecurityQuestionsResponse>(`/auth/security-questions/${userCi}`);
  return response.data;
};

/**
 * Verifies the answers to a user's security questions.
 * @param userId - ID of the user.
 * @param answers - List of provided answers.
 * @returns A promise with the verification response.
 */
export const verifySecurityQuestions = async (
  userId: number,
  answers: SecurityAnswer[]
): Promise<VerifyQuestionsResponse> => {
  const response = await apiClient.post<VerifyQuestionsResponse>("/auth/verify-questions", {
    userId,
    answers,
  });
  return response.data;
};

/**
 * Retrieves the list of available preset security questions.
 * @returns A promise with the preset questions response.
 */
export const getPresetQuestions = async (): Promise<PresetQuestionsResponse> => {
  const response = await apiClient.get<PresetQuestionsResponse>("/auth/preset-questions");
  return response.data;
};

/**
 * Resets a user's password (typically used by admins or through a recovery process).
 * @param userId - ID of the user.
 * @param newPassword - The new password.
 * @returns A promise with the change response.
 */
export const resetPassword = async (userId: number, newPassword: string): Promise<PasswordChangeResponse> => {
  const response = await apiClient.post<PasswordChangeResponse>("/auth/reset-password", {
    userId,
    newPassword,
  });
  return response.data;
};

/**
 * Requests a password recovery link to be sent to the user's email.
 * @param email - User's email address.
 * @returns A promise with the action response.
 */
export const requestRecovery = async (email: string): Promise<AuthActionResponse> => {
  const response = await apiClient.post<AuthActionResponse>("/auth/request-recovery", { email });
  return response.data;
};

/**
 * Resets the password using a recovery token.
 * @param token - The recovery token.
 * @param newPassword - The new password.
 * @returns A promise with the action response.
 */
export const resetWithToken = async (token: string, newPassword: string): Promise<AuthActionResponse> => {
  const response = await apiClient.post<AuthActionResponse>("/auth/reset-with-token", {
    token,
    newPassword,
  });
  return response.data;
};
