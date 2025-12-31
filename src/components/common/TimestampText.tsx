import React from "react";
import { DateInput, formatDateTime } from "../../utils/date";

interface TimestampTextProps {
  value: DateInput;
  locale?: string;
  className?: string;
}

// Componente mínimo para convertir timestamps (número/ISO/Date) a texto legible DD/MM/YYYY HH:MM
export default function TimestampText({ value, locale = "es-VE", className }: TimestampTextProps) {
  const text = formatDateTime(value, locale);
  return <span className={className}>{text}</span>;
}

