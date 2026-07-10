import apiClient from "@/api/apiClient";

export interface VerificationResult {
  valid: boolean;
  message: string;
  hash?: string;
  docType?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdAt?: string;
  expired?: boolean;
  expiresAt?: string;
}

/**
 * Crea un registro de verificación para un documento.
 * Devuelve el hash que debe incluirse en el QR del PDF.
 */
export const createVerification = async (
  docType: string,
  title: string,
  metadata?: Record<string, unknown>,
  createdBy?: string
): Promise<string> => {
  const { data } = await apiClient.post<{ hash: string }>("/verify", {
    docType,
    title,
    metadata,
    createdBy,
  });
  return data.hash;
};

/**
 * Consulta un hash de verificación.
 * Pública — no requiere autenticación.
 */
export const getVerification = async (hash: string): Promise<VerificationResult> => {
  const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000/api");
  const res = await fetch(`${baseURL}/verify/${encodeURIComponent(hash)}`);
  return res.json() as Promise<VerificationResult>;
};
