# Plan de Implementación: Módulo de Reportes v2.0

**Fecha:** 2026-05-26
**Estado:** Aprobado
**Versión:** 2.0

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
| Backend endpoints | 8 endpoints | +14 endpoints para datos de nuevos reportes |
| UI de Reportes | 1 página (Reports.tsx) con selector dropdown | Sub-páginas/secciones organizadas por tipo de documento |
| Base de datos | Esquema actual | +1 tabla (`t_coordinadores`), +1 tabla (`t_report_text_templates`), +2 columnas nuevas |

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
| Tutor: condición | `t_tutors` | CONDITION | ✅ |
| Tutor: dedicación | `t_tutors` | DEDICATION | ✅ |
| Tutor: categoría | `t_tutors` | CATEGORY | ✅ |
| Tutor: teléfono | `t_tutors` | CONTACT_PHONE | ✅ |
| Tutor: email | `t_tutors` | EMAIL | ✅ |
| Tutor: horario atención | `t_tutors` | **ATTENTION_SCHEDULE** (nueva) | 🆕 Fase 0 |
| Carrera: nombre | `t_career` | CAREER_NAME | ✅ |
| Carrera: abreviatura | `t_career` | CAREER_ABBREVIATION | ✅ |
| Institución: nombre | `t_institution` | INSTITUTION_NAME | ✅ |
| Institución: RIF | `t_institution` | RIF | ✅ |
| Institución: tipo | `t_institution` | INSTITUTION_TYPE | ✅ |
| Institución: región/núcleo/extensión | `t_institution` | REGION, NUCLEUS, EXTENSION | ✅ |
| Institución: dirección | `t_institution` | INSTITUTION_ADDRESS | ✅ |
| Institución: contacto | `t_institution` | INSTITUTION_CONTACT | ✅ |
| Periodo académico | `t_internships_period` | DESCRIPTION, START_DATE, END_DATE | ✅ |
| Práctica profesional | `t_professional_practices` | START_DATE, END_DATE, GRADE, REGIME, SEMESTER, SECTION | ✅ |
| Práctica: departamento PP | `t_professional_practices` | **DEPARTMENT** (nueva) | 🆕 Fase 0 |
| Tipo de pasantía | `t_internship_type` | NAME | ✅ |
| Evaluación | `t_evaluation` | EVALUATOR_TYPE, EVALUATOR_NAME, TOTAL_SCORE, OBSERVATIONS | ✅ |
| Criterios evaluación | `t_evaluation_criteria` | DESCRIPTION, ITEM_NUMBER, EVALUATOR_TYPE | ✅ |
| Detalle puntuaciones | `t_evaluation_detail` | SCORE (1-5), ITEM_NUMBER | ✅ |
| Tracking horas | `t_tracking` | TOTAL_HOURS, HOURS_WORKED | ✅ |
| Asignación tutor-práctica | `t_professional_practices_tutor` | TUTOR_TYPE: 'ACADEMICO', 'METODOLOGICO', 'INSTITUCIONAL' | ✅ |
| Coordinadores | `t_coordinadores` | **Nueva tabla** | 🆕 Fase 0 |
| Textos de documentos | `t_report_text_templates` | **Nueva tabla** | 🆕 Fase 0 |

### 3.2 Datos que NO existen en BD (y cómo se resuelven)

| Concepto | Reportes afectados | Solución |
|----------|-------------------|----------|
| **Prefijo V/E separado** del número de CI | Todos los PDF (1-10) | Parsear del string existente "V-12345678" → `ci.split('-')` |
| **Texto completo de cartas** (cuerpo de aceptación, solicitud, etc.) | Reportes PDF 1, 2, 3, 4, 9, 10 | Tabla `t_report_text_templates` — editable desde UI de Admin |
| **Firma "MSc. Marbelys del Valle Rivero, Decana del Núcleo Portuguesa"** | Reportes PDF 2, 9, 10 | Texto estilizado + espacio para imagen de firma digital |
| **Orden administrativa N° 0005 de fecha 18/03/2022** | Reportes PDF 2, 10 | Texto configurable en `t_report_text_templates` |
| **COORDINADOR DE PRÁCTICAS PROFESIONALES** | Reporte PDF 8 | Tabla `t_coordinadores` con `TIPO = 'PP'` |
| **COORDINADOR DE CARRERA** | Reporte PDF 8 | Tabla `t_coordinadores` con `TIPO = 'CARRERA'` + `CAREER_ID` |
| **DEPARTAMENTO donde se efectuó la PP** | Reporte PDF 6 | Columna `DEPARTMENT` en `t_professional_practices` |
| **Horario de atención del tutor metodológico** | Reportes Excel 13, 16 | Columna `ATTENTION_SCHEDULE` en `t_tutors` |

---

## 4. Decisiones del Equipo (Resueltas)

### Decisión A: Coordinadores (Reporte 8)
**Resolución:** ✅ Tabla dedicada `t_coordinadores`
- Permite múltiples coordinadores, cambios sin tocar código, historial real
- `TIPO = 'PP'` para Coordinador de Prácticas Profesionales
- `TIPO = 'CARRERA'` + `CAREER_ID` para Coordinador de Carrera (1 por carrera)

### Decisión B: Departamento (Reporte 6)
**Resolución:** ✅ Columna `DEPARTMENT` en `t_professional_practices`
- Evita datos inconsistentes (ej. "Informatica" vs "Ing. en Informática")
- Se puede validar desde UI y asegurar calidad del dato

### Decisión C: Horario de atención (Excel 13, 16)
**Resolución:** ✅ Columna `ATTENTION_SCHEDULE` en `t_tutors`
- El horario es propiedad intrínseca del tutor
- Se edita desde el perfil del tutor, no al generar el Excel

### Decisión D: Configurabilidad de textos
**Resolución:** ✅ Nivel 2 — Tabla `t_report_text_templates`
- Nivel 1 muy rígido para cambios administrativos típicos
- Nivel 3 es sobreingeniería innecesaria
- Tabla liviana con `REPORT_TYPE`, `SECTION`, `CONTENT_TEMPLATE`
- UI de administración básica para editarlos sin recompilar

### Decisión E: Firmas digitales
**Resolución:** ✅ Híbrido (texto estilizado + espacio para imagen)
- Nombre con título en formato legible como base
- Contenedor para imagen de firma digitalizada (si existe)
- Si no hay imagen, queda el nombre con fuente elegante

### Decisión F: TITULO del tutor cuando es NULL
**Resolución:** ✅ "Tutor Académico" como default
- Más profesional y neutral que "Prof."
- Es el rol que ejerce → correcto legal y formalmente

---

## 5. Migraciones de Base de Datos (Fase 0)

Se ejecutan ANTES de comenzar la implementación.

```sql
-- 5.1 Tabla de Coordinadores (Decisión A)
CREATE TABLE IF NOT EXISTS "t_coordinadores" (
  "COORDINADOR_ID" SERIAL NOT NULL,
  "TIPO" VARCHAR(20) NOT NULL,              -- 'PP' o 'CARRERA'
  "CAREER_ID" INTEGER,                       -- NULL para PP, FK -> t_career para CARRERA
  "NAME" VARCHAR(255) NOT NULL,
  "SECOND_NAME" VARCHAR(255) DEFAULT NULL,
  "SURNAME" VARCHAR(255) NOT NULL,
  "SECOND_SURNAME" VARCHAR(255) DEFAULT NULL,
  "CI" VARCHAR(20) NOT NULL,
  "CARGO" VARCHAR(255),
  "CREATION_DATE" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("COORDINADOR_ID"),
  FOREIGN KEY ("CAREER_ID") REFERENCES "t_career" ("CAREER_ID")
);

-- 5.2 Columna Departamento en Prácticas (Decisión B)
ALTER TABLE "t_professional_practices"
ADD COLUMN IF NOT EXISTS "DEPARTMENT" VARCHAR(255) DEFAULT NULL;

-- 5.3 Columna Horario de Atención en Tutores (Decisión C)
ALTER TABLE "t_tutors"
ADD COLUMN IF NOT EXISTS "ATTENTION_SCHEDULE" VARCHAR(255) DEFAULT NULL;

-- 5.4 Tabla de Textos de Documentos (Decisión D)
CREATE TABLE IF NOT EXISTS "t_report_text_templates" (
  "TEMPLATE_ID" SERIAL NOT NULL,
  "REPORT_TYPE" VARCHAR(50) NOT NULL,       -- 'aceptacion_tutor', 'solicitud_institucion', etc.
  "SECTION" VARCHAR(50) NOT NULL,            -- 'encabezado', 'cuerpo', 'firma', etc.
  "CONTENT_TEMPLATE" TEXT NOT NULL,          -- Texto con {{placeholders}}
  "UPDATED_BY" INTEGER,
  "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT DEFAULT 1,
  PRIMARY KEY ("TEMPLATE_ID"),
  UNIQUE ("REPORT_TYPE", "SECTION")
);

-- 5.5 Valores iniciales para textos de documentos
INSERT INTO "t_report_text_templates" ("REPORT_TYPE", "SECTION", "CONTENT_TEMPLATE") VALUES
('aceptacion_tutor', 'encabezado', 'Por medio de la presente, yo, {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, en mi carácter de Tutor(a) Académico(a), ACEPTO formalmente tutoriar al(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, durante el desarrollo de sus Prácticas Profesionales.'),
('aceptacion_tutor', 'firma', '___________________________________{{tutorTitulo}} {{tutorNombreCompleto}}Tutor(a) Académico(a)C.I.: {{tutorCi}}Teléfono: {{tutorTelefono}}'),
('solicitud_institucion', 'destinatario', 'MSc. Marbelys del Valle Rivero'),
('solicitud_institucion', 'cargo', 'Decana del Núcleo Portuguesa'),
('solicitud_institucion', 'orden', 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022'),
('solicitud_institucion', 'cuerpo', 'Yo, {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, ante usted ocurro para solicitar formalmente la asignación de la institución {{institucionNombre}} para la realización de mis Prácticas Profesionales correspondientes al lapso académico {{lapsoInicio}} - {{lapsoFin}}.'),
('constancia_tutor_academico', 'cuerpo', 'Por medio de la presente se hace constar que el(la) ciudadano(a) {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, se desempeña como Tutor(a) Académico(a) de Prácticas Profesionales, en condición {{tutorCondicion}}, con dedicación {{tutorDedicacion}}, cumpliendo un total de {{totalHours}} horas académicas, durante el período {{periodo}}.'),
('constancia_tutor_academico', 'firma', '___________________________________MSc. Marbelys del Valle RiveroDecana del Núcleo PortuguesaSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022');
```

---

## 6. Sistema de Textos Configurables

### Flujo de resolución de textos

```
1. Sistema consulta t_report_text_templates WHERE REPORT_TYPE = X AND SECTION = Y
2. Si existe registro en BD → usa CONTENT_TEMPLATE de la BD
3. Si NO existe → usa el texto default definido en documentTexts.ts (código)
4. Reemplaza {{placeholders}} con datos reales del reporte
5. Renderiza en PDF
```

### Arquitectura en capas

```typescript
// Capa 1: Textos default en código
// src/features/reports/utils/documentTexts.ts
export const FALLBACK_TEXTOS: Record<string, Record<string, string>> = {
  aceptacion_tutor: {
    encabezado: "Por medio de la presente, yo, {{tutorTitulo}} {{tutorNombreCompleto}}...",
    firma: "___________________________________\n{{tutorTitulo}} {{tutorNombreCompleto}}..."
  },
  solicitud_institucion: {
    destinatario: "MSc. Marbelys del Valle Rivero",
    cargo: "Decana del Núcleo Portuguesa",
    // ...
  },
  // ...
};

// Capa 2: Servicio que consulta BD con fallback a código
// src/features/reports/services/reportTextsService.ts
export async function getDocumentText(
  reportType: string,
  section: string
): Promise<string> {
  try {
    const response = await apiClient.get(
      `/report-texts/${reportType}/${section}`
    );
    return response.data?.contentTemplate;
  } catch {
    return FALLBACK_TEXTOS[reportType]?.[section] ?? '';
  }
}

// Función de renderizado con placeholders
function renderDocumentText(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `[${key}]`);
}
```

### Endpoints de administración de textos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/report-texts` | Obtener todos los textos configurados |
| GET | `/api/report-texts/:reportType/:section` | Obtener texto específico |
| PUT | `/api/report-texts/:reportType/:section` | Actualizar texto específico |
| POST | `/api/report-texts` | Crear nuevo texto |

---

## 7. Reportes a Implementar

### 7.1 Reportes PDF (documentos formales)

Cada uno es un documento individual con membrete institucional y firmas.

| # | Reporte | Tipo | Datos | Origen BD | Texto Configurable |
|---|---------|------|-------|-----------|-------------------|
| 1 | **ACEPTACIÓN DEL TUTOR ACADÉMICO** | Individual (1 práctica) | Tutor (título, nombre, CI, teléfono), Estudiante (nombre, CI, carrera) | `t_tutors` + `t_students` + `t_career` via `t_professional_practices` | `aceptacion_tutor` |
| 2 | **SOLICITUD DE INSTITUCIÓN** | Individual (1 práctica) | Institución, Estudiante (nombre, CI, carrera, lapso), Firma Decana | `t_institution` + `t_students` + `t_internships_period` | `solicitud_institucion` |
| 3 | **SOLICITUD DE CARTA DE POSTULACIÓN** | Individual (1 práctica) | Estudiante (nombre, CI, contacto, régimen, carrera, semestre, trabajo), Institución, Tutor Institucional | `t_students` + `t_professional_practices` + `t_institution` + `t_tutors` (INSTITUCIONAL) | `carta_postulacion` |
| 4 | **ACTA DE VALIDACION** | Individual (1 práctica) | Estudiante (carrera, nombre, CI) | `t_students` + `t_career` | `acta_validacion` |
| 5 | **EVALUACION FINAL DE LA PP** | Individual (1 práctica) | Estudiante (nombre, CI, carrera), Institución, Fechas PP, Nota (GRADE) | `t_professional_practices` + `t_students` + `t_career` + `t_institution` | `evaluacion_final` |
| 6 | **EVALUACION TUTOR INSTITUCIONAL** | Individual (1 práctica) | Estudiante, Institución, **Departamento** ✅, Tutor Inst. (nombre, CI), Fechas PP, Criterios + puntuaciones | `t_evaluation` + `t_evaluation_detail` + `t_evaluation_criteria` + `t_students` + `t_tutors` + `t_professional_practices.DEPARTMENT` | `evaluacion_tutor_institucional` |
| 7 | **EVALUACION TUTOR ACADEMICO** | Individual (1 práctica) | Estudiante (nombre, CI, carrera), Tutor Acad. (nombre, CI), Fechas PP, Criterios + puntuaciones | `t_evaluation` + `t_evaluation_detail` + `t_evaluation_criteria` + `t_students` + `t_tutors` | `evaluacion_tutor_academico` |
| 8 | **EVALUACION COMITÉ EVALUADOR** | Individual (1 práctica) | Estudiante, Periodo, **Coordinador PP** ✅, **Coordinador Carrera** ✅, Tutor Acad. (nombre, CI) | `t_students` + `t_career` + `t_tutors` + `t_coordinadores` | `evaluacion_comite` |
| 9 | **CONSTANCIA TUTOR ACADÉMICO** | Individual (1 tutor + período) | Tutor (título, nombre, CI, condición, dedicación, horas, periodo, lapso), Firma Decana | `t_tutors` + `t_tracking` (TOTAL_HOURS) + `t_internships_period` | `constancia_tutor_academico` |
| 10 | **CONSTANCIA TUTOR INSTITUCIONAL** | Individual (1 tutor + período) | Institución, Tutor (título, nombre, CI, horas, periodo, lapso), Firma Decana | `t_institution` + `t_tutors` + `t_tracking` + `t_internships_period` | `constancia_tutor_institucional` |

### 7.2 Reportes Excel (tablas con formato institucional)

| # | Reporte | Columnas | Endpoint |
|---|---------|----------|----------|
| 11 | **RESUMEN PASANTIAS (PERIODO)** | Región, Núcleo, Extensión, Carrera, Cant. Tutores Acad., Cant. Estudiantes, Empresa, Tipo, Cant. Tutores Inst., Observación | `GET /api/reports/resumen-pasantias` (existente) |
| 12 | **RELACION DE EMPRESAS QUE DEMANDAN PASANTES** | Región, Núcleo, Extensión, Empresa, RIF, Tipo, Carrera, Cant. Estudiantes Solicitados | `GET /api/reports/relacion-empresas-demandan` (nuevo) |
| 13 | **DISTRIBUCION DE TUTORES** | N°, Carrera, Estudiante, Tutor Académico (título, nombre, contacto, email), Tutor Metodológico (título, nombre, contacto, **horario** ✅), Evaluador (título, nombre, contacto) | `GET /api/reports/distribucion-tutores` (nuevo) |
| 14 | **RELACIÓN GENERAL DE TUTORES ACADÉMICOS** | N°, Región, Núcleo, Extensión, Carrera, Nombre, Apellido, CI, Condición, Dedicación, Categoría, Teléfono, Email, Cant. Estudiantes | `GET /api/reports/tutores-academicos` (existente, mejorar) |
| 15 | **RELACIÓN INDIVIDUAL DE DOCENTES** | N°, Región, Núcleo, Extensión, Carrera, Estudiante (nombre, apellido, CI, sexo, tipo, teléfono), Institución (nombre, tipo), Tutor Inst. (datos completos), Dirección, Observaciones | `GET /api/reports/relacion-individual-docente/:tutorId` (nuevo) |
| 16 | **DISTRIBUCIÓN DE TUTORES v2** | Similar al #13 con columnas adicionales de horario del tutor metodológico | `GET /api/reports/distribucion-tutores-v2` (nuevo) |

---

## 8. Arquitectura de Implementación

### 8.1 Frontend: Nuevos Archivos

```
src/
├── features/
│   └── reports/
│       ├── types/
│       │   └── index.ts                    # Interfaces para todos los reportes
│       ├── services/
│       │   ├── reportsService.ts           # Extender con 14+ métodos
│       │   └── reportTextsService.ts       # Servicio para textos configurables (BD + fallback)
│       ├── hooks/
│       │   └── useReports.ts               # Hook unificado de generación
│       ├── components/
│       │   ├── CulminatedStudentsFilters.tsx # Existente
│       │   ├── CulminatedStudentsTable.tsx   # Existente
│       │   ├── ReportCard.tsx               # Tarjeta de reporte individual
│       │   ├── ReportList.tsx              # Grid de reportes por categoría
│       │   └── DocumentReportModal.tsx     # Modal para documentos PDF individuales
│       └── utils/
│           ├── documentTexts.ts            # Textos default con placeholders (fallback)
│           ├── documentRenderer.ts         # Función de renderizado de placeholders
│           ├── unefaExcelReports.ts        # Extender con 4 generadores nuevos
│           └── reportFormatters.ts         # Formateadores comunes (CI, fecha, nombre, etc.)
│
├── components/
│   └── ui/
│       └── pdf/
│           └── templates/
│               └── institutional/          # Documentos oficiales (10 templates)
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

### 8.2 Backend: Nuevos Archivos/Extensiones

```
backend/src/
├── controllers/
│   ├── reports.controller.ts              # Extender con 6+ funciones (Excel)
│   ├── documents.controller.ts            # Lógica de documentos oficiales PDF
│   └── report-texts.controller.ts        # CRUD de textos configurables
│
├── routes/
│   ├── reports.routes.ts                  # Extender con rutas nuevas
│   ├── documents.routes.ts               # Rutas para documentos oficiales
│   └── report-texts.routes.ts            # Rutas para textos configurables
│
├── services/
│   └── report-texts.service.ts           # Lógica de negocio para textos
│
└── middleware/
    └── reportValidation.ts                # Validación de parámetros de reportes
```

### 8.3 Endpoints Backend

#### Existentes (mejorar):
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/reports/tutores-academicos` | Relación General Tutores (Anexo 4) |
| GET | `/api/reports/resumen-pasantias` | Resumen Pasantías (Excel 11) |
| GET | `/api/reports/culminated-students` | Estudiantes Culminados |

#### Nuevos — Documentos PDF:
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/documents/aceptacion-tutor/:practiceId` | Reporte PDF 1 |
| GET | `/api/documents/solicitud-institucion/:practiceId` | Reporte PDF 2 |
| GET | `/api/documents/carta-postulacion/:practiceId` | Reporte PDF 3 |
| GET | `/api/documents/acta-validacion/:practiceId` | Reporte PDF 4 |
| GET | `/api/documents/evaluacion-final/:practiceId` | Reporte PDF 5 |
| GET | `/api/documents/evaluacion-tutor-institucional/:practiceId` | Reporte PDF 6 |
| GET | `/api/documents/evaluacion-tutor-academico/:practiceId` | Reporte PDF 7 |
| GET | `/api/documents/evaluacion-comite/:practiceId` | Reporte PDF 8 |
| GET | `/api/documents/constancia-tutor-academico/:tutorId` | Reporte PDF 9 |
| GET | `/api/documents/constancia-tutor-institucional/:tutorId` | Reporte PDF 10 |

#### Nuevos — Reportes Excel:
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/reports/relacion-empresas-demandan` | Reporte Excel 12 |
| GET | `/api/reports/distribucion-tutores` | Reporte Excel 13 |
| GET | `/api/reports/relacion-individual-docente/:tutorId` | Reporte Excel 15 |
| GET | `/api/reports/distribucion-tutores-v2` | Reporte Excel 16 |

#### Nuevos — Textos Configurables:
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/report-texts` | Listar todos los textos |
| GET | `/api/report-texts/:reportType/:section` | Obtener texto específico |
| PUT | `/api/report-texts/:reportType/:section` | Actualizar texto |
| POST | `/api/report-texts` | Crear texto |

### 8.4 Consultas SQL Principales

#### Datos base de práctica (reportes 1-5)
```sql
SELECT
  pp.PROFESSIONAL_PRACTICE_ID, pp.START_DATE, pp.END_DATE,
  pp.GRADE, pp.REGIME, pp.SEMESTER, pp.SECTION, pp.DEPARTMENT,
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
  t.CONTACT_PHONE, t.EMAIL, t.ATTENTION_SCHEDULE
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

#### Coordinadores para comité evaluador (reporte 8)
```sql
SELECT
  c.COORDINADOR_ID, c.TIPO, c.NAME, c.SECOND_NAME, c.SURNAME,
  c.SECOND_SURNAME, c.CI, c.CARGO,
  cr.CAREER_NAME
FROM t_coordinadores c
LEFT JOIN t_career cr ON c.CAREER_ID = cr.CAREER_ID
WHERE c.STATUS = 1
  AND (c.TIPO = 'PP'
    OR (c.TIPO = 'CARRERA' AND c.CAREER_ID = :careerId))
```

---

## 9. Plan de Implementación por Fases

### Fase 0: Migraciones de BD (Día 0.5)

| Tarea | Descripción |
|-------|-------------|
| 0.1 | Ejecutar SQL de creación de `t_coordinadores` |
| 0.2 | Ejecutar SQL de `ALTER TABLE` para `DEPARTMENT` y `ATTENTION_SCHEDULE` |
| 0.3 | Ejecutar SQL de creación de `t_report_text_templates` + inserts iniciales |
| 0.4 | Verificar en Supabase que las migraciones se aplicaron correctamente |

### Fase 1: Fundación (Días 1-2) — 5 archivos

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 1.1 | `src/features/reports/types/index.ts` | Interfaces para todos los reportes |
| 1.2 | `src/features/reports/services/reportsService.ts` | Extender con métodos para endpoints |
| 1.3 | `src/features/reports/services/reportTextsService.ts` | Servicio de textos (BD + fallback) |
| 1.4 | `src/features/reports/utils/documentTexts.ts` | Textos default con placeholders (fallback) |
| 1.5 | `src/features/reports/utils/documentRenderer.ts` | Función de renderizado de placeholders |
| 1.6 | `src/features/reports/utils/reportFormatters.ts` | Formateadores: `formatCI()`, `formatNombreCompleto()`, `formatFecha()`, `getTutorTitle()` |

### Fase 2: Backend (Días 3-5) — ~6 archivos

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 2.1 | `backend/src/controllers/documents.controller.ts` | 10 endpoints para datos de documentos PDF |
| 2.2 | `backend/src/controllers/reports.controller.ts` | Extender con 4 funciones para Excel |
| 2.3 | `backend/src/controllers/report-texts.controller.ts` | CRUD de textos configurables |
| 2.4 | `backend/src/services/report-texts.service.ts` | Lógica de negocio para textos |
| 2.5 | `backend/src/routes/documents.routes.ts` | Rutas de documentos PDF |
| 2.6 | `backend/src/routes/report-texts.routes.ts` | Rutas de textos configurables |
| 2.7 | Extender `reports.routes.ts` y `backend/src/app.ts` | Registrar nuevas rutas |

### Fase 3: Plantillas PDF (Días 6-10) — 11 archivos

| Tarea | Plantilla | Datos que recibe |
|-------|-----------|------------------|
| 3.1 | `AceptacionTutorPDF.tsx` | `{ tutor, estudiante, carrera }` |
| 3.2 | `SolicitudInstitucionPDF.tsx` | `{ institucion, estudiante, carrera, periodo }` |
| 3.3 | `CartaPostulacionPDF.tsx` | `{ estudiante, institucion, tutorInstitucional }` |
| 3.4 | `ActaValidacionPDF.tsx` | `{ estudiante, carrera }` |
| 3.5 | `EvaluacionFinalPDF.tsx` | `{ estudiante, institucion, fechas, grade }` |
| 3.6 | `EvaluacionTutorInstitucionalPDF.tsx` | `{ estudiante, institucion, department, tutorInst, criterios[], totalScore }` |
| 3.7 | `EvaluacionTutorAcademicoPDF.tsx` | `{ estudiante, tutorAcad, criterios[], totalScore, fechas }` |
| 3.8 | `EvaluacionComitePDF.tsx` | `{ estudiante, periodo, tutorAcad, coordinadorPP, coordinadorCarrera }` |
| 3.9 | `ConstanciaTutorAcademicoPDF.tsx` | `{ tutor, totalHours, periodo }` + Firma Decana |
| 3.10 | `ConstanciaTutorInstitucionalPDF.tsx` | `{ tutor, institucion, totalHours, periodo }` + Firma Decana |
| 3.11 | `institutional/index.ts` | Barrel exports |

**Patrón de cada template:**
```tsx
import PDFLayout from "../../PDFLayout";
import { pdfStyles } from "../../PDFStyles";
import { renderDocumentText } from "../../../../features/reports/utils/documentRenderer";

export const MiReportePDF: React.FC<Props> = ({ data, textos }) => {
  const cuerpo = renderDocumentText(
    textos.cuerpo ?? FALLBACK_TEXTOS.mi_reporte.cuerpo,
    { nombre: data.estudiante.nombre, ci: formatCI(data.estudiante.ci), ... }
  );

  return (
    <PDFLayout title="TÍTULO OFICIAL">
      <View style={styles.body}>
        <Text style={styles.paragraph}>{cuerpo}</Text>
      </View>
    </PDFLayout>
  );
};
```

### Fase 4: Generadores Excel (Días 11-12) — 1 archivo + mejoras

| Tarea | Generador | Tecnología |
|-------|-----------|------------|
| 4.1 | `generateResumenPasantiasExcel` (mejorar) | ExcelJS |
| 4.2 | `generateRelacionEmpresasExcel` | ExcelJS |
| 4.3 | `generateDistribucionTutoresExcel` | ExcelJS |
| 4.4 | `generateRelacionGeneralTutoresExcel` (migrar XLSX → ExcelJS) | ExcelJS |
| 4.5 | `generateRelacionIndividualDocenteExcel` | ExcelJS |
| 4.6 | `generateDistribucionTutoresV2Excel` | ExcelJS |

### Fase 5: UI e Integración (Días 13-15) — 5 archivos

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 5.1 | `src/features/reports/hooks/useReports.ts` | Hook unificado |
| 5.2 | `src/features/reports/components/ReportCard.tsx` | Tarjeta visual por reporte |
| 5.3 | `src/features/reports/components/ReportList.tsx` | Grid de tarjetas agrupadas en secciones |
| 5.4 | `src/features/reports/components/DocumentReportModal.tsx` | Modal con selector de práctica/estudiante |
| 5.5 | `src/pages/Reports/Reports.tsx` | Refactorizar: reemplazar dropdown por ReportList |

---

## 10. Manejo de Casos Especiales

### 10.1 Prefijo V/E de cédula

```typescript
export function parseCI(ci: string): { prefix: string; number: string } {
  const parts = ci.split('-');
  return {
    prefix: parts[0] || 'V',
    number: parts[1] || ci
  };
}

export function formatCI(ci: string): string {
  const { prefix, number } = parseCI(ci);
  return `${prefix}/E - ${number}`;
}
```

### 10.2 TITULO del tutor nullable

```typescript
export function getTutorTitle(titulo: string | null): string {
  if (!titulo || titulo.trim() === '') return 'Tutor Académico';
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

### 10.3 Datos faltantes (protegidos contra null)

| Campo | Default |
|-------|---------|
| `TITULO` | `"Tutor Académico"` |
| `SECOND_NAME` / `SECOND_SURNAME` | `""` |
| `OBSERVATIONS` | `""` |
| `TOTAL_HOURS` | `0` |
| `GRADE` | `0` |
| `EVALUATOR_CI` | `""` |
| `DEPARTMENT` | `"No especificado"` |
| `ATTENTION_SCHEDULE` | `"No especificado"` |

### 10.4 Documentos sin evaluaciones registradas

Si `t_evaluation` no tiene registros para la práctica, mostrar:
`"No se encontraron evaluaciones registradas para esta práctica profesional."`

### 10.5 Firmas digitales

```tsx
// En el template PDF, para la firma de la Decana:
<View style={styles.firmaContainer}>
  {firmaImagen ? (
    <Image src={firmaImagen} style={styles.firmaImagen} />
  ) : (
    <Text style={styles.firmaTexto}>
      ___________________________________
      {'\n'}MSc. Marbelys del Valle Rivero
      {'\n'}Decana del Núcleo Portuguesa
      {'\n'}Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022
    </Text>
  )}
</View>
```

---

## 11. Dependencias y Riesgos

| Riesgo | Impacto | Prob. | Mitigación |
|--------|---------|-------|------------|
| TITULO del tutor NULL en muchos registros | Medio | Alta | Default "Tutor Académico" |
| `t_tracking` sin TOTAL_HOURS para algunas prácticas | Medio | Media | Mostrar 0 con nota "Sin registrar" |
| Coordinadores sin datos en `t_coordinadores` | Alto | Media | Crear seed data inicial + UI de administración |
| `DEPARTMENT` vacío en prácticas existentes | Bajo | Alta | Mostrar "No especificado" |
| Estudiantes sin institución asignada | Bajo | Media | LEFT JOIN y mostrar "No asignada" |
| Periodos sin prácticas registradas | Bajo | Baja | Respuesta vacía "No hay datos" |
| Imagen de firma digital no disponible | Bajo | Media | Fallback a texto estilizado |
| Textos en BD desactualizados vs código | Medio | Baja | El fallback a código mantiene consistencia |

---

## 12. Criterios de Aceptación

- [ ] Migraciones Fase 0 ejecutadas en Supabase sin errores
- [ ] Cada reporte PDF se genera con el membrete institucional correcto (PDFLayout)
- [ ] Los placeholders en textos se reemplazan correctamente con datos reales
- [ ] Los datos de estudiantes, tutores, coordinadores e instituciones se cargan desde Supabase
- [ ] El prefijo V/E se muestra en formato "V/E - CEDULA" en todos los documentos
- [ ] TITULO del tutor usa default "Tutor Académico" cuando es NULL
- [ ] Las evaluaciones muestran criterios y puntuaciones correctas
- [ ] Las constancias incluyen firma de la Decana (texto o imagen)
- [ ] Los textos de documentos se pueden editar vía API sin recompilar
- [ ] Los 6 reportes Excel se descargan como `.xlsx` con formato institucional
- [ ] La UI de Reports.tsx muestra todos los reportes organizados en secciones
- [ ] Cada endpoint tiene manejo de errores con mensajes descriptivos
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores

---

## 13. Esfuerzo Estimado

| Fase | Días | Archivos nuevos | Archivos modificados |
|------|------|-----------------|---------------------|
| Fase 0: Migraciones BD | 0.5 | — | — (SQL) |
| Fase 1: Fundación | 2 | 5 | 1 |
| Fase 2: Backend | 3 | 6 | 2 |
| Fase 3: PDF Templates | 5 | 11 | 0 |
| Fase 4: Excel Generators | 2 | 0 | 2 |
| Fase 5: UI Integration | 3 | 5 | 1 |
| **Total** | **15.5** | **~27** | **~6** |

---

## 14. Archivos a Modificar/Crear

### Crear (~27 archivos)

| # | Archivo | Fase |
|---|---------|------|
| 1 | `backend/src/migrations/006_reports_module.sql` | 0 |
| 2 | `src/features/reports/types/index.ts` | 1 |
| 3 | `src/features/reports/services/reportTextsService.ts` | 1 |
| 4 | `src/features/reports/utils/documentTexts.ts` | 1 |
| 5 | `src/features/reports/utils/documentRenderer.ts` | 1 |
| 6 | `src/features/reports/utils/reportFormatters.ts` | 1 |
| 7 | `src/features/reports/hooks/useReports.ts` | 5 |
| 8 | `src/features/reports/components/ReportCard.tsx` | 5 |
| 9 | `src/features/reports/components/ReportList.tsx` | 5 |
| 10 | `src/features/reports/components/DocumentReportModal.tsx` | 5 |
| 11 | `src/components/ui/pdf/templates/institutional/AceptacionTutorPDF.tsx` | 3 |
| 12 | `src/components/ui/pdf/templates/institutional/SolicitudInstitucionPDF.tsx` | 3 |
| 13 | `src/components/ui/pdf/templates/institutional/CartaPostulacionPDF.tsx` | 3 |
| 14 | `src/components/ui/pdf/templates/institutional/ActaValidacionPDF.tsx` | 3 |
| 15 | `src/components/ui/pdf/templates/institutional/EvaluacionFinalPDF.tsx` | 3 |
| 16 | `src/components/ui/pdf/templates/institutional/EvaluacionTutorInstitucionalPDF.tsx` | 3 |
| 17 | `src/components/ui/pdf/templates/institutional/EvaluacionTutorAcademicoPDF.tsx` | 3 |
| 18 | `src/components/ui/pdf/templates/institutional/EvaluacionComitePDF.tsx` | 3 |
| 19 | `src/components/ui/pdf/templates/institutional/ConstanciaTutorAcademicoPDF.tsx` | 3 |
| 20 | `src/components/ui/pdf/templates/institutional/ConstanciaTutorInstitucionalPDF.tsx` | 3 |
| 21 | `src/components/ui/pdf/templates/institutional/index.ts` | 3 |
| 22 | `backend/src/controllers/documents.controller.ts` | 2 |
| 23 | `backend/src/controllers/report-texts.controller.ts` | 2 |
| 24 | `backend/src/services/report-texts.service.ts` | 2 |
| 25 | `backend/src/routes/documents.routes.ts` | 2 |
| 26 | `backend/src/routes/report-texts.routes.ts` | 2 |
| 27 | `backend/src/middleware/reportValidation.ts` | 2 |

### Modificar (~6 archivos)

| # | Archivo | Cambio | Fase |
|---|---------|--------|------|
| 1 | `src/features/reports/services/reportsService.ts` | +14 métodos nuevos | 1 |
| 2 | `src/utils/unefaExcelReports.ts` | +4 generadores + mejora 2 existentes | 4 |
| 3 | `src/pages/Reports/Reports.tsx` | Refactorizar UI con ReportList | 5 |
| 4 | `backend/src/controllers/reports.controller.ts` | +4 funciones (Excel) | 2 |
| 5 | `backend/src/routes/reports.routes.ts` | +4 rutas (Excel) | 2 |
| 6 | `backend/src/app.ts` | Registrar nuevas rutas | 2 |

---

## 15. Próximos Pasos

1. ✅ Decisiones A-F resueltas por el equipo
2. ⬜ **Ejecutar Fase 0**: Aplicar migraciones en Supabase
3. ⬜ Revisar datos reales en Supabase para validar estructura de queries
4. ⬜ Ejecutar Fase 1 (Fundación)
5. ⬜ Ejecutar Fase 2 (Backend)
6. ⬜ Ejecutar Fase 3 (PDF Templates)
7. ⬜ Ejecutar Fase 4 (Excel)
8. ⬜ Ejecutar Fase 5 (UI)
9. ⬜ Pruebas integrales con datos reales
10. ⬜ Actualizar `docs/guias-interfaces/09-reportes.md` con la nueva UI
