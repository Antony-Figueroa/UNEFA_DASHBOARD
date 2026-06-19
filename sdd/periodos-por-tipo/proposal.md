# Propuesta: Fechas independientes por tipo de pasantía

> **Contexto:** El cliente necesita que cada tipo de pasantía (única, hospitalaria, comunitaria) tenga fechas de inicio y fin independientes dentro de un mismo periodo académico.

---

## Decisión principal: Alternativa A

Usar `t_period_type_dates` — tabla hija con START_DATE/END_DATE **nullable** + fallback al periodo padre.

```sql
CREATE TABLE "t_period_type_dates" (
  "PERIOD_TYPE_DATE_ID"  SERIAL NOT NULL PRIMARY KEY,
  "PERIOD_ID"            INTEGER NOT NULL REFERENCES "t_internships_period"("PERIOD_ID"),
  "INTERNSHIP_TYPE_ID"   INTEGER NOT NULL REFERENCES "t_internship_type"("INTERNSHIP_TYPE_ID"),
  "START_DATE"           DATE,
  "END_DATE"             DATE,
  UNIQUE("PERIOD_ID", "INTERNSHIP_TYPE_ID")
);
```

**Por qué esta y no otra:**

- **A vs C:** C agrega `PERIOD_STATUS` por tipo. El cliente no pidió eso. Agregar columnas que no se necesitan es over-engineering — después quitarlas es más caro que agregarlas. Si lo necesitan, se agrega la columna después (ALTER TABLE, 1 línea).
- **A vs B (JSONB):** Sin integridad referencial. En un sistema con 24+ features, reportes cruzados y dashboards, indexar fechas dentro de JSONB es lento y verboso. Deuda técnica a corto plazo.
- **A vs D (periodos separados):** Rompe el modelo de dominio. Un periodo académico es una entidad semántica — partirlo en 3 filas hace que "periodo activo" sea ambiguo y duplica lógica en pre-inscripción, inscripción y reportes.
- **A vs E (EAV):** Antipatrón para dominios estables. Consultas requieren PIVOT, sin tipado, rendimiento pobre.

**START_DATE/END_DATE nullable** es intencional: si un tipo no tiene fechas explícitas, hereda las del periodo padre (`t_internships_period`). Esto permite migración sin datos semilla forzados y da flexibilidad al admin de definir solo los tipos que necesita.

---

## Decisiones secundarias

| Aspecto | Decisión | Por qué |
|---------|----------|---------|
| **Estado del periodo** | Compartido (en `t_internships_period`) | Cliente no pidió estado por tipo. Si después lo necesita, se agrega. |
| **Grace days** | Heredados del periodo | Misma lógica: el requerimiento es fechas, no graces por tipo. |
| **Cobertura al crear** | Warning suave | Forzar cobertura total obliga al admin a definir tipos que no usa. Validación dinámica es prematura. |
| **Superposición intra-periodo** | Permitida | Cada tipo es independiente — las fechas de HOSP no deberían validarse contra COMU. Requiere modificar `periodValidations.ts`. |
| **Edición con prácticas activas** | Permitida (con registro en audit log) | Necesidad real (extensiones de pasantía). Solo se permite mover END_DATE hacia adelante. |

---

## Lo que cambia

1. **BD:** Una tabla nueva (`t_period_type_dates`), sin modificar las existentes.
2. **Backend:**
   - CRUD de periods: aceptar fechas por tipo en create/update
   - `periodValidations.ts`: no validar superposición entre tipos
   - `pre-enrollments.controller.ts`: resolver fechas contra `(PERIOD_ID, INTERNSHIP_TYPE_ID)` con fallback al periodo padre
   - Reportes/tracking: mismas consultas, agregar LEFT JOIN a `t_period_type_dates`
3. **Frontend:**
   - `PeriodModal.tsx` (o un sub-componente): inputs de fecha por tipo activo
   - `PeriodForm.tsx`: validación Zod con `startDate`/`endDate` por tipo
   - Tabla de periodos: mostrar indicador visual si un tipo tiene fecha distinta al periodo padre
4. **Migración:** Feature flag (backend) + script de rollback para `t_period_type_dates` antes de deploy.

**Lo que NO cambia:**
- Flujo de pre-inscripción (ya guarda PERIOD_ID + INTERNSHIP_TYPE_ID)
- Flujo de inscripción
- Auth, roles, permisos
- Reportes existentes (el LEFT JOIN es aditivo)

---

## Riesgos y mitigación

| Riesgo | Mitigación |
|--------|-----------|
| Backend nuevo con BD vieja | Feature flag: si `t_period_type_dates` no existe, resolver fechas contra periodo padre |
| BD nueva con frontend viejo | La tabla se crea con `CREATE IF NOT EXISTS`, el frontend viejo simplemente no envía fechas por tipo → el backend usa nulls → fallback al periodo padre |
| Seed data incompleta | START_DATE/END_DATE nullable cubre tipos sin fechas explícitas |
| Rollback complejo | Script `rollback_add_period_type_dates.sql` con `DROP TABLE IF EXISTS t_period_type_dates CASCADE`. Feature flag off = comportamiento exactamente como hoy. |

---

## Próximo paso

Si esto está ok, pasamos a spec (`/sdd-spec`) con detalles de contratos API, validaciones Zod, y la lógica de resolución de fechas. Si no, ajustamos lo que haga falta.
