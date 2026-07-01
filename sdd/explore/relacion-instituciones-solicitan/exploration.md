# Exploration: Relación de Instituciones que Solicitan Asignación de Pasantes

## Current State

The project has an existing "Relación de Empresas" Excel report that generates a formatted workbook with the following columns:
- **REGIÓN** (from `t_system_institution.region`)
- **NÚCLEO** (from `t_system_institution.nucleus`)
- **EXTENSIÓN** (from `t_system_institution.extension`)
- **NOMBRE DE LA EMPRESA O INSTITUCIÓN** (from `t_institution.INSTITUTION_NAME`)
- **RIF** (from `t_institution.RIF`)
- **TIPO DE EMPRESA** (PÚBLICA/PRIVADA columns, from `t_institution.INSTITUTION_TYPE`)
- **CARRERA** (from `t_career.CAREER_NAME`)
- **CANTIDAD DE ESTUDIANTES SOLICITADOS** (count of students per institution)

The new report "RELACION DE INSTITUCIONES QUE SOLICITAN ASIGNACION DE PASANTES" has a different structure:
- **Nombre de la Empresa o RIF** (combined or separate)
- **Responsable** (NEW - from `t_institution_manager` table)
- **Número de Contacto** (NEW - from `t_institution.INSTITUTION_CONTACT` or `t_institution_manager.CONTACT_PHONE`)
- **Tipo de Empresa** (Pública/Privada)
- **Carreras** (same as existing)
- **Cantidad de Estudiantes** (same as existing)

Key differences:
1. **Removes**: REGIÓN, NÚCLEO, EXTENSIÓN columns
2. **Adds**: Responsable, Número de Contacto columns
3. **Data source change**: Needs to JOIN `t_institution_manager` for responsible person data

## Affected Areas

### Backend Files
- `backend/src/controllers/reports.controller.ts` — Add new controller function `getRelacionInstitucionesSolicitan`
- `backend/src/services/excel-export.service.ts` — Add new interface `RelacionInstitucionExcelRow` and generator function `generateRelacionInstitucionesWorkbook`
- `backend/src/routes/reports.routes.ts` — Add new route `/relacion-instituciones-solicitan`

### Frontend Files
- `src/features/reports/config/reportConfig.tsx` — Add new report config entry `"relacion-instituciones-solicitan"`
- `src/features/reports/services/reportsService.ts` — Add new service function `getRelacionInstitucionesSolicitan`
- `src/features/reports/hooks/useReports.ts` — Add new case in `exportExcel` switch
- `src/utils/unefaExcelReports.ts` — Add new Excel generation function `generateRelacionInstitucionesExcel`
- `src/features/reports/types/index.ts` — Add new type interface `RelacionInstitucionesSolicitanRow`

### Database Tables
- `t_professional_practices` — Main practice records
- `t_institution` — Institution data (INSTITUTION_NAME, RIF, INSTITUTION_TYPE, INSTITUTION_CONTACT)
- `t_institution_manager` — Responsible person data (NAME, SECOND_NAME, SURNAME, CONTACT_PHONE)
- `t_career` — Career data

## Approaches

### Approach 1: Duplicate and Modify Existing Report
Clone the existing `relacion-empresas` report implementation and modify it for the new report.

**Pros:**
- Fastest implementation (copy-paste-modify pattern)
- Follows existing patterns exactly
- Low risk of breaking existing functionality

**Cons:**
- Code duplication (similar but different reports)
- Maintenance overhead if report format changes

**Effort:** Low (2-3 hours)

### Approach 2: Parameterized Report Generator
Create a generic report generator that accepts column definitions and data transformations.

**Pros:**
- Reusable for future reports
- Single source of truth for report generation
- Easier maintenance

**Cons:**
- More complex initial implementation
- May require refactoring existing reports
- Higher risk of introducing bugs

**Effort:** Medium (4-6 hours)

### Approach 3: Hybrid - New Dedicated Function with Shared Utilities
Create a new dedicated function but reuse existing utilities (header styles, cell formatting, etc.).

**Pros:**
- Clean separation of concerns
- Reuses existing utilities without duplication
- Easy to understand and maintain

**Cons:**
- Moderate code duplication
- Still requires similar patterns to existing reports

**Effort:** Low-Medium (2-4 hours)

## Recommendation

**Approach 3 (Hybrid)** is recommended. The new report is structurally similar enough to the existing one that we can reuse the same patterns and utilities, but different enough that a dedicated function is cleaner than a complex parameterized system.

Key implementation steps:
1. Add new interface and generator function in `excel-export.service.ts`
2. Add new controller function in `reports.controller.ts` that queries `t_professional_practices` with JOIN to `t_institution_manager`
3. Add new route in `reports.routes.ts`
4. Add frontend config, service, hook case, and Excel generator function
5. Add new type in `types/index.ts`

## Data Source Analysis

The new report requires joining `t_professional_practices` with:
- `t_institution` (for INSTITUTION_NAME, RIF, INSTITUTION_TYPE, INSTITUTION_CONTACT)
- `t_institution_manager` (for responsible person: NAME, SECOND_NAME, SURNAME, CONTACT_PHONE)
- `t_career` (for CAREER_NAME)

The query pattern should be:
```typescript
const { data: practices } = await supabase
  .from('t_professional_practices')
  .select(`
    PROFESSIONAL_PRACTICE_ID,
    t_institution(INSTITUTION_NAME, RIF, INSTITUTION_TYPE, INSTITUTION_CONTACT),
    t_institution_manager(
      NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE
    ),
    t_career(CAREER_NAME),
    STUDENTS_ID
  `)
  .eq('STATUS', 1);
```

## Risks

1. **Data Availability**: Some institutions may not have a `t_institution_manager` record. Need to handle NULL cases gracefully.
2. **Multiple Managers**: An institution may have multiple managers. Need to determine which one to show (first active, or all comma-separated).
3. **Contact Phone Source**: `INSTITUTION_CONTACT` vs `CONTACT_PHONE` from manager — need to clarify which is preferred.
4. **Report Title**: The image shows "PARA EL PERIODO 2025" — need to confirm if this should be dynamic or static.

## Ready for Proposal

**Yes** — The exploration is complete. The orchestrator should:
1. Confirm the exact columns and their data sources with the user
2. Clarify if "Responsable" should show all managers or just the primary one
3. Confirm if "Número de Contacto" comes from institution or manager
4. Proceed to proposal phase with the hybrid approach
