import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface PracticeStep {
  title: string;
  instruction: string;
  /** Returns the DOM element to highlight/scroll to */
  element?: () => Element | null;
  /** Returns true when the action is complete (auto-advance) */
  detect: () => boolean;
}

interface PracticeGuideProps {
  moduleName: string;
  onClose: () => void;
}

const moduleSteps: Record<string, PracticeStep[]> = {
  Periodos: [
    {
      title: "Abrir formulario",
      instruction: 'Haga clic en "Nuevo Periodo"',
      element: () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).find((b) => b.textContent?.includes("Nuevo Per")) ?? null;
      },
      detect: () => !!document.querySelector('[role="dialog"]'),
    },
    {
      title: "Llenar y guardar",
      instruction: 'Lapso (ej. 2-2027), Fecha inicio, Fecha fin. Despliegue "Fechas por tipo", asigne fechas por modalidad. Presione "Guardar Periodo", confirme con "Registrar"',
      element: () => document.querySelector('[role="dialog"]'),
      detect: () => document.body.textContent?.includes("Período Registrado") ?? false,
    },
    {
      title: "Limpiar",
      instruction: "Desactive el periodo de prueba de la tabla",
      detect: () => false,
    },
  ],
  Carreras: [
    {
      title: "Abrir formulario",
      instruction: 'Haga clic en "Nueva Carrera"',
      element: () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).find((b) => b.textContent?.includes("Nueva Carr")) ?? null;
      },
      detect: () => !!document.querySelector('[role="dialog"]'),
    },
    {
      title: "Completar datos",
      instruction: 'Codigo (ej. 12345), Nombre, Tipo (CORTA/LARGA), Semestre, Nota minima, Abreviatura, Tipos de Practicas. Luego presione "Guardar Carrera" y confirme con "Crear"',
      element: () => document.querySelector('[role="dialog"]'),
      detect: () => document.body.textContent?.includes("Carrera Creado") ?? false,
    },
    {
      title: "Limpiar",
      instruction: "Desactive la carrera de prueba de la tabla",
      detect: () => false,
    },
  ],
  Estudiantes: [
    {
      title: "Abrir formulario",
      instruction: 'Haga clic en "Nuevo Estudiante"',
      element: () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).find((b) => b.textContent?.includes("Nuevo Est")) ?? null;
      },
      detect: () => !!document.querySelector('[role="dialog"]'),
    },
    {
      title: "Llenar y guardar",
      instruction: 'Complete cedula 99999999, datos personales, carrera, periodo y presione "Guardar"',
      element: () => document.querySelector('[role="dialog"]'),
      detect: () => !document.querySelector('[role="dialog"]'),
    },
    {
      title: "Limpiar",
      instruction: "Desactive al estudiante de prueba de la tabla",
      detect: () => false,
    },
  ],
  Tutores: [
    {
      title: "Abrir formulario",
      instruction: 'Haga clic en "Nuevo Tutor"',
      element: () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).find((b) => b.textContent?.includes("Nuevo Tut")) ?? null;
      },
      detect: () => !!document.querySelector('[role="dialog"]'),
    },
    {
      title: "Llenar y guardar",
      instruction: 'Complete cedula 88888888, datos y presione "Guardar"',
      element: () => document.querySelector('[role="dialog"]'),
      detect: () => !document.querySelector('[role="dialog"]'),
    },
    {
      title: "Limpiar",
      instruction: "Desactive al tutor de prueba de la tabla",
      detect: () => false,
    },
  ],
  Instituciones: [
    {
      title: "Abrir formulario",
      instruction: 'Haga clic en "Nueva Empresa o Institucion"',
      element: () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).find((b) => b.textContent?.includes("Nueva Empre")) ?? null;
      },
      detect: () => !!document.querySelector('[role="dialog"]'),
    },
    {
      title: "Llenar y guardar",
      instruction: 'Complete RIF J-99999999-9, nombre, datos y presione "Guardar"',
      element: () => document.querySelector('[role="dialog"]'),
      detect: () => !document.querySelector('[role="dialog"]'),
    },
    {
      title: "Limpiar",
      instruction: "Desactive la institucion de prueba de la tabla",
      detect: () => false,
    },
  ],
  "Pre-Inscripcion": [
    {
      title: "Abrir formulario",
      instruction: 'Haga clic en "Nueva Pre-Inscripcion"',
      element: () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).find((b) => b.textContent?.includes("Pre-Inscrip")) ?? null;
      },
      detect: () => !!document.querySelector('[role="dialog"]'),
    },
    {
      title: "Completar y guardar",
      instruction: 'Seleccione estudiante, carrera, tipo y presione "Guardar"',
      element: () => document.querySelector('[role="dialog"]'),
      detect: () => !document.querySelector('[role="dialog"]'),
    },
    {
      title: "Limpiar",
      instruction: "Elimine el registro de prueba",
      detect: () => false,
    },
  ],
  Inscripcion: [
    {
      title: "Abrir formulario",
      instruction: 'Haga clic en "Nueva Inscripcion"',
      element: () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).find((b) => b.textContent?.includes("Nueva Inscrip")) ?? null;
      },
      detect: () => !!document.querySelector('[role="dialog"]'),
    },
    {
      title: "Completar y guardar",
      instruction: 'Complete estudiante, tutor, institucion, fechas y presione "Guardar"',
      element: () => document.querySelector('[role="dialog"]'),
      detect: () => !document.querySelector('[role="dialog"]'),
    },
    {
      title: "Limpiar",
      instruction: "Elimine el registro de prueba",
      detect: () => false,
    },
  ],
};

const highlightClass = "practice-highlight-ring";

// Inject highlight CSS once
if (typeof document !== "undefined" && !document.getElementById("practice-highlight-style")) {
  const style = document.createElement("style");
  style.id = "practice-highlight-style";
  style.textContent = `
    .${highlightClass} {
      outline: 3px solid var(--color-brand-500, #6366f1) !important;
      outline-offset: 3px !important;
      border-radius: 4px;
      transition: outline 0.2s ease;
    }
  `;
  document.head.appendChild(style);
}

function clearHighlight() {
  document.querySelectorAll(`.${highlightClass}`).forEach((el) => el.classList.remove(highlightClass));
}

export function PracticeDialog({ moduleName, onClose }: PracticeGuideProps) {
  const steps = moduleSteps[moduleName] ?? [];
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Element highlighting
  useEffect(() => {
    clearHighlight();
    if (!started || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    if (step.element) {
      const el = step.element();
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add(highlightClass);
      }
    }
    return clearHighlight;
  }, [started, stepIndex, steps]);

  // Auto-detect completion
  useEffect(() => {
    if (!started || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    setWaiting(true);

    if (step.detect) {
      intervalRef.current = setInterval(() => {
        try {
          if (step.detect()) {
            clearCheck();
            setWaiting(false);
            setTimeout(() => setStepIndex((i) => i + 1), 400);
          }
        } catch {
          /* ignore */
        }
      }, 500);
    } else {
      setWaiting(false);
    }

    return clearCheck;
  }, [started, stepIndex, steps, clearCheck]);

  if (steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const content = !started ? (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-gray-700 max-w-sm w-full mx-4 p-5 text-center">
        <h3 className="text-base font-bold text-text-primary dark:text-white mb-1">
          Practica guiada
        </h3>
        <p className="text-sm text-text-secondary dark:text-text-tertiary mb-4">
          Haga una prueba de registro en <b>{moduleName}</b>. La guia detecta cada accion y avanza sola.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            No, gracias
          </button>
          <button onClick={() => setStarted(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
            Si, empezar
          </button>
        </div>
      </div>
    </div>
  ) : stepIndex >= steps.length ? (
    <div className="fixed bottom-0 left-0 right-0 z-[99999] pointer-events-none">
      <div className="max-w-lg mx-auto px-4 pb-4 pointer-events-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-sm text-text-primary dark:text-white font-medium">
            Practica completada
          </p>
          <p className="text-xs text-text-tertiary mb-3">
            Recuerde eliminar los datos de prueba del sistema.
          </p>
          <button onClick={onClose} className="px-3 py-1 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
            Finalizar
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="fixed bottom-0 left-0 right-0 z-[99999] pointer-events-none">
      <div className="max-w-xl mx-auto px-4 pb-4 pointer-events-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5">
          {/* Progress dots */}
          <div className="flex gap-1 mb-3">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"}`} />
            ))}
          </div>

          <div className="flex items-start gap-3">
            {/* Status + Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary dark:text-white truncate">
                {stepIndex + 1}. {step.title}
              </p>
              <p
                className="text-sm text-text-secondary dark:text-text-tertiary mt-1 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: step.instruction }}
              />
            </div>

            {/* Action */}
            <div className="shrink-0 mt-1">
              {waiting ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                  <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                  Esperando
                </span>
              ) : isLast ? (
                <button onClick={onClose} className="text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg transition-colors">
                  Finalizar
                </button>
              ) : (
                <span className="text-xs text-green-600 font-medium">Hecho</span>
              )}
            </div>
          </div>

          {/* Skip link */}
          {waiting && (
            <button
              onClick={() => { clearCheck(); setWaiting(false); if (isLast) onClose(); else setStepIndex((i) => i + 1); }}
              className="mt-2 text-xs text-text-tertiary hover:text-text-primary underline transition-colors"
            >
              Saltar paso
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
