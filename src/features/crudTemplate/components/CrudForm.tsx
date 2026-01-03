import type { ReactNode, FormEvent } from "react";
import { useState } from "react";
import InputField from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import MultiSelect from "../../../components/form/MultiSelect";
import Switch from "../../../components/form/switch/Switch";

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
}: CrudFormProps) {
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
    const nextErrors: CrudFormErrors = {};
    fields.forEach((field) => {
      const value = values[field.name];
      nextErrors[field.name] = validateField(field, value);
    });
    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some((err) => err);
    if (hasErrors) return;

    onSubmit(values);
  };

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
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
                <InputField
                  type={field.type === "number" ? "number" : "text"}
                  label={field.label}
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
                <Select
                  label={field.label}
                  placeholder={field.placeholder}
                  value={String(value ?? "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
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
                  enabled={Boolean(value)}
                  setEnabled={(checked) => handleChange(field.name, checked)}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </span>
              </div>
            );
          }

          return null;
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
        {renderFooterExtra}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {secondaryActionLabel}
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
