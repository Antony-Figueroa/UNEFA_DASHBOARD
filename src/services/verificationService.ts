import apiClient from "@/api/apiClient";

/**
 * Obtiene la URL base para los códigos QR de verificación.
 * - En producción: usa window.location.origin
 * - En localhost: usa VITE_VERIFY_BASE_URL o fallback a Vercel
 * - Nunca usa localhost porque los QR serían inservibles.
 */
export function getVerifyBaseUrl(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const isLocal =
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("::1");
    if (!isLocal) return origin;
  }
  return (
    import.meta.env.VITE_VERIFY_BASE_URL ||
    "https://unefa-dashboard-nine.vercel.app"
  );
}

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
