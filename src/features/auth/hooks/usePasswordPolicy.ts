import { useState, useEffect } from 'react';
import { getPasswordPolicy } from '../services/authService';

export interface PasswordRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

export const DEFAULT_PASSWORD_RULES: PasswordRules = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
};

export function usePasswordPolicy() {
  const [rules, setRules] = useState<PasswordRules>(DEFAULT_PASSWORD_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPasswordPolicy()
      .then(policy => {
        if (!cancelled) {
          setRules({
            minLength: policy.minLength,
            requireUppercase: policy.requireUppercase,
            requireLowercase: policy.requireLowercase,
            requireNumbers: policy.requireNumbers,
            requireSpecial: policy.requireSpecial,
          });
        }
      })
      .catch(() => {
        // Fallback to defaults (already set in useState)
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { rules, loading };
}
