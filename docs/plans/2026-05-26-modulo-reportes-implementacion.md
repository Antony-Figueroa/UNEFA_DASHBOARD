# Plan de Implementación: Módulo de Reportes v2.0

**Fecha:** 2026-05-26
**Estado:** Pendiente de aprobación
**Versión:** 1.0

---

## 1. Resumen

Implementar 16 reportes académicos (10 PDF + 6 Excel) requeridos por la Coordinación de Prácticas Profesionales de UNEFA, basados en los documentos oficiales en `docs/docs-unefa/Documentos UNEFA_/`. El módulo extiende la infraestructura existente de reportes (`src/features/reports/`, `src/components/ui/pdf/`, `src/utils/unefaExcelReports.ts`) y el backend (`backend/src/controllers/reports.controller.ts`).

---

## 2. Estado Actual vs. Objetivo

| Aspecto | Actual | Objetivo |
|---------|--------|----------|
| `src/features/reports/` | Solo `services/` y `components/` (2 archivos) | + `types/`, + `hooks/`, + `utils/`, + 4+ componentes nuevos |
| Reportes PDF | 11 templates genéricos (Student, Tutor, etc.) | +10 templates de documentos oficiales (cartas, actas, constancias) |
| Reportes Excel | 2 generadores (Anexo 4, Resumen Pasantias) | +4 generadores nuevos con formato institucional |
| Backend endpoints | 8 endpoints | +6 endpoints para datos específicos de nuevos reportes |
| UI de Reportes | 1 página (Reports.tsx) con selector dropdown | Sub-páginas/secciones organizadas por tipo de documento |

---

## 3. Análisis de Datos: Disponibilidad en Base de Datos

### 3.1 Datos que SÍ existen en BD

| Dato | Tabla | Columna | Status |
|------|-------|---------|--------|
| Estudiante: nombre, segundo nombre | `t_students` | NAME, SECOND_NAME | ✅ |
| Estudiante: apellidos | `t_students` | SURNAME, SECOND_SURNAME | ✅ |
| Estudiante: CI | `t_students` | STUDENTS_CI (formato "V-123456") | ✅ |
| Estudiante: teléfono | `t_students` | CONTACT_PHONE | ✅ |
| Estudiante: email | `t_students` | EMAIL | ✅ |
| Estudiante: dirección | `t_students` | ADDRESS | ✅ |
| Estudiante: género | `t_students` | GENDER ('M'/'F') | ✅ |
| Estudiante: tipo (civil/militar) | `t_students` | STUDENT_TYPE | ✅ |
| Estudiante: empleo (SI/NO) | `t_students` | EMPLOYMENT | ✅ |
| Tutor: título | `t_tutors` | TITULO (VARCHAR(50), **DEFAULT NULL**) | ⚠️ Nullable |
| Tutor: nombre, segundo nombre | `t_tutors` | NAME, SECOND_NAME | ✅ |
| Tutor: apellidos | `t_tutors` | SURNAME, SECOND_SURNAME | ✅ |
| Tutor: CI | `t_tutors` | TUTOR_CI (formato "V-123456") | ✅ |
| Tutor: condición | `t_tutors` | CONDITION ('ORDINARIO'/'CONTRATADO') | ✅ |
| Tutor: dedicación | `t_tutors` | DEDICATION ('DEDICACIÓN EXCLUSIVA'/'TIEMPO COMPLETO'/'TIEMPO CONVENCIONAL'/'MEDIO TIEMPO') | ✅ |
| Tutor: categoría | `t_tutors` | CATEGORY (6 niveles: Auxiliar a Titular) | ✅ |
| Tutor: teléfono | `t_tutors` | CONTACT_PHONE | ✅ |
| Tutor: email | `t_tutors` | EMAIL | ✅ |
| Carrera: nombre | `t_career` | CAREER_NAME | ✅ |
| Carrera: abreviatura | `t_career` | CAREER_ABBREVIATION | ✅ |
| Institución: nombre | `t_institution` | INSTITUTION_NAME | ✅ |
| Institución: RIF | `t_institution` | RIF | ✅ |
| Institución: tipo | `t_institution` | INSTITUTION_TYPE | ✅ |
| Institución: región/núcleo/extensión | `t_institution` | REGION, NUCLEUS, EXTENSION | ✅ |
| Institución: dirección | `t_institution` | INSTITUTION_ADDRESS | ✅ |
| Institución: contacto | `t_institution` | INSTITUTION_CONTACT | ✅ |
| Periodo académico: descripción | `t_internships_period` | DESCRIPTION | ✅ |
| Periodo académico: fechas inicio/fin | `t_internships_period` | START_DATE, END_DATE | ✅ |
| Práctica profesional: fechas PP | `t_professional_practices` | START_DATE, END_DATE | ✅ |
| Práctica profesional: nota | `t_professional_practices` | GRADE | ✅ |
| Práctica profesional: régimen | `t_professional_practices` | REGIME ('DIURNO'/'NOCTURNO'/'SABATINO') | ✅ |
| Práctica profesional: semestre | `t_professional_practices` | SEMESTER | ✅ |
| Práctica profesional: sección | `t_professional_practices` | SECTION | ✅ |
| Tipo de pasantía | `t_internship_type` | NAME | ✅ |
| Evaluación: tipo evaluador | `t_evaluation` | EVALUATOR_TYPE ('INSTITUCIONAL'/'ACADEMICO'/'COMITE') | ✅ |
| Evaluación: nombre evaluador | `t_evaluation` | EVALUATOR_NAME | ✅ |
| Evaluación: CI evaluador | `t_evaluation` | EVALUATOR_CI (nullable) | ⚠️ Nullable |
| Evaluación: score total | `t_evaluation` | TOTAL_SCORE | ✅ |
| Evaluación: observaciones | `t_evaluation` | OBSERVATIONS (nullable) | ⚠️ Nullable |
| Evaluación: criterios | `t_evaluation_criteria` | DESCRIPTION, ITEM_NUMBER, EVALUATOR_TYPE | ✅ |
| Evaluación: puntuaciones detalle | `t_evaluation_detail` | SCORE (1-5), ITEM_NUMBER | ✅ |
| Tracking: horas totales | `t_tracking` | TOTAL_HOURS (tabla existe en Supabase aunque no en schema file) | ✅ |
| Tracking: horas trabajadas | `t_tracking` | HOURS_WORKED | ✅ |
| Asignación tutor-práctica | `t_professional_practices_tutor` | TUTOR_TYPE: 'ACADEMICO', 'METODOLOGICO', 'INSTITUCIONAL' | ✅ |

### 3.2 Datos que NO existen en BD

| Concepto | Reportes afectados | Tipo de ausencia |
|----------|-------------------|------------------|
| **Prefijo V/E separado** del número de CI | Todos los PDF (1-10) | Se almacena como cadena única "V-12345678". Hay que parsear. |
| **Texto completo de cartas** (cuerpo de aceptación, solicitud, postulación, acta, constancia) | Reportes PDF 1, 2, 3, 4, 9, 10 | Texto fijo del documento institucional |
| **Firma "MSc. Marbelys del Valle Rivero, Decana del Núcleo Portuguesa"** | Reportes PDF 2, 9, 10 | Figura institucional no modelada en BD |
| **Orden administrativa N° 0005 de fecha 18/03/2022** | Reportes PDF 2, 10 | Referencia legal fija |
| **COORDINADOR DE PRÁCTICAS PROFESIONALES** | Reporte PDF 8 (Comité Evaluador) | Rol que no existe en `t_roles` ni como tabla |
| **COORDINADOR DE CARRERA** | Reporte PDF 8 (Comité Evaluador) | Rol que no existe en BD |
| **DEPARTAMENTO donde se efectuó la PP** | Reporte PDF 6 | No existe campo en `t_professional_practices` ni `t_institution` |
| **Horario de atención del tutor metodológico** | Reportes Excel 13, 16 | No existe en `t_tutors` |
| **Tabla de templates de documentos / texto configurable** | Todos los PDF | No existe mecanismo para editar textos desde UI |

---

## 4. Decisiones Pendientes (para debate con el equipo)

### Decisión A: COORDINADOR DE PP y COORDINADOR DE CARRERA (Reporte 8)

El documento "EVALUACION COMITÉ EVALUADOR" requiere incluir:
- Coordinador de Prácticas Profesionales
- Coordinador de Carrera

**Opciones:**
1. **Crear tabla `t_coordinadores`** con campos: `COORDINADOR_ID, TIPO ('PP'/'CARRERA'), CAREER_ID (nullable), NAME, CI, CARGO, STATUS` — requiere migración
2. **Campos configurables desde UI** — agregar entrada en `t_landing_config` o `t_config` para almacenar nombres
3. **Hardcodear temporalmente** — valores placeholder mientras se define la estructura definitiva

### Decisión B: DEPARTAMENTO donde se efectuó la PP (Reporte 6)

**Opciones:**
1. **Agregar columna `DEPARTMENT` a `t_professional_practices`** (`VARCHAR(255) DEFAULT NULL`) — requiere migración
2. **Campo libre/opcional** — que el usuario lo escriba al generar el reporte (menos automatizado)
3. **Usar `t_institution_manager.cargo`** como aproximación (no es exacto pero existe)

### Decisión C: Horario de atención del tutor metodológico (Excel 13, 16)

**Opciones:**
1. **Agregar columna `ATTENTION_SCHEDULE` a `t_tutors`** (`VARCHAR(255) DEFAULT NULL`) — requiere migración
2. **Omitir del Excel** — dejar la columna vacía por ahora
3. **Campo editable al generar** — que el usuario lo complete manualmente

### Decisión D: Nivel de configurabilidad de textos

¿Qué tan editables deben ser los textos de los documentos?

1. **Nivel 1 (mínimo): Constantes en código** — textos en `documentTexts.ts` con placeholders `{{variable}}`. Para cambiar hay que editar código.
2. **Nivel 2 (medio): Tabla en BD** — crear `t_report_text_templates (id, report_type, section, content_template, updated_at)` con override desde BD. UI de administración básica.
3. **Nivel 3 (completo): Editor visual** — editor WYSIWYG/WYSIWYM en el panel de administración. Más complejo.

### Decisión E: Firmas digitales

**Opciones:**
1. **Solo texto estilizado** — `"MSc. Marbelys del Valle Rivero\nDecana del Núcleo Portuguesa"`
2. **Imagen de firma escaneada** — requiere asset digital de la firma real
3. **Firma generada por sistema** — usar fuente cursiva para simular firma

### Decisión F: TITULO del tutor cuando es NULL

**Opciones:**
1. Usar default `"Prof."` para todos
2. Usar `"Tutor Académico"` como título por defecto
3. Mostrar solo el nombre sin título

---

## 5. Sistema de Textos Configurables (Arquitectura Propuesta)

Independientemente de la decisión D, la arquitectura propuesta es de **3 capas**:

```typescript
// Capa 1: Textos default en código
// src/features/reports/utils/documentTexts.ts
export const REPORT_TEXTOS: Record<string, DocumentTemplate> = {
  aceptacion_tutor: {
    encabezado: "Por medio de la presente, yo, {{tutorTitulo}} {{tutorNombre}}, portador de la C.I. {{tutorCi}}, en mi carácter de Tutor Académico, ACEPTO formalmente tutoriar al(la) estudiante {{estudianteNombre}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, durante el desarrollo de sus Prácticas Profesionales.",
    // ...
  },
  solicitud_institucion: {
    destinatario: "MSc. Marbelys del Valle Rivero",
    cargo: "Decana del Núcleo Portuguesa",
    orden: "Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022",
    cuerpo: "Yo, {{estudianteNombre}}, titular de la C.I. {{estudianteCi}}, cursante de {{carrera}}, ante usted ocurro para solicitar...",
    // ...
  },
  constancia_tutor_academico: {
    // ...
  },
  // ... resto de plantillas
};

// Función de renderizado con placeholders
function renderDocumentText(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `[${key}]`);
}
```

```sql
-- Capa 2 (futura): Tabla opcional en BD para override
CREATE TABLE IF NOT EXISTS "t_report_text_templates" (
  "TEMPLATE_ID" SERIAL NOT NULL,
  "REPORT_TYPE" VARCHAR(50) NOT NULL,   -- 'aceptacion_tutor', 'solicitud_institucion', etc.
  "SECTION" VARCHAR(50) NOT NULL,        -- 'encabezado', 'cuerpo', 'firma', etc.
  "CONTENT_TEMPLATE" TEXT NOT NULL,      -- Texto con {{placeholders}}
  "UPDATED_BY" INTEGER,
  "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("TEMPLATE_ID"),
  UNIQUE ("REPORT_TYPE", "SECTION")
);
```

**Flujo de resolución:**
```
1. Sistema busca en BD (t_report_text_templates) → si existe, usa ese texto
2. Si no existe en BD → usa el default de documentTexts.ts
3. Reemplaza {{placeholders}} con datos reales del reporte
4. Renderiza en PDF
```

---

## 6. Reportes a Implementar

### 6.1 Reportes PDF (documentos formales)

Cada uno es un documento individual con membrete institucional y firmas.

| # | Reporte | Tipo | Datos | Origen BD | Origen Texto Fijo |
|---|---------|------|-------|-----------|-------------------|
| 1 | **ACEPTACIÓN DEL TUTOR ACADÉMICO** | Individual (1 práctica) | Tutor (título, nombre, CI, teléfono), Estudiante (nombre, CI, carrera) | `t_tutors` + `t_students` + `t_career` via `t_professional_practices` | Carta de aceptación |
| 2 | **SOLICITUD DE INSTITUCIÓN** | Individual (1 práctica) | Institución, Estudiante (nombre, CI, carrera, lapso), Firma Decana | `t_institution` + `t_students` + `t_internships_period` | Carta solicitud + Firma Decana + Orden N° 0005 |
| 3 | **SOLICITUD DE CARTA DE POSTULACIÓN** | Individual (1 práctica) | Estudiante (nombre, CI, contacto, régimen, carrera, semestre, trabajo), Institución, Tutor Institucional | `t_students` + `t_professional_practices` + `t_institution` + `t_tutors` (INSTITUCIONAL) | Carta de postulación |
| 4 | **ACTA DE VALIDACION** | Individual (1 práctica) | Estudiante (carrera, nombre, CI) | `t_students` + `t_career` | Texto del acta |
| 5 | **EVALUACION FINAL DE LA PP** | Individual (1 práctica) | Estudiante (nombre, CI, carrera), Institución, Fechas PP, Nota (GRADE) | `t_professional_practices` + `t_students` + `t_career` + `t_institution` | Texto evaluación + Firmas |
| 6 | **EVALUACION TUTOR INSTITUCIONAL** | Individual (1 práctica) | Estudiante (nombre, CI, periodo, carrera), Institución, **Departamento** ⚠️, Tutor Inst. (nombre, CI), Fechas PP, Criterios + puntuaciones | `t_evaluation` + `t_evaluation_detail` + `t_evaluation_criteria` + `t_students` + `t_tutors` | Texto formulario + **Departamento no existe en BD** |
| 7 | **EVALUACION TUTOR ACADEMICO** | Individual (1 práctica) | Estudiante (nombre, CI, carrera), Tutor Acad. (nombre, CI), Fechas PP, Criterios + puntuaciones | `t_evaluation` + `t_evaluation_detail` + `t_evaluation_criteria` + `t_students` + `t_tutors` | Texto formulario |
| 8 | **EVALUACION COMITÉ EVALUADOR** | Individual (1 práctica) | Estudiante (nombre, CI, carrera, periodo), **Coordinador PP** ⚠️, **Coordinador Carrera** ⚠️, Tutor Acad. (nombre, CI) | `t_students` + `t_career` + `t_tutors` | **Coordinadores no existen en BD** |
| 9 | **CONSTANCIA TUTOR ACADÉMICO** | Individual (1 tutor + período) | Tutor (título, nombre, CI, condición, dedicación, horas académicas, periodo, lapso), Firma Decana | `t_tutors` + `t_tracking` (TOTAL_HOURS) + `t_internships_period` | Constancia + Firma Decana |
| 10 | **CONSTANCIA TUTOR INSTITUCIONAL** | Individual (1 tutor + período) | Institución, Tutor (título, nombre, CI, horas acompañamiento, periodo, lapso), Firma Decana | `t_institution` + `t_tutors` + `t_tracking` (TOTAL_HOURS) + `t_internships_period` | Constancia + Firma Decana |

### 6.2 Reportes Excel (tablas con formato institucional)

| # | Reporte | Columnas | Backend Endpoint |
|---|---------|----------|------------------|
| 11 | **RESUMEN PASANTIAS (PERIODO)** | Región, Núcleo, Extensión, Carrera, Cant. Tutores Acad., Cant. Estudiantes, Empresa, Tipo (Pública/Privada), Cant. Tutores Inst., Observación | `GET /api/reports/resumen-pasantias` (existente) |
| 12 | **RELACION DE EMPRESAS QUE DEMANDAN PASANTES** | Región, Núcleo, Extensión, Empresa, RIF, Tipo (Pública/Privada), Carrera, Cant. Estudiantes Solicitados | `GET /api/reports/relacion-empresas-demandan` (nuevo) |
| 13 | **DISTRIBUCION DE TUTORES** | N°, Carrera, Estudiante (nombre + CI), Tutor Académico (título, nombre, contacto, email), Tutor Metodológico (título, nombre, contacto), **Horario ⚠️**, Evaluador (título, nombre, contacto) | `GET /api/reports/distribucion-tutores` (nuevo) |
| 14 | **RELACIÓN GENERAL DE TUTORES ACADÉMICOS** | N°, Región, Núcleo, Extensión, Carrera, Nombre, Apellido, CI, Condición, Dedicación, Categoría, Teléfono, Email, Cant. Estudiantes | `GET /api/reports/tutores-academicos` (existente, mejorar) |
| 15 | **RELACIÓN INDIVIDUAL DE DOCENTES** | N°, Región, Núcleo, Extensión, Carrera, Estudiante (nombre, apellido, CI, sexo, tipo, teléfono), Institución (nombre, tipo), Tutor Inst. (apellidos, nombre, CI, teléfono, email), Dirección, Observaciones | `GET /api/reports/relacion-individual-docente/:tutorId` (nuevo) |
| 16 | **DISTRIBUCIÓN DE TUTORES v2** | Similar al #13 con columnas adicionales de horario del tutor metodológico y evaluador detallado | `GET /api/reports/distribucion-tutores-v2` (nuevo) |

---

## 7. Arquitectura de Implementación

### 7.1 Frontend: Nuevos Archivos

```
src/
├── features/
│   └── reports/
│       ├── types/
│       │   └── index.ts                    # Interfaces para todos los reportes
│       ├── services/
│       │   └── reportsService.ts           # Extender con 6+ métodos
│       ├── hooks/
│       │   └── useReports.ts               # Hook unificado de generación
│       ├── components/
│       │   ├── CulminatedStudentsFilters.tsx # Existente
│       │   ├── CulminatedStudentsTable.tsx   # Existente
│       │   ├── ReportCard.tsx               # Tarjeta de reporte individual
│       │   ├── ReportList.tsx              # Grid de reportes por categoría
│       │   └── DocumentReportModal.tsx     # Modal para documentos PDF individuales
│       └── utils/
│           ├── documentTexts.ts            # Textos default con placeholders para cada documento
│           ├── documentRenderer.ts         # Función de renderizado de placeholders
│           ├── unefaExcelReports.ts        # Extender con 4 generadores nuevos
│           └── reportFormatters.ts         # Formateadores comunes (CI, fecha, nombre, etc.)
│
├── components/
│   └── ui/
│       └── pdf/
│           └── templates/
│               └── institutional/          # Documentos oficiales
│                   ├── AceptacionTutorPDF.tsx
│                   ├── SolicitudInstitucionPDF.tsx
│                   ├── CartaPostulacionPDF.tsx
│                   ├── ActaValidacionPDF.tsx
│                   ├── EvaluacionFinalPDF.tsx
│                   ├── EvaluacionTutorInstitucionalPDF.tsx
│                   ├── EvaluacionTutorAcademicoPDF.tsx
│                   ├── EvaluacionComitePDF.tsx
│                   ├── ConstanciaTutorAcademicoPDF.tsx
│                   ├── ConstanciaTutorInstitucionalPDF.tsx
│                   └── index.ts
│
├── pages/
│   └── Reports/
│       ├── Reports.tsx                     # Refactorizar con tarjetas y secciones
│       └── CulminatedStudentsReport.tsx    # Existente
```

### 7.2 Backend: Nuevos Archivos/Extensiones

```
backend/src/
├── controllers/
│   ├── reports.controller.ts              # Extender con funciones nuevas
│   └── documents.controller.ts            # Lógica específica de documentos oficiales
│
├── routes/
│   ├── reports.routes.ts                  # Extender con rutas nuevas
│   └── documents.routes.ts               # Rutas para documentos oficiales
│
└── middleware/
    └── reportValidation.ts                # Validación de parámetros de reportes
```

### 7.3 Endpoints Backend

#### Existentes (mejorar):
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/reports/tutores-academicos` | Relación General Tutores (Anexo 4) |
| GET | `/api/reports/resumen-pasantias` | Resumen Pasantías (Excel 11) |
| GET | `/api/reports/culminated-students` | Estudiantes Culminados |

#### Nuevos:
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/reports/aceptacion-tutor/:practiceId` | Reporte PDF 1 |
| GET | `/api/reports/solicitud-institucion/:practiceId` | Reporte PDF 2 |
| GET | `/api/reports/carta-postulacion/:practiceId` | Reporte PDF 3 |
| GET | `/api/reports/acta-validacion/:practiceId` | Reporte PDF 4 |
| GET | `/api/reports/evaluacion-final/:practiceId` | Reporte PDF 5 |
| GET | `/api/reports/evaluacion-tutor-institucional/:practiceId` | Reporte PDF 6 |
| GET | `/api/reports/evaluacion-tutor-academico/:practiceId` | Reporte PDF 7 |
| GET | `/api/reports/evaluacion-comite/:practiceId` | Reporte PDF 8 |
| GET | `/api/reports/constancia-tutor-academico/:tutorId` | Reporte PDF 9 |
| GET | `/api/reports/constancia-tutor-institucional/:tutorId` | Reporte PDF 10 |
| GET | `/api/reports/relacion-empresas-demandan` | Reporte Excel 12 |
| GET | `/api/reports/distribucion-tutores` | Reporte Excel 13 |
| GET | `/api/reports/relacion-individual-docente/:tutorId` | Reporte Excel 15 |
| GET | `/api/reports/distribucion-tutores-v2` | Reporte Excel 16 |

### 7.4 Consultas SQL Principales

#### Datos base de práctica + estudiante + carrera (reportes 1-5)

```sql
SELECT
  pp.PROFESSIONAL_PRACTICE_ID, pp.START_DATE, pp.END_DATE,
  pp.GRADE, pp.REGIME, pp.SEMESTER, pp.SECTION,
  s.STUDENTS_CI, s.NAME, s.SECOND_NAME, s.SURNAME, s.SECOND_SURNAME,
  s.CONTACT_PHONE, s.EMAIL, s.EMPLOYMENT, s.STUDENT_TYPE, s.GENDER,
  c.CAREER_NAME, c.CAREER_ABBREVIATION,
  i.INSTITUTION_NAME, i.INSTITUTION_TYPE, i.INSTITUTION_ADDRESS,
  i.REGION, i.NUCLEUS, i.EXTENSION, i.RIF,
  ip.DESCRIPTION AS PERIOD_DESC,
  ip.START_DATE AS PERIOD_START, ip.END_DATE AS PERIOD_END,
  it.NAME AS INTERNSHIP_TYPE
FROM t_professional_practices pp
JOIN t_students s ON pp.STUDENTS_ID = s.STUDENTS_ID
JOIN t_career c ON pp.CAREER_ID = c.CAREER_ID
LEFT JOIN t_institution i ON pp.INSTITUTION_ID = i.INSTITUTION_ID
JOIN t_internships_period ip ON pp.PERIOD_ID = ip.PERIOD_ID
JOIN t_internship_type it ON pp.INTERNSHIP_TYPE_ID = it.INTERNSHIP_TYPE_ID
WHERE pp.PROFESSIONAL_PRACTICE_ID = :practiceId
```

#### Tutores asignados a una práctica (reportes 1, 3, 6, 7, 8)

```sql
SELECT
  ppt.TUTOR_TYPE,
  t.TUTOR_CI, t.NAME, t.SECOND_NAME, t.SURNAME, t.SECOND_SURNAME,
  t.TITULO, t.CONDITION, t.DEDICATION, t.CATEGORY,
  t.CONTACT_PHONE, t.EMAIL
FROM t_professional_practices_tutor ppt
JOIN t_tutors t ON ppt.TUTOR_ID = t.TUTOR_ID
WHERE ppt.PROFESSIONAL_PRACTICE_ID = :practiceId
```

#### Evaluaciones con criterios y puntuaciones (reportes 6, 7, 8)

```sql
SELECT
  e.EVALUATION_ID, e.EVALUATOR_TYPE, e.EVALUATOR_NAME, e.EVALUATOR_CI,
  e.TOTAL_SCORE, e.OBSERVATIONS, e.EVALUATION_DATE,
  ed.ITEM_NUMBER, ed.SCORE, ec.DESCRIPTION AS CRITERIA_DESC
FROM t_evaluation e
LEFT JOIN t_evaluation_detail ed ON e.EVALUATION_ID = ed.EVALUATION_ID
LEFT JOIN t_evaluation_criteria ec ON ed.CRITERIA_ID = ec.CRITERIA_ID
WHERE e.PROFESSIONAL_PRACTICE_ID = :practiceId
ORDER BY e.EVALUATOR_TYPE, ed.ITEM_NUMBER
```

---

## 8. Plan de Implementación por Fases

### Fase 1: Fundación (Días 1-2) — 4 archivos

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 1.1 | `src/features/reports/types/index.ts` | Definir interfaces para todos los reportes (ver sección 6) |
| 1.2 | `src/features/reports/services/reportsService.ts` | Extender con métodos para cada endpoint nuevo |
| 1.3 | `src/features/reports/utils/documentTexts.ts` | Textos default con placeholders para cada documento |
| 1.4 | `src/features/reports/utils/documentRenderer.ts` | Función de renderizado (reemplazo de placeholders) |
| 1.5 | `src/features/reports/utils/reportFormatters.ts` | Formateadores: `formatCI()`, `formatNombreCompleto()`, `formatFecha()`, `getTitlePrefix()` |

### Fase 2: Backend (Días 3-5) — ~4 archivos

| Tarea | Endpoint | Descripción |
|-------|----------|-------------|
| 2.1 | Documentos: 10 endpoints individuales | `documents.controller.ts` con queries para cada tipo de documento |
| 2.2 | Reportes Excel: endpoints agrupados | Extender `reports.controller.ts` con funciones para Relación Empresas, Distribución Tutores, Relación Individual Docente |
| 2.3 | Rutas | `documents.routes.ts` + extender `reports.routes.ts` |
| 2.4 | Registro en app | `backend/src/app.ts` |

### Fase 3: Plantillas PDF (Días 6-10) — 11 archivos

| Tarea | Plantilla | Datos que recibe |
|-------|-----------|------------------|
| 3.1 | `AceptacionTutorPDF.tsx` | `{ tutor, estudiante, carrera }` |
| 3.2 | `SolicitudInstitucionPDF.tsx` | `{ institucion, estudiante, carrera, periodo }` + textos fijos Decana |
| 3.3 | `CartaPostulacionPDF.tsx` | `{ estudiante, institucion, tutorInstitucional }` |
| 3.4 | `ActaValidacionPDF.tsx` | `{ estudiante, carrera }` |
| 3.5 | `EvaluacionFinalPDF.tsx` | `{ estudiante, institucion, fechas, grade }` |
| 3.6 | `EvaluacionTutorInstitucionalPDF.tsx` | `{ estudiante, institucion, tutorInst, criterios[], totalScore, observaciones }` + **departamento ⚠️** |
| 3.7 | `EvaluacionTutorAcademicoPDF.tsx` | `{ estudiante, tutorAcad, criterios[], totalScore, fechas }` |
| 3.8 | `EvaluacionComitePDF.tsx` | `{ estudiante, periodo, tutorAcad }` + **coordinadores ⚠️** |
| 3.9 | `ConstanciaTutorAcademicoPDF.tsx` | `{ tutor, totalHours, periodo }` + Firma Decana |
| 3.10 | `ConstanciaTutorInstitucionalPDF.tsx` | `{ tutor, institucion, totalHours, periodo }` + Firma Decana |
| 3.11 | `institutional/index.ts` | Barrel exports |

**Patrón de cada template:**
```tsx
import PDFLayout from "../../PDFLayout";
import { pdfStyles } from "../../PDFStyles";
import { renderDocumentText } from "../../../../features/reports/utils/documentRenderer";
import { REPORT_TEXTOS } from "../../../../features/reports/utils/documentTexts";

export const MiReportePDF: React.FC<Props> = ({ data }) => {
  const cuerpo = renderDocumentText(
    REPORT_TEXTOS.mi_reporte.cuerpo,
    { nombre: data.estudiante.nombre, ci: formatCI(data.estudiante.ci), ... }
  );

  return (
    <PDFLayout title="TÍTULO OFICIAL">
      <View style={styles.body}>
        <Text style={styles.paragraph}>{cuerpo}</Text>
        {/* Tablas, firmas, etc. */}
      </View>
    </PDFLayout>
  );
};
```

### Fase 4: Generadores Excel (Días 11-12) — 1 archivo + mejoras

| Tarea | Generador | Tecnología | Formato |
|-------|-----------|------------|---------|
| 4.1 | `generateResumenPasantiasExcel` (mejorar) | ExcelJS | Encabezado institucional + logos + colores + merged cells |
| 4.2 | `generateRelacionEmpresasExcel` | ExcelJS | Mismo formato institucional con checkboxes (X) para tipo público/privado |
| 4.3 | `generateDistribucionTutoresExcel` | ExcelJS | Datos combinados de tutor acad, metodológico y evaluador |
| 4.4 | `generateRelacionGeneralTutoresExcel` (mejorar de XLSX a ExcelJS) | ExcelJS | Migrar de XLSX a ExcelJS para mejor formato visual |
| 4.5 | `generateRelacionIndividualDocenteExcel` | ExcelJS | Datos detallados por estudiante con tutor institucional completo |
| 4.6 | `generateDistribucionTutoresV2Excel` | ExcelJS | Variante con horario metodológico |

### Fase 5: UI e Integración (Días 13-15) — 5 archivos

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 5.1 | `src/features/reports/hooks/useReports.ts` | Hook unificado que orquesta carga de datos, estados loading/error, y descarga |
| 5.2 | `src/features/reports/components/ReportCard.tsx` | Tarjeta visual con ícono, nombre, descripción, estado y botones de acción |
| 5.3 | `src/features/reports/components/ReportList.tsx` | Grid de tarjetas agrupadas en secciones: Documentos Oficiales, Reportes de Datos, Planillas |
| 5.4 | `src/features/reports/components/DocumentReportModal.tsx` | Basado en `SingleReportModal`, con selector de práctica/estudiante para documentos individuales |
| 5.5 | `src/pages/Reports/Reports.tsx` | Refactorizar: mantener métricas y gráficos, reemplazar selector dropdown por ReportList |

---

## 9. Manejo de Casos Especiales

### 9.1 Prefijo V/E de cédula

Actualmente las cédulas se almacenan como `"V-12345678"` o `"E-87654321"` en un solo VARCHAR.

```typescript
// src/features/reports/utils/reportFormatters.ts
export function parseCI(ci: string): { prefix: string; number: string } {
  const parts = ci.split('-');
  return {
    prefix: parts[0] || 'V',
    number: parts[1] || ci
  };
}

export function formatCI(ci: string): string {
  const { prefix, number } = parseCI(ci);
  return `${prefix}/${number}`; // Formato "V/E - CEDULA" como piden los documentos
}
```

### 9.2 TITULO del tutor nullable

```typescript
export function getTutorTitle(titulo: string | null): string {
  if (!titulo) return 'Prof.'; // Default si no hay título registrado
  return titulo;
}

export function getTutorFullName(tutor: {
  titulo: string | null;
  name: string;
  surname: string;
}): string {
  const title = getTutorTitle(tutor.titulo);
  return `${title}. ${tutor.name} ${tutor.surname}`;
}
```

### 9.3 Datos faltantes (protegidos contra null)

Todos los campos opcionales (nullable en BD) se manejan con valores default:
- `TITULO` → `"Prof."`
- `SECOND_NAME` / `SECOND_SURNAME` → `""`
- `OBSERVATIONS` → `""` (o `"Sin observaciones"`)
- `TOTAL_HOURS` → `0`
- `GRADE` → `0`
- `EVALUATOR_CI` → `""`

### 9.4 Documentos sin evaluaciones registradas

Para los reportes de evaluación (5-8), validar si `t_evaluation` tiene registros para la práctica:

```typescript
// Si no hay evaluación, el reporte muestra mensaje:
"No se encontraron evaluaciones registradas para esta práctica profesional."
```

---

## 10. Dependencias y Riesgos

| Riesgo | Impacto | Prob. | Mitigación |
|--------|---------|-------|------------|
| TITULO del tutor NULL en muchos registros | Medio | Alta | Default "Prof." con lógica en formateador |
| `t_tracking` sin TOTAL_HOURS para algunas prácticas | Medio | Media | Mostrar 0 con nota "Sin registrar" |
| Coordinadores PP/Carrera no existen en BD | Alto | Alta | Pendiente de decisión del equipo (Decisión A) |
| DEPARTAMENTO no existe en BD | Medio | Alta | Pendiente de decisión del equipo (Decisión B) |
| Horario tutor metodológico no existe | Bajo | Alta | Pendiente de decisión del equipo (Decisión C) |
| Estudiantes sin institución asignada | Bajo | Media | LEFT JOIN y mostrar "No asignada" |
| Periodos sin prácticas registradas | Bajo | Baja | Respuesta vacía con mensaje "No hay datos" |
| Firmas digitales no disponibles | Medio | Media | Pendiente de decisión del equipo (Decisión E) |

---

## 11. Criterios de Aceptación

- [ ] Cada reporte PDF se genera con el membrete institucional correcto (PDFLayout)
- [ ] Los placeholders en textos se reemplazan correctamente con datos reales
- [ ] Los datos de estudiantes, tutores e instituciones se cargan desde Supabase
- [ ] El prefijo V/E se muestra en formato "V/E - CEDULA" en todos los documentos
- [ ] TITULO del tutor usa default "Prof." cuando es NULL
- [ ] Las evaluaciones muestran criterios y puntuaciones correctas
- [ ] Las constancias incluyen firma de la Decana (texto o imagen)
- [ ] Los 6 reportes Excel se descargan como `.xlsx` con formato institucional
- [ ] La UI de Reports.tsx muestra todos los reportes organizados en secciones
- [ ] Cada endpoint tiene manejo de errores con mensajes descriptivos
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores

---

## 12. Esfuerzo Estimado

| Fase | Días | Archivos nuevos | Archivos modificados | Dependencias |
|------|------|-----------------|---------------------|--------------|
| Fase 1: Fundación | 2 | 4 | 1 | Ninguna |
| Fase 2: Backend | 3 | 3 | 3 | Fase 1 |
| Fase 3: PDF Templates | 5 | 11 | 1 | Fase 2 |
| Fase 4: Excel Generators | 2 | 0 | 2 | Fase 2 |
| Fase 5: UI Integration | 3 | 5 | 1 | Fases 3 y 4 |
| **Total** | **15** | **~23** | **~8** | |

---

## 13. Decisiones del Equipo (Pendientes)

Las siguientes decisiones deben ser discutidas y acordadas antes de iniciar la implementación:

### Decisión A: Coordinadores (Reporte 8)
- ¿Crear tabla `t_coordinadores`, usar texto configurable, o hardcodear temporalmente?

### Decisión B: Departamento (Reporte 6)
- ¿Agregar columna a `t_professional_practices`, campo libre, o usar `t_institution_manager.cargo`?

### Decisión C: Horario tutor metodológico (Excel 13, 16)
- ¿Columna nueva en `t_tutors`, omitir campo, o campo editable?

### Decisión D: Nivel de configurabilidad de textos
- ¿Nivel 1 (constantes en código), Nivel 2 (BD + UI básica), o Nivel 3 (editor visual)?

### Decisión E: Firmas digitales
- ¿Solo texto estilizado, imagen escaneada de firma real, o firma generada por sistema?

### Decisión F: TITULO default
- ¿"Prof.", "Tutor Académico", o solo nombre sin título?

### Decisión G: Orden de implementación
- ¿Implementar todos los reportes de una vez o por lotes (ej: primero PDFs, luego Excels)?
- ¿Hay algún reporte prioritario que deba implementarse primero?

---

## 14. Archivos a Modificar/Crear

### Crear (~23 archivos)

| # | Archivo | Fase |
|---|---------|------|
| 1 | `src/features/reports/types/index.ts` | 1 |
| 2 | `src/features/reports/utils/documentTexts.ts` | 1 |
| 3 | `src/features/reports/utils/documentRenderer.ts` | 1 |
| 4 | `src/features/reports/utils/reportFormatters.ts` | 1 |
| 5 | `src/features/reports/hooks/useReports.ts` | 5 |
| 6 | `src/features/reports/components/ReportCard.tsx` | 5 |
| 7 | `src/features/reports/components/ReportList.tsx` | 5 |
| 8 | `src/features/reports/components/DocumentReportModal.tsx` | 5 |
| 9 | `src/components/ui/pdf/templates/institutional/AceptacionTutorPDF.tsx` | 3 |
| 10 | `src/components/ui/pdf/templates/institutional/SolicitudInstitucionPDF.tsx` | 3 |
| 11 | `src/components/ui/pdf/templates/institutional/CartaPostulacionPDF.tsx` | 3 |
| 12 | `src/components/ui/pdf/templates/institutional/ActaValidacionPDF.tsx` | 3 |
| 13 | `src/components/ui/pdf/templates/institutional/EvaluacionFinalPDF.tsx` | 3 |
| 14 | `src/components/ui/pdf/templates/institutional/EvaluacionTutorInstitucionalPDF.tsx` | 3 |
| 15 | `src/components/ui/pdf/templates/institutional/EvaluacionTutorAcademicoPDF.tsx` | 3 |
| 16 | `src/components/ui/pdf/templates/institutional/EvaluacionComitePDF.tsx` | 3 |
| 17 | `src/components/ui/pdf/templates/institutional/ConstanciaTutorAcademicoPDF.tsx` | 3 |
| 18 | `src/components/ui/pdf/templates/institutional/ConstanciaTutorInstitucionalPDF.tsx` | 3 |
| 19 | `src/components/ui/pdf/templates/institutional/index.ts` | 3 |
| 20 | `backend/src/controllers/documents.controller.ts` | 2 |
| 21 | `backend/src/routes/documents.routes.ts` | 2 |
| 22 | `backend/src/middleware/reportValidation.ts` | 2 |

### Modificar (~8 archivos)

| # | Archivo | Cambio | Fase |
|---|---------|--------|------|
| 1 | `src/features/reports/services/reportsService.ts` | +6 métodos nuevos | 1 |
| 2 | `src/utils/unefaExcelReports.ts` | +4 generadores + mejora 2 existentes | 4 |
| 3 | `src/pages/Reports/Reports.tsx` | Refactorizar UI | 5 |
| 4 | `backend/src/controllers/reports.controller.ts` | +6 funciones | 2 |
| 5 | `backend/src/routes/reports.routes.ts` | +6 rutas | 2 |
| 6 | `backend/src/app.ts` | Registrar nuevas rutas | 2 |
| 7 | `src/routes/index.tsx` | Si se agregan nuevas páginas | 5 |

---

## 15. Próximos Pasos

1. ✅ Discutir y resolver Decisiones A-G con el equipo
2. Actualizar este plan con las decisiones tomadas
3. Cargar skills de `frontend-design` e `interface-design` antes de codificar
4. Revisar datos reales en Supabase para validar estructura de queries
5. Ejecutar Fase 1 (Fundación)
6. Ejecutar Fase 2 (Backend)
7. Ejecutar Fase 3 (PDF Templates)
8. Ejecutar Fase 4 (Excel)
9. Ejecutar Fase 5 (UI)
10. Pruebas integrales con datos reales
11. Actualizar `docs/guias-interfaces/09-reportes.md` con la nueva UI
