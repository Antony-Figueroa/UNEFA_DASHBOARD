/**
 * @file BatchPreEnrollModal.tsx
 * @description Modal para pre-inscripción por lote de múltiples estudiantes.
 * Permite seleccionar campos académicos comunes y aplicarlos a todos los estudiantes seleccionados.
 */

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import CustomSelect from "../../../components/form/CustomSelect";
import Badge from "../../../components/ui/badge/Badge";
import { Periodo } from "../../periods/types";
import { getPeriods } from "../../periods/services/periodService";
import { getInternshipTypes, getInternshipTypesByCareer } from "../../internship-types/services/internshipTypesService";
import { getCareers } from "../../careers/services/careersService";
import { useLists } from "../../lists/hooks/useLists";
import { BatchPreEnrollRequest, BatchResult } from "../services/preEnrollmentService";
import { Student } from "../../students/types";
import { cn } from "../../../utils/cn";
import { CheckCircleIcon, ErrorIcon, UsersIcon, ShieldCheckIcon } from "../../../icons";

/**
 * Schema de validación para el formulario batch.
 */
const batchSchema = z.object({
  period: z.string().min(1, "Seleccione el período"),
  careerId: z.string().min(1, "Seleccione la carrera"),
  semester: z.string().min(1, "El semestre es obligatorio"),
  section: z.string().min(1, "Seleccione la sección"),
  regime: z.string().min(1, "Seleccione el régimen"),
  practiceType: z.string().min(1, "Seleccione el tipo de práctica"),
});

type BatchFormData = z.infer<typeof batchSchema>;

type ModalStep = "form" | "loading" | "result";

interface BatchPreEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onBatchPreEnroll: (request: BatchPreEnrollRequest) => Promise<BatchResult>;
  onComplete?: () => void;
}

export default function BatchPreEnrollModal({
  isOpen,
  onClose,
  students,
  onBatchPreEnroll,
  onComplete,
}: BatchPreEnrollModalProps) {
  const [step, setStep] = useState<ModalStep>("form");
  const [result, setResult] = useState<BatchResult | null>(null);
  const [periods, setPeriods] = useState<Periodo[]>([]);
  const [practiceTypeOptions, setPracticeTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [careerOptions, setCareerOptions] = useState<{ value: string; label: string }[]>([]);
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const { fetchMultipleLists } = useLists();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      period: "",
      careerId: "",
      semester: "",
      section: "",
      regime: "",
      practiceType: "",
    },
  });

  const watchedCareerId = watch("careerId");

  const SEMESTER_OPTIONS = options["Semestre"] || [];
  const SECTION_OPTIONS = options["Seccion"] || [];
  const REGIME_OPTIONS = options["Regimen/Turno"] || [];

  // Load initial data
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [periodData, careerData, internshipTypesData, listData] = await Promise.all([
          getPeriods(),
          getCareers(),
          getInternshipTypes(),
          fetchMultipleLists(["Semestre", "Seccion", "Regimen/Turno"]),
        ]);

        // Periods: active or next pending
        const activePeriods = periodData
          .filter((p: Periodo) => p.periodStatus === 2 && p.status);
        const pendingPeriods = periodData
          .filter((p: Periodo) => p.periodStatus === 1 && p.status)
          .sort((a: Periodo, b: Periodo) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        const selectedPeriods = activePeriods.length > 0
          ? [activePeriods[0]]
          : pendingPeriods.length > 0
            ? [pendingPeriods[0]]
            : [];

        setPeriods(selectedPeriods);
        if (selectedPeriods.length > 0) {
          setValue("period", selectedPeriods[0].description);
        }

        // Career options
        setCareerOptions(
          (careerData as any[])
            .filter((c: any) => c.status)
            .map((c: any) => ({ value: String(c.careerId), label: c.careerName }))
        );

        // Practice type options
        setPracticeTypeOptions(
          internshipTypesData.map((t: any) => ({ value: t.name?.toUpperCase() || "", label: t.name?.toUpperCase() || "" }))
        );

        // Dynamic lists
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        Object.entries(listData).forEach(([key, values]) => {
          mappedOptions[key] = (values as any[]).map((v: any) => ({
            value: v.name.toUpperCase(),
            label: v.name.toUpperCase(),
          }));
        });
        setOptions(mappedOptions);
      } catch (error) {
        console.error("[BatchPreEnrollModal] Error loading data:", error);
      }
    };

    loadData();
    setStep("form");
    setResult(null);
  }, [isOpen, setValue, fetchMultipleLists]);

  // Auto-fill semester when career changes
  useEffect(() => {
    if (!watchedCareerId) return;

    const loadCareerData = async () => {
      try {
        const careersRes = await getCareers();
        const selectedCareer = (careersRes as any[]).find(
          (c: any) => String(c.careerId) === String(watchedCareerId)
        );
        if (selectedCareer?.semester) {
          setValue("semester", selectedCareer.semester);
        }
      } catch {
        // Silently fail
      }
    };
    loadCareerData();
  }, [watchedCareerId, setValue]);

  // Auto-fill practice type when career changes
  useEffect(() => {
    if (!watchedCareerId) {
      setValue("practiceType", "");
      return;
    }

    const loadPracticeTypes = async () => {
      try {
        const types = await getInternshipTypesByCareer(watchedCareerId);
        const sortedTypes = [...types].sort((a, b) => a.priority - b.priority);

        setPracticeTypeOptions(
          sortedTypes.map((t) => ({ value: t.name?.toUpperCase() || "", label: t.name?.toUpperCase() || "" }))
        );

        if (sortedTypes.length === 1) {
          setValue("practiceType", sortedTypes[0].name.toUpperCase());
        } else if (sortedTypes.length > 1) {
          setValue("practiceType", sortedTypes[0].name.toUpperCase());
        }
      } catch {
        // Silently fail
      }
    };
    loadPracticeTypes();
  }, [watchedCareerId, setValue]);

  const onSubmit = async (data: BatchFormData) => {
    setStep("loading");

    try {
      const request: BatchPreEnrollRequest = {
        students: students.map((s) => ({
          identificationPrefix: s.identificationPrefix,
          identificationNumber: s.identificationNumber,
        })),
        period: data.period,
        practiceType: data.practiceType,
        careerId: data.careerId,
        semester: data.semester,
        section: data.section,
        regime: data.regime,
      };

      const batchResult = await onBatchPreEnroll(request);
      setResult(batchResult);
      setStep("result");

      if (batchResult.created > 0 && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("[BatchPreEnrollModal] Error:", error);
      setResult({
        created: 0,
        failed: students.length,
        results: students.map((s) => ({
          ci: `${s.identificationPrefix}-${s.identificationNumber}`,
          status: "failed" as const,
          message: "Error inesperado al procesar el lote",
        })),
      });
      setStep("result");
    }
  };

  const handleClose = () => {
    reset();
    setStep("form");
    setResult(null);
    onClose();
  };

  const renderForm = () => (
    <form id="batch-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Student summary */}
      <div className="bg-brand-50/50 dark:bg-brand-500/5 rounded-2xl p-4 border border-brand-200/50 dark:border-brand-500/20">
        <div className="flex items-center gap-3 mb-3">
          <UsersIcon className="w-5 h-5 text-brand-600" />
          <h4 className="text-sm font-bold text-text-primary">
            {students.length} estudiante(s) seleccionado(s)
          </h4>
        </div>
        <div className="max-h-32 overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead className="text-text-tertiary uppercase tracking-wider">
              <tr className="border-b border-border-light/50">
                <th className="py-1 pr-2 text-left font-semibold">#</th>
                <th className="py-1 pr-2 text-left font-semibold">C.I.</th>
                <th className="py-1 text-left font-semibold">Nombre Completo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/30">
              {students.map((s, idx) => (
                <tr key={s.studentId} className="text-text-secondary">
                  <td className="py-1 pr-2 text-text-tertiary">{idx + 1}</td>
                  <td className="py-1 pr-2 font-mono font-medium">
                    {s.identificationPrefix}-{s.identificationNumber}
                  </td>
                  <td className="py-1 truncate">{s.firstName} {s.lastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common fields */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-border-light dark:border-white/10 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-border-light dark:border-white/5 pb-3">
          <div className="h-8 w-8 rounded-lg bg-success-500/10 flex items-center justify-center text-success-600">
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">Campos Comunes</h4>
            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-tighter">
              Se aplicarán a todos los estudiantes seleccionados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Carrera */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Carrera <span className="text-red-500">*</span></label>
            <Controller
              name="careerId"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  options={careerOptions}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder="Seleccione la carrera..."
                  error={!!errors.careerId}
                  className="rounded-xl h-[46px]"
                />
              )}
            />
            {errors.careerId && (
              <p className="text-[10px] font-bold text-error-500">{errors.careerId.message}</p>
            )}
          </div>

          {/* Semestre */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Semestre <span className="text-red-500">*</span></label>
              <Badge color="info" variant="light" size="sm" className="font-bold text-[9px]">AUTO</Badge>
            </div>
            <Controller
              name="semester"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  options={SEMESTER_OPTIONS}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder="Seleccione carrera primero..."
                  error={!!errors.semester}
                  disabled
                  className="rounded-xl h-[46px] bg-slate-50/50"
                />
              )}
            />
            {errors.semester && (
              <p className="text-[10px] font-bold text-error-500">{errors.semester.message}</p>
            )}
          </div>

          {/* Sección */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Sección <span className="text-red-500">*</span></label>
            <Controller
              name="section"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  options={SECTION_OPTIONS}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder="Seleccione la sección..."
                  error={!!errors.section}
                  className="rounded-xl h-[46px]"
                />
              )}
            />
            {errors.section && (
              <p className="text-[10px] font-bold text-error-500">{errors.section.message}</p>
            )}
          </div>

          {/* Régimen */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Régimen <span className="text-red-500">*</span></label>
            <Controller
              name="regime"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  options={REGIME_OPTIONS}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder="Seleccione el régimen..."
                  error={!!errors.regime}
                  className="rounded-xl h-[46px]"
                />
              )}
            />
            {errors.regime && (
              <p className="text-[10px] font-bold text-error-500">{errors.regime.message}</p>
            )}
          </div>

          {/* Tipo de Práctica */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Tipo de Práctica <span className="text-red-500">*</span></label>
              <Badge color="info" variant="light" size="sm" className="font-bold text-[9px]">AUTO</Badge>
            </div>
            <Controller
              name="practiceType"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  options={practiceTypeOptions}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder="Seleccione carrera primero..."
                  error={!!errors.practiceType}
                  disabled
                  className="rounded-xl h-[46px] bg-slate-50/50"
                />
              )}
            />
            {errors.practiceType && (
              <p className="text-[10px] font-bold text-error-500">{errors.practiceType.message}</p>
            )}
          </div>

          {/* Período */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Período Académico <span className="text-red-500">*</span></label>
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  options={periods.map((p) => ({ value: p.description, label: p.description }))}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder="Seleccione el período..."
                  className="rounded-xl h-[46px]"
                />
              )}
            />
          </div>
        </div>
      </div>
    </form>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <svg className="w-10 h-10 text-brand-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm font-bold text-text-primary">Procesando pre-inscripciones...</p>
      <p className="text-xs text-text-tertiary">Validando y registrando {students.length} estudiante(s)</p>
    </div>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="space-y-5">
        {/* Summary */}
        <div className={cn(
          "rounded-2xl p-5 border text-center",
          result.created > 0 && result.failed === 0
            ? "bg-success-50/80 dark:bg-success-500/10 border-success-300/50"
            : result.created > 0 && result.failed > 0
              ? "bg-warning-50/80 dark:bg-warning-500/10 border-warning-300/50"
              : "bg-error-50/80 dark:bg-error-500/10 border-error-300/50"
        )}>
          <div className="flex items-center justify-center gap-3 mb-2">
            {result.failed === 0 ? (
              <CheckCircleIcon className="w-8 h-8 text-success-600" />
            ) : result.created > 0 ? (
              <CheckCircleIcon className="w-8 h-8 text-warning-600" />
            ) : (
              <ErrorIcon className="w-8 h-8 text-error-600" />
            )}
            <div>
              <h4 className="text-base font-bold text-text-primary">
                {result.failed === 0
                  ? "Todos pre-inscritos"
                  : result.created > 0
                    ? "Procesado con errores"
                    : "No se pudo procesar"}
              </h4>
              <p className="text-sm text-text-secondary">
                {result.created} creado(s) &middot; {result.failed} fallido(s)
              </p>
            </div>
          </div>
        </div>

        {/* Failed items detail */}
        {result.results.filter(r => r.status === 'failed').length > 0 && (
          <div className="bg-error-50/30 dark:bg-error-500/5 rounded-xl border border-error-200/50 p-4">
            <h5 className="text-xs font-bold text-error-700 uppercase tracking-wider mb-2">Detalle de errores</h5>
            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5">
              {result.results
                .filter(r => r.status === 'failed')
                .map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <ErrorIcon className="w-3.5 h-3.5 text-error-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-error-700">{r.ci}</span>
                      <span className="text-error-600">: {r.message}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton size="2xl">
      <ModalHeader className="border-b border-border-light dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white tracking-tight">
              Pre-Inscripción por Lote
            </h2>
            <p className="text-xs text-text-tertiary font-medium">
              {step === "form" && "Configure los campos comunes para la pre-inscripción masiva"}
              {step === "loading" && "Procesando, espere un momento..."}
              {step === "result" && "Resultado de la operación"}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="bg-slate-50/50 dark:bg-transparent custom-scrollbar">
        {step === "form" && renderForm()}
        {step === "loading" && renderLoading()}
        {step === "result" && renderResult()}
      </ModalBody>

      <ModalFooter className="border-t border-border-light dark:border-white/5 px-6 py-4">
        {step === "form" && (
          <div className="flex items-center justify-between w-full">
            <p className="text-[10px] text-text-tertiary hidden sm:block">
              {students.length} estudiante(s) · Todos los campos son obligatorios
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose} className="h-10 px-6 rounded-xl font-bold text-sm">
                Cancelar
              </Button>
              <Button
                type="submit"
                form="batch-form"
                disabled={!isValid}
                loadingText="Guardando..."
                className="h-10 px-6 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-700"
              >
                Pre-inscribir {students.length} estudiante(s)
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="w-full flex justify-center">
            <span className="text-xs text-text-tertiary">Procesando...</span>
          </div>
        )}

        {step === "result" && (
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={handleClose} className="h-10 px-8 rounded-xl font-bold text-sm">
              Cerrar
            </Button>
          </div>
        )}
      </ModalFooter>
    </Modal>
  );
}
