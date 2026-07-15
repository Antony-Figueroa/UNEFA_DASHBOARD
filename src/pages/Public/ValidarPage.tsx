import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { motion, AnimatePresence } from "framer-motion";
import { getVerification, VerificationResult } from "../../services/verificationService";

type Status = "idle" | "loading" | "valid" | "invalid" | "error";

/* ─── Texto del membrete ─────────────────────────────────────── */
const INSTITUTIONAL_LINES = [
  "REPÚBLICA BOLIVARIANA DE VENEZUELA",
  "MINISTERIO DEL PODER POPULAR PARA LA DEFENSA",
  "UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA",
  "DE LA FUERZA ARMADA NACIONAL BOLIVARIANA",
  "VICERRECTORADO DE LA REGIÓN LOS LLANOS",
  "NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA",
  "EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES",
] as const;

/* ─── Fondo animado (mismo patrón que NosotrosPage) ──────────── */
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 bg-gradient-to-br from-bg-main via-white to-brand-50/30 dark:from-bg-dark dark:via-gray-900 dark:to-brand-950/20" />
    <motion.div
      className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-25 dark:opacity-10"
      style={{ background: "radial-gradient(circle, var(--color-brand-400) 0%, transparent 70%)" }}
      animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 dark:opacity-8"
      style={{ background: "radial-gradient(circle, var(--color-unefa-gold) 0%, transparent 70%)" }}
      animate={{ scale: [1, 1.3, 1], x: [0, -30, 0], y: [0, 30, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
    />
    <div
      className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232d90c4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
  </div>
);

/* ─── Componente principal ───────────────────────────────────── */
const ValidarPage = () => {
  const [searchParams] = useSearchParams();
  const hash = searchParams.get("hash");

  const [status, setStatus] = useState<Status>(hash ? "loading" : "idle");
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!hash) return;
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

  const formattedDate = result?.createdAt
    ? new Date(result.createdAt).toLocaleDateString("es-VE", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const today = new Date().toLocaleDateString("es-VE", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <PageMeta
        title="Certificado de Origen - UNEFA"
        description="Certificado de origen del documento. Verifique la autenticidad de un documento emitido por el Sistema de Gestión de Prácticas Profesionales de la UNEFA."
      />
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <AnimatedBackground />
        <div className="w-full max-w-[600px]">
          <AnimatePresence mode="wait">
            {status === "idle"   && <NoHashCard key="idle" />}
            {status === "loading" && <LoadingCard key="loading" />}
            {status === "valid" && result && (
              <ValidCard key="valid" result={result} formattedDate={formattedDate} today={today} />
            )}
            {status === "invalid" && <InvalidCard key="invalid" result={result} today={today} />}
            {status === "error"   && <ErrorCard key="error" today={today} />}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default ValidarPage;

/* ─── Membrete (misma jerarquía que PDFLayout) ───────────────── */
const MembreteText = () => (
  <div className="text-center leading-[1.15]">
    {INSTITUTIONAL_LINES.map((line, i) => (
      <p
        key={line}
        className={
          i < 5
            ? "text-[9px] sm:text-[10px] font-bold text-gray-700 dark:text-gray-300"
            : "text-[9px] sm:text-[10px] font-bold text-unefa-blue dark:text-brand-400"
        }
      >
        {line}
      </p>
    ))}
  </div>
);

const Membrete = () => (
  <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 pb-5 border-b border-gray-100 dark:border-white/5">
    <img
      src="/pdfs-docs/escudo.png" alt="" aria-hidden="true"
      className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
      onError={(e) => { (e.currentTarget).style.display = "none"; }}
    />
    <MembreteText />
    <img
      src="/pdfs-docs/logo.png" alt="" aria-hidden="true"
      className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
      onError={(e) => { (e.currentTarget).style.display = "none"; }}
    />
  </div>
);

/* ─── Envoltorio tipo card del sistema ────────────────────────── */
const CardBase = ({
  children, variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning";
}) => {
  const borderMap = {
    default: "border-gray-100 dark:border-gray-700",
    success: "border-emerald-200 dark:border-emerald-800/40",
    error: "border-red-200 dark:border-red-800/40",
    warning: "border-amber-200 dark:border-amber-800/40",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border ${borderMap[variant]} overflow-hidden`}
    >
      {children}
    </motion.div>
  );
};

/* ─── InfoRow ─────────────────────────────────────────────────── */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
    <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider shrink-0">
      {label}
    </span>
    <span className="text-sm font-medium text-text-primary text-right break-words max-w-[65%]">
      {value}
    </span>
  </div>
);

/* ─── Estados ─────────────────────────────────────────────────── */

const NoHashCard = () => (
  <CardBase variant="default">
    <div className="px-7 sm:px-10 py-10 sm:py-12 text-center">
      <div className="mx-auto mb-5 w-16 h-16 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
        <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-text-emphasis mb-2">Sin código de verificación</h1>
      <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
        Para verificar un documento, escaneá el código QR del PDF o accedé al enlace incluido.
      </p>
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    </div>
  </CardBase>
);

const LoadingCard = () => (
  <CardBase variant="default">
    <div className="px-7 sm:px-10 py-10 sm:py-12 text-center">
      <div className="mx-auto mb-5 w-16 h-16 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
      </div>
      <h1 className="text-xl font-bold text-text-emphasis mb-2">Verificando documento</h1>
      <p className="text-sm text-text-secondary">Consultando la base de datos del sistema...</p>
    </div>
  </CardBase>
);

/* ─── Válido ──────────────────────────────────────────────────── */
const ValidCard = ({ result, formattedDate, today }: {
  result: VerificationResult;
  formattedDate: string | null;
  today: string;
}) => (
  <CardBase variant="success">
    <div className="px-7 sm:px-10 py-8 sm:py-10">
      <Membrete />

      <div className="text-center mb-6">
        <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <motion.svg
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-9 h-9 text-emerald-600 dark:text-emerald-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
            strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          >
            <path d="M5 13l4 4L19 7" />
          </motion.svg>
        </div>
        <h1 className="text-xl font-black text-text-emphasis tracking-tight leading-snug mb-1">
          CERTIFICADO DE ORIGEN
        </h1>
        <p className="text-xl font-black text-text-emphasis tracking-tight leading-snug mb-3">
          DEL DOCUMENTO
        </p>
        <div className="w-14 h-[3px] bg-emerald-400/50 dark:bg-emerald-500/40 mx-auto rounded-full mb-4" />
        <p className="text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
          Por medio de la presente, se certifica que el documento cuyo código QR ha sido escaneado fue generado desde la aplicación web{" "}
          <strong className="font-bold text-text-emphasis">SISTEMA DE GESTIÓN DE PRÁCTICAS PROFESIONALES UNEFA</strong>.
          Este certificado confirma la procedencia y autenticidad del documento, asegurando que fue creado en la plataforma mencionada.
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-5 mb-5">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
          Datos del documento verificado
        </p>
        <InfoRow label="Tipo" value={result.docType || "—"} />
        <InfoRow label="Título" value={result.title || "—"} />
        {result.createdBy && <InfoRow label="Generado por" value={result.createdBy} />}
        {formattedDate && <InfoRow label="Fecha de emisión" value={formattedDate} />}
      </div>

      <div className="text-center border-t border-gray-100 dark:border-white/5 pt-4">
        <p className="text-[11px] text-text-tertiary leading-relaxed">
          Certificado emitido el{" "}
          <span className="font-semibold text-text-secondary">{today}</span>{" "}
          por el sistema oficial de la Coordinación de Prácticas Profesionales de la UNEFA.
        </p>
      </div>
    </div>
  </CardBase>
);

/* ─── Inválido ────────────────────────────────────────────────── */
const InvalidCard = ({ result, today }: { result: VerificationResult | null; today: string }) => (
  <CardBase variant="error">
    <div className="px-7 sm:px-10 py-8 sm:py-10">
      <Membrete />
      <div className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-9 h-9 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}>
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-black text-text-emphasis tracking-tight mb-3">
          DOCUMENTO NO VÁLIDO
        </h1>
        <div className="w-14 h-[3px] bg-red-400/50 dark:bg-red-500/40 mx-auto rounded-full mb-4" />
        <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
          {result?.message || "El código de verificación no corresponde a ningún documento emitido por el sistema."}
        </p>
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
          <p className="text-[11px] text-text-tertiary">
            Certificado emitido el <span className="font-semibold text-text-secondary">{today}</span>
          </p>
        </div>
      </div>
    </div>
  </CardBase>
);

/* ─── Error ───────────────────────────────────────────────────── */
const ErrorCard = ({ today }: { today: string }) => (
  <CardBase variant="warning">
    <div className="px-7 sm:px-10 py-8 sm:py-10">
      <Membrete />
      <div className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-9 h-9 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-black text-text-emphasis tracking-tight mb-3">
          ERROR DE VERIFICACIÓN
        </h1>
        <div className="w-14 h-[3px] bg-amber-400/50 dark:bg-amber-500/40 mx-auto rounded-full mb-4" />
        <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
          No se pudo verificar el documento en este momento. Intentá de nuevo más tarde o comunicate con la Coordinación de Prácticas Profesionales.
        </p>
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
          <p className="text-[11px] text-text-tertiary">
            Certificado emitido el <span className="font-semibold text-text-secondary">{today}</span>
          </p>
        </div>
      </div>
    </div>
  </CardBase>
);
