import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PublicNavbar from "../../features/internship-home/components/PublicNavbar";
import PublicFooter from "../../features/internship-home/components/PublicFooter";
import { motion } from "framer-motion";
import { getVerification, VerificationResult } from "../../services/verificationService";

type Status = "loading" | "valid" | "invalid" | "error";

const ValidarPage = () => {
  const [searchParams] = useSearchParams();
  const hash = searchParams.get("hash");

  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!hash) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await getVerification(hash);
        if (cancelled) return;
        setResult(data);
        setStatus(data.valid ? "valid" : "invalid");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [hash]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-main via-white to-brand-50/30 dark:from-bg-dark dark:via-gray-900 dark:to-brand-950/20">
      <PageMeta title="Validar Documento" description="Verifique la autenticidad de un documento emitido por la Coordinación de Prácticas Profesionales de la UNEFA" />
      <PublicNavbar />

      <main className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg">
          {!hash && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/20">
                <svg className="h-10 w-10 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">Sin código de verificación</h1>
              <p className="text-text-secondary">Para verificar un documento, escaneá el código QR que aparece en el PDF.</p>
            </motion.div>
          )}

          {hash && status === "loading" && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-500" />
              <p className="mt-4 text-text-secondary">Verificando documento...</p>
            </div>
          )}

          {status === "valid" && result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-green-200 dark:border-green-800 overflow-hidden">
              <div className="bg-green-500 p-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white">Documento Verificado</h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-text-secondary leading-relaxed">{result.message}</p>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-4 space-y-2">
                  <InfoRow label="Tipo" value={result.docType || "—"} />
                  <InfoRow label="Título" value={result.title || "—"} />
                  {result.createdAt && <InfoRow label="Emitido" value={new Date(result.createdAt).toLocaleString("es-VE")} />}
                  {result.expiresAt && <InfoRow label="Válido hasta" value={new Date(result.expiresAt).toLocaleString("es-VE")} />}
                </div>
              </div>
            </motion.div>
          )}

          {status === "invalid" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-800 overflow-hidden">
              <div className="bg-red-500 p-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white">Documento No Válido</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-text-secondary">{result?.message || "El código de verificación no corresponde a ningún documento emitido por el sistema."}</p>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
              <div className="bg-yellow-500 p-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white">Error de Verificación</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-text-secondary">No se pudo verificar el documento en este momento. Intentalo de nuevo más tarde.</p>
              </div>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <a href="/" className="text-sm text-brand-500 hover:text-brand-600 underline underline-offset-2">
              Volver al inicio
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{label}</span>
    <span className="text-sm font-medium text-text-primary dark:text-white text-right">{value}</span>
  </div>
);

export default ValidarPage;
