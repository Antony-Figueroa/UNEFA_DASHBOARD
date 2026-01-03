import type { ReactNode, FormEvent } from "react";
import { useState, useEffect } from "react";
import InputField from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import MultiSelect from "../../../components/form/MultiSelect";
import Switch from "../../../components/form/switch/Switch";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";

type CrudFieldType = "text" | "number" | "select" | "multi-select" | "switch";

export interface CrudFieldOption {
  value: string;
  label: string;
}

export interface CrudFieldConfig {
  name: string;
  label: string;
  type: CrudFieldType;
  placeholder?: string;
  options?: CrudFieldOption[];
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export type CrudFormValues = Record<string, string | number | boolean | string[]>;

export interface CrudFormProps {
  fields: CrudFieldConfig[];
  initialValues?: Partial<CrudFormValues>;
  submitLabel?: string;
  secondaryActionLabel?: string;
  onSubmit: (values: CrudFormValues) => void;
  onSecondaryAction?: () => void;
  renderFooterExtra?: ReactNode;
  isLoading?: boolean;
}

type CrudFormErrors = Record<string, string | null>;

/**
 * Formulario configurable para operaciones CRUD.
 *
 * Genera campos dinámicamente a partir de `fields`, usando los
 * componentes de formulario base de TailAdmin y aplicando
 * validaciones simples en el cliente.
 *
 * @param props Configuración del formulario y callbacks de envío.
 */
export function CrudForm({
  fields,
  initialValues = {},
  submitLabel = "Guardar",
  secondaryActionLabel,
  onSubmit,
  onSecondaryAction,
  renderFooterExtra,
  isLoading = false,
}: CrudFormProps) {
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  const [values, setValues] = useState<CrudFormValues>(() => {
    const result: CrudFormValues = {};
    fields.forEach((field) => {
      const existing = initialValues[field.name];
      if (existing !== undefined) {
        result[field.name] = existing;
      } else if (field.type === "switch") {
        result[field.name] = false;
      } else if (field.type === "multi-select") {
        result[field.name] = [];
      } else {
        result[field.name] = "";
      }
    });
    return result;
  });

  const [errors, setErrors] = useState<CrudFormErrors>({});

  // Efecto para manejar el timeout de seguridad (30 segundos)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isInternalLoading) {
      timeoutId = setTimeout(() => {
        setIsInternalLoading(false);
        console.warn("[CrudForm] Timeout de 30s alcanzado. Rehabilitando botones.");
      }, 30000);
    }
    return () => clearTimeout(timeoutId);
  }, [isInternalLoading]);

  // Sincronizar estado interno con prop isLoading externa
  useEffect(() => {
    if (!isLoading && isInternalLoading) {
      setIsInternalLoading(false);
    }
  }, [isLoading, isInternalLoading]);

  const validateField = (field: CrudFieldConfig, value: unknown): string | null => {
    if (field.required) {
      if (field.type === "multi-select") {
        const arr = value as string[];
        if (!arr || arr.length === 0) {
          return "Este campo es obligatorio.";
        }
      } else if (value === "" || value === null || value === undefined) {
        return "Este campo es obligatorio.";
      }
    }

    if (field.type === "text" && typeof value === "string") {
      if (field.minLength && value.length < field.minLength) {
        return `Debe tener al menos ${field.minLength} caracteres.`;
      }
      if (field.maxLength && value.length > field.maxLength) {
        return `Debe tener como máximo ${field.maxLength} caracteres.`;
      }
    }

    if (field.type === "number") {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isNaN(n)) {
        if (field.min !== undefined && n < field.min) {
          return `Debe ser mayor o igual a ${field.min}.`;
        }
        if (field.max !== undefined && n > field.max) {
          return `Debe ser menor o igual a ${field.max}.`;
        }
      }
    }

    return null;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isInternalLoading || isLoading) return;

    const nextErrors: CrudFormErrors = {};
    fields.forEach((field) => {
      const value = values[field.name];
      nextErrors[field.name] = validateField(field, value);
    });
    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some((err) => err);
    if (hasErrors) return;

    setIsInternalLoading(true);
    onSubmit(values);
  };

  const handleChange = (name: string, value: string | number | boolean | string[]) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }) as CrudFormValues);
    const field = fields.find((f) => f.name === name);
    if (field) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const value = values[field.name];
          const error = errors[field.name];

          if (field.type === "text" || field.type === "number") {
            return (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                <InputField
                  type={field.type === "number" ? "number" : "text"}
                  id={field.name}
                  placeholder={field.placeholder}
                  value={String(value ?? "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                />
                {error && (
                  <p
                    id={`${field.name}-error`}
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {error}
                  </p>
                )}
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <div key={field.name}>
                <Label>{field.label}</Label>
                <Select
                  placeholder={field.placeholder}
                  defaultValue={String(value ?? "")}
                  onChange={(val) => handleChange(field.name, val)}
                  options={field.options ?? []}
                />
                {error && (
                  <p
                    id={`${field.name}-error`}
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {error}
                  </p>
                )}
              </div>
            );
          }

          if (field.type === "multi-select") {
            const selected = (value as string[]) ?? [];
            return (
              <div key={field.name}>
                <MultiSelect
                  label={field.label}
                  options={(field.options ?? []).map((opt) => ({
                    value: opt.value,
                    text: opt.label,
                  }))}
                  value={selected}
                  onChange={(next) => handleChange(field.name, next)}
                  placeholder={field.placeholder}
                />
                {error && (
                  <p
                    id={`${field.name}-error`}
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {error}
                  </p>
                )}
              </div>
            );
          }

          if (field.type === "switch") {
            return (
              <div key={field.name} className="flex items-center gap-3">
                <Switch
                  label={field.label}
                  defaultChecked={Boolean(value)}
                  onChange={(checked) => handleChange(field.name, checked)}
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
        {renderFooterExtra}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            disabled={isInternalLoading || isLoading}
          >
            {secondaryActionLabel}
          </Button>
        )}
        <Button
          type="submit"
          loading={isInternalLoading || isLoading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
