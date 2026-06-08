import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useLocale } from "../../features/auth/hooks/useLocale";
import Button from "../ui/button/Button";
import { Skeleton } from "../ui/skeleton";

const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

export default function LanguagePreferencesCard() {
  const { locale, loading, updateLocale } = useLocale();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <Skeleton height={24} className="w-32 mb-4" />
        <Skeleton height={16} className="w-48 mb-6" />
        <Skeleton height={40} className="w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <Globe className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Idioma
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Preferencias de idioma de la interfaz
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {LANGUAGE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <input
              type="radio"
              name="locale"
              value={opt.value}
              checked={locale === opt.value}
              onChange={() => updateLocale(opt.value)}
              className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-white/5"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {opt.label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => updateLocale(locale)} disabled={loading}>
          Guardar
        </Button>
      </div>
    </motion.div>
  );
}
