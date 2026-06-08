/**
 * @file index.ts
 * @description Type definitions for the authentication module.
 */

/**
 * Represents a user in the authentication system.
 */
export interface AuthUser {
  /** Unique identifier for the user */
  id: number;
  /** User's national identification number */
  userCi: string;
  /** First name */
  name: string;
  /** Middle name (optional) */
  secondName?: string;
  /** First surname */
  surname: string;
  /** Second surname (optional) */
  secondSurname?: string;
  /** Email address */
  email: string;
  /** Contact phone number (optional) */
  phoneNumber?: string;
  /** User's role ID */
  role: number;
  /** User's locale preference */
  locale?: string;
}

/**
 * Payload for updating the user's profile information.
 */
export interface UpdateProfileData {
  /** First name */
  name: string;
  /** Middle name (optional) */
  secondName?: string;
  /** First surname */
  surname: string;
  /** Second surname (optional) */
  secondSurname?: string;
  /** Email address */
  email: string;
  /** Contact phone number (optional) */
  phoneNumber?: string;
}

/**
 * Response received after a successful login attempt.
 */
export interface LoginResponse {
  /** Status message from the server */
  message: string;
  /** The authenticated user object (if successful) */
  user?: AuthUser;
  /** Whether the user is required to change their password on next login */
  requirePasswordChange?: boolean;
  /** The ID of the user (if successful) */
  userId?: number;
  /** Whether this is the user's first login (LOGIN=0) */
  isFirstLogin?: boolean;
}

/**
 * Represents a security question used for password recovery.
 */
export interface SecurityQuestion {
  /** Unique identifier for the question */
  id: number;
  /** Whether this is a custom question created by the user */
  isCustom?: boolean;
  /** The custom question text (if isCustom is true) */
  customQuestion?: string;
  /** The question text */
  description: string;
}

/**
 * Represents an answer to a security question.
 */
export interface SecurityAnswer {
  /** The ID of the question being answered */
  questionId: number;
  /** The user's provided answer */
  answer: string;
}

/**
 * Standard response for password change operations.
 */
export interface PasswordChangeResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Status message from the server */
  message: string;
}

/**
 * Response containing security questions for a user.
 */
export interface SecurityQuestionsResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** The ID of the user */
  userId: number;
  /** List of security questions assigned to the user */
  questions: SecurityQuestion[];
  /** Optional status message */
  message?: string;
}

/**
 * Response from verifying security question answers.
 */
export interface VerifyQuestionsResponse {
  /** Whether the answers were correct */
  success: boolean;
  /** Temporary token to perform a password reset (if successful) */
  resetToken?: string;
  /** Optional status message */
  message?: string;
}

/**
 * Response containing the list of available preset security questions.
 */
export interface PresetQuestionsResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** List of available security questions */
  questions: SecurityQuestion[];
}

/**
 * Represents an active user session.
 */
export interface ActiveSession {
  ID: number;
  USER_ID: number;
  DEVICE_INFO: string;
  IP_ADDRESS: string;
  LAST_ACTIVITY: string;
  CREATED_AT: string;
  STATUS: number;
}

/**
 * Represents a notification preference for a user.
 */
export interface NotificationPreference {
  id?: number;
  type: string;
  channel: string;
  enabled: boolean;
}

/**
 * Response from avatar upload/delete operations.
 */
export interface AvatarResponse {
  uploadUrl: string;
  publicUrl: string;
}

/**
 * Response for general authentication-related actions.
 */
export interface AuthActionResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Status message from the server */
  message: string;
}
