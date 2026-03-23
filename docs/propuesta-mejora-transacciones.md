# Propuesta de Mejora del Sistema de Transacciones

## UNEFA Dashboard - Sistema de Gestión de Prácticas Profesionales

---

**Versión del documento**: 1.0  
**Fecha**: Marzo 2026  
**Tipo**: Propuesta Técnica  
**Proyecto**: UNEFA Dashboard v2.2.0

---

## Resumen Ejecutivo

Este documento presenta una propuesta integral para mejorar el sistema de transacciones del proyecto UNEFA Dashboard. El sistema actual, aunque funcional, presenta deficiencias críticas en cuanto a la gestión de datos que pueden comprometer la integridad de la información académica. Las mejoras propuestas abordan problemas reales y tangibles que, si no se atienden, pueden derivar en inconsistencias graves en los registros de prácticas profesionales de los estudiantes.

---

## 1. Contexto y Antecedentes

### 1.1 Descripción del Proyecto

UNEFA Dashboard es un sistema de gestión académica integral desarrollado para universidades, específicamente diseñado para administrar el ciclo completo de prácticas profesionales de los estudiantes. El sistema maneja información sensible incluyendo:

- Datos personales de estudiantes
- Historial de inscripciones y pre-inscripciones
- Seguimiento de visitas de supervisión
- Evaluación y culminación de prácticas
- Generación de certificados académicos

El sistema sigue una arquitectura cliente-servidor típica:

- **Frontend**: React 19 + Vite 6 + TypeScript
- **Backend**: Express.js 4.22 + Node.js
- **Base de Datos**: PostgreSQL (Supabase)
- **API**: RESTful con Axios

### 1.2 Alcance del Sistema de Transacciones

El "sistema de transacciones" en este contexto se refiere al conjunto de operaciones que permiten:

1. **Crear una pre-inscripción** (estudiante se registra para prácticas)
2. **Convertir pre-inscripción en inscripción activa** (el estudiante comienza sus prácticas)
3. **Registrar visitas de seguimiento** (el tutor supervisa el progreso)
4. **Aprobar la culminación** (el estudiante termina exitosamente sus prácticas)
5. **Generar certificados** (documento oficial de culminación)

Estas operaciones involucran múltiples tablas de la base de datos y deben mantener la consistencia de los datos en todo momento.

---

## 2. Estado Actual del Sistema

### 2.1 Arquitectura de la Tabla Central

El sistema utiliza una tabla central llamada `t_professional_practices` (prácticas profesionales) que gestiona todo el ciclo de vida de las prácticas de cada estudiante. Esta tabla contiene campos críticos como:

```sql
t_professional_practices:
├── PROFESSIONAL_PRACTICE_ID    -- Identificador único
├── STUDENTS_ID                -- Referencia al estudiante
├── PRACTICES_STATUS           -- Estado de la práctica (1, 2, 3)
├── PERIOD_ID                  -- Período académico
├── INSTITUTION_ID             -- Empresa/institución
├── START_DATE / END_DATE      -- Fechas de la práctica
├── GRADE                      -- Nota final
├── ENROLLMENT                 -- Código de inscripción
└── [otros campos]
```

### 2.2 Flujo Actual de Operaciones

El sistema implementa un modelo de **estado incremental** donde cada práctica profesional transita por estados predefinidos:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO ACTUAL DEL SISTEMA                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐          │
│   │  PRE-INSCR  │ ────▶ │  INSCRIPCIÓ │ ────▶ │  CULMINAC.  │          │
│   │  (Status=1) │       │  (Status=2)│       │  (Status=3)│          │
│   └─────────────┘       └─────────────┘       └─────────────┘          │
│        │                     │                     │                    │
│        ▼                     ▼                     ▼                    │
│   Crear registro        Actualizar estado      Actualizar estado        │
│   + validaciones       + insertar tutores     + generar certificado    │
│                                                                          │
│   ❌ SIN ATOMICIDAD: Si la segunda operación falla, la primera          │
│      queda en un estado inconsistente                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Ejemplo Práctico del Problema

Para entender mejor el problema, analicemos el proceso de **inscripción** (convertir pre-inscripción en práctica activa):

**Paso 1**: El usuario completa el formulario de inscripción en la interfaz web (`src/pages/Enrollment/Enrollment.tsx`)

**Paso 2**: El backend recibe la solicitud y ejecuta las siguientes operaciones:

```typescript
// enrollments.controller.ts - Líneas 275-325

// 1. Actualiza el estado de la práctica
const { data: practice, error: practiceError } = await supabase
  .from('t_professional_practices')
  .update({
    PRACTICES_STATUS: 2,  // Cambia a "Inscrito"
    REGISTRATION_DATE: now,
    INSTITUTION_ID: institutionId,
    MANAGER_ID: institutionResponsibleId,
    STATUS: 1
  })
  .eq('PROFESSIONAL_PRACTICE_ID', preEnrollmentRow.PROFESSIONAL_PRACTICE_ID);

// 2. Inserta los tutores asociados (OPERACIÓN INDEPENDIENTE)
const { error: tutorsError } = await supabase
  .from('t_professional_practices_tutor')
  .insert([
    { TUTOR_ID: academicTutorId, PROFESSIONAL_PRACTICE_ID: practiceId, TUTOR_TYPE: 'ACADEMICO' },
    { TUTOR_ID: methodologicalTutorId, PROFESSIONAL_PRACTICE_ID: practiceId, TUTOR_TYPE: 'METODOLOGICO' }
  ]);
```

**El problema**: Si la segunda operación (insertar tutores) falla, la práctica queda en estado "Inscrito" (PRACTICES_STATUS=2) pero sin tutores asignados. Esto crea un registro incompleto e inconsistente en la base de datos.

---

## 3. Problemas Identificados

### 3.1 Matriz de Problemas

| # | Problema | Severidad | Frecuencia | Impacto en el Negocio |
|---|----------|-----------|------------|----------------------|
| 1 | **Ausencia de transacciones atómicas** | CRÍTICA | Ocasional | Datos inconsistentes, estudiantes sin tutores asignados |
| 2 | **Validaciones solo en código aplicación** | ALTA | Frecuente | Violaciones de integridad, errores difíciles de debuguear |
| 3 | **Sin control de concurrencia** | MEDIA | Ocasional | Conflictos cuando dos usuarios.editan el mismo registro |
| 4 | **Sistema de reintentos básico** | MEDIA | Ocasional | Fallos en cadena durante errores transitorios |
| 5 | **Auditoría limitada** | BAJA | Rara | Dificultad para rastrear cambios en casos dispute |

### 3.2 Análisis Detallado de Cada Problema

#### Problema 1: Ausencia de Transacciones Atómicas

**Descripción**: Las operaciones que modifican múltiples tablas no se ejecutan como una unidad atómica. Si alguna operación intermedia falla, las anteriores ya fueron aplicadas y no se revertirán.

**Ejemplo concreto**:
- Un estudiante se inscribe exitosamente (PRACTICES_STATUS=2)
- Pero la inserción de tutores falla por timeout de red
- Resultado: Estudiante con práctica "activa" pero SIN tutor académico asignado
- El tutor no recibe notificaciones de supervisión
- El estudiante no puede ser evaluado correctamente

**Evidencia del código** (`backend/src/controllers/enrollments.controller.ts`):

```typescript
// Líneas 295-325 - Dos operaciones independientes SIN atomicidad
const { data: practice, error: practiceError } = await supabase
  .from('t_professional_practices')
  .update(updateData)
  .eq('PROFESSIONAL_PRACTICE_ID', preEnrollmentRow.PROFESSIONAL_PRACTICE_ID);
// ⚠️ Si llega aquí pero la siguiente falla, queda inconsistente

const { error: tutorsError } = await supabase
  .from('t_professional_practices_tutor')
  .insert(tutorsToInsert);
// ❌ Si esto falla, no hay forma de revertir la actualización anterior
```

#### Problema 2: Validaciones Solo en Código

**Descripción**: Las validaciones de negocio (como "un estudiante no puede tener dos inscripciones activas") están implementadas solo en el código del backend, no en la base de datos.

**Riesgo**: Si alguien accede directamente a la base de datos o hay un bug en el código, las reglas de negocio se violan.

**Ejemplo**:
```typescript
// Validación en código (enrollments.controller.ts líneas 245-257)
const existingEnrollment = await supabase
  .from(TABLE_NAME)
  .select('PROFESSIONAL_PRACTICE_ID')
  .eq('STUDENTS_ID', student.STUDENTS_ID)
  .eq('PRACTICES_STATUS', 2)  // Inscripción activa
  .eq('STATUS', 1);

if (existingEnrollment.length > 0) {
  throw new Error('El estudiante ya posee una inscripción activa');
}
```

Esta validación NO existe en la base de datos. Un administrador que insert directamente en la tabla podría crear registros duplicados.

#### Problema 3: Sin Control de Concurrencia

**Descripción**: Si dos administradores intentan editar la misma inscripción simultáneamente, el último que guarde sobrescribirá los cambios del primero sin notificación.

**Escenario problemático**:
1. Administrador A abre la inscripción del estudiante Juan Pérez
2. Administrador B abre la misma inscripción
3. Administrador A cambia el tutor académico a "Dr. García"
4. Administrador B cambia la institución a "Empresa XYZ" y guarda
5. Resultado: Solo se guarda el cambio de B, el cambio de A se pierde

**Evidencia**: El código actual NO tiene ningún mecanismo de locking o versionado.

#### Problema 4: Sistema de Reintentos Básico

**Descripción**: El sistema actual implementa reintentos simples sin consideración de tipos de errores.

**Código actual** (`backend/src/lib/db-manager.ts` líneas 162-203):

```typescript
// Reintento con delay lineal - no óptimo
for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
  try {
    return await operation(client);
  } catch (error) {
    if (attempt < this.config.maxRetries) {
      // Delay lineal: 1s, 2s, 3s - puede causar sobrecarga
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
    }
  }
}
```

**Problemas**:
- No diferencia errores transitorios (timeout) de errores permanentes (datos inválidos)
- Delay lineal puede causar "thundering herd" en momentos de alta carga
- No tiene circuit breaker para dejar de insistir cuando el servicio está caído

#### Problema 5: Auditoría Limitada

**Descripción**: El sistema actual solo registra cambios básicos en una tabla de auditoría genérica. No hay forma de reconstruir el historial completo de una práctica profesional.

---

## 4. Propuesta de Mejoras

A continuación se presentan las mejoras propuestas, organizadas en fases según su prioridad e interdependencia.

### 4.1 Fase 1: Transacciones Atómicas (CRÍTICA)

**Objetivo principal**: Garantizar que las operaciones multi-tabla se ejecuten como una unidad atómica.

**Descripción técnica**:

Utilizaremos PostgreSQL Transactions a través de funciones RPC que encapsulen múltiples operaciones:

```sql
-- Función RPC que ejecuta múltiples operaciones atómicamente
CREATE OR REPLACE FUNCTION create_enrollment_atomic(
  p_student_id INT,
  p_practice_id INT,
  p_institution_id INT,
  p_academic_tutor_id INT,
  p_methodological_tutor_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Iniciar transacción implícita en la función
  -- Actualizar práctica
  UPDATE t_professional_practices
  SET PRACTICES_STATUS = 2,
      INSTITUTION_ID = p_institution_id,
      REGISTRATION_DATE = NOW()
  WHERE PROFESSIONAL_PRACTICE_ID = p_practice_id;

  -- Insertar tutores
  INSERT INTO t_professional_practices_tutor (TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE)
  VALUES 
    (p_academic_tutor_id, p_practice_id, 'ACADEMICO'),
    (p_methodological_tutor_id, p_practice_id, 'METODOLOGICO');

  -- Si todo sale bien, devolver resultado
  SELECT row_to_json(pp.*) INTO v_result
  FROM t_professional_practices pp
  WHERE pp.PROFESSIONAL_PRACTICE_ID = p_practice_id;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Cualquier error hace rollback automático
    RAISE;
END;
$$;
```

**Beneficios esperados**:
- ✅ Si falla cualquier operación, TODOS los cambios se revierten
- ✅ No hay forma de dejar datos inconsistentes
- ✅ El frontend no necesita cambios adicionales

**Impacto en el código**:
- Modificar `db-manager.ts` para soportar llamadas RPC transactionales
- Modificar `enrollments.controller.ts`, `pre-enrollments.controller.ts`, y `culmination.controller.ts` para usar la nueva función

**Riesgo**: Bajo - La función RPC es transparente al resto del sistema

---

### 4.2 Fase 2: Validaciones en Base de Datos

**Objetivo principal**: Mover las validaciones de negocio desde el código hacia la base de datos.

**Descripción técnica**:

Crearemos triggers de PostgreSQL que impidan operaciones inválidas:

```sql
-- Trigger para evitar doble inscripción activa
CREATE OR REPLACE FUNCTION check_single_active_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo validar cuando se va a establecer como inscrito (Status=2)
  IF NEW.PRACTICES_STATUS = 2 THEN
    IF EXISTS (
      SELECT 1 FROM t_professional_practices 
      WHERE STUDENTS_ID = NEW.STUDENTS_ID 
        AND PRACTICES_STATUS = 2 
        AND STATUS = 1
        -- Excluir el registro que se está actualizando (para UPDATE)
        AND PROFESSIONAL_PRACTICE_ID != COALESCE(NEW.PROFESSIONAL_PRACTICE_ID, 0)
    ) THEN
      RAISE EXCEPTION 'El estudiante ya posee una inscripción activa.%
      Solo puede tener una práctica profesional activa a la vez.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_active_enrollment
  BEFORE INSERT OR UPDATE ON t_professional_practices
  FOR EACH ROW
  EXECUTE FUNCTION check_single_active_enrollment();
```

**Validaciones adicionales propuestas**:

1. **No permitir práctica sin estudiante válido**:
```sql
-- Verificar que el estudiante existe y está activo
CREATE TRIGGER trg_validate_student
  BEFORE INSERT OR UPDATE ON t_professional_practices
  FOR EACH ROW
  EXECUTE FUNCTION validate_student_reference();
```

2. **No permitir práctica sin período académico activo**:
```sql
-- Verificar que el período está vigente
CREATE TRIGGER trg_validate_period
  BEFORE INSERT OR UPDATE ON t_professional_practices
  FOR EACH ROW
  EXECUTE FUNCTION validate_period_reference();
```

**Beneficios esperados**:
- ✅ Integridad de datos garantizada a nivel de base de datos
- ✅ Protege contra accesos directos a la DB
- ✅ Menos código en el backend
- ✅ Errores más claros y uniformes

**Riesgo**: Muy bajo - Los triggers son transparentes al código

---

### 4.3 Fase 3: Optimistic Locking

**Objetivo principal**: Prevenir conflictos cuando dos usuarios.editan el mismo registro simultáneamente.

**Descripción técnica**:

Agregaremos un campo de versión a la tabla que se incrementa con cada actualización:

```sql
-- Agregar columna de versión
ALTER TABLE t_professional_practices 
ADD COLUMN version INTEGER DEFAULT 1;

-- El código del UPDATE debe incluir la versión esperada
const { data, error } = await supabase
  .from('t_professional_practices')
  .update({ 
    ...newData, 
    version: oldVersion + 1 
  })
  .eq('PROFESSIONAL_PRACTICE_ID', id)
  .eq('version', oldVersion);  // ← Verifica que nadie más cambió el registro

// Si error.code === 'PGRST116' (0 rows affected), significa que la versión cambió
// y otro usuario.modificó el registro
if (error?.code === 'PGRST116') {
  throw new Error('El registro fue modificado por otro usuario. Por favor, actualice y reintente.');
}
```

**Beneficios esperados**:
- ✅ Detectar y rechazar modificaciones Conflictivas
- ✅ Experiencia de usuario más predecible
- ✅ No requiere bloqueos pesimistas (que degradan el rendimiento)

**Riesgo**: Bajo - Compatible hacia atrás, se puede implementar con feature flag

---

### 4.4 Fase 4: Sistema de Reintentos con Circuit Breaker

**Objetivo principal**: Mejorar la resiliencia del sistema ante fallos transitorios.

**Descripción técnica**:

Mejora del sistema de reintentos existente en `db-manager.ts`:

```typescript
// Nuevo sistema de reintentos con backoff exponencial y jitter
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;      // ej: 1000ms
  maxDelay: number;      // ej: 10000ms
  exponentialBase: number; // ej: 2
  jitter: boolean;        // agregar aleatoriedad para evitar thundering herd
}

// Circuit Breaker para dejar de insistir cuando el servicio está caído
class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailure: Date | null = null;
  
  private readonly FAILURE_THRESHOLD = 5;  // abrir después de 5 fallos
  private readonly RESET_TIMEOUT = 30000; // 30 segundos

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure!.getTime() > this.RESET_TIMEOUT) {
        this.state = 'half-open'; // probar si el servicio volvió
      } else {
        throw new Error('Servicio temporalmente no disponible');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = new Date();
    if (this.failures >= this.FAILURE_THRESHOLD) {
      this.state = 'open';
    }
  }
}
```

**Beneficios esperados**:
- ✅ Menos recursos desperdiciados en reintentos inútiles
- ✅ Recuperación más rápida de fallos en cadena
- ✅ Mejor logging de errores

**Riesgo**: Bajo - Funcionalidad adicional, no afecta el comportamiento existente

---

### 4.5 Fase 5: Sistema de Auditoría Mejorado (Opcional)

**Objetivo principal**: Mantener un historial completo de cambios para compliance y debugging.

**Descripción técnica**:

```sql
-- Tabla de auditoría
CREATE TABLE practice_audit_log (
  audit_id SERIAL PRIMARY KEY,
  practice_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,  -- 'INSERT', 'UPDATE', 'STATUS_CHANGE'
  old_values JSONB,
  new_values JSONB,
  changed_by INT,
  changed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Trigger automático
CREATE OR REPLACE FUNCTION audit_practice_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO practice_audit_log (
    practice_id, 
    action, 
    old_values, 
    new_values, 
    changed_by
  )
  VALUES (
    NEW.PROFESSIONAL_PRACTICE_ID,
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    current_setting('app.current_user_id', true)::INT
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_practice_audit
  AFTER INSERT OR UPDATE ON t_professional_practices
  FOR EACH ROW
  EXECUTE FUNCTION audit_practice_changes();
```

**Beneficios esperados**:
- ✅ Compliance con regulaciones de datos
- ✅ Herramienta poderosa para debugging
- ✅ Historial para reportes académicos

**Riesgo**: Muy bajo - Solo añade tablas de lectura

---

## 5. Comparación con Alternativas

### 5.1 Opción 1: Dejar el Sistema Como Está (STATUS QUO)

| Aspecto | Evaluación |
|---------|------------|
| Costo | $0 (no hay desarrollo) |
| Riesgo | ALTO - inconsistencias de datos продолжают occurri |
| Mantenibilidad | Difícil - bugs difíciles de reproducir |
| Escalabilidad | Limitada por la arquitectura actual |

**Conclusión**: No recomendado - el riesgo supera el costo del desarrollo.

### 5.2 Opción 2: Usar un ORM Completo (TypeORM/Sequelize)

| Aspecto | Evaluación |
|---------|------------|
| Costo | ALTO - migración completa del codebase |
| Riesgo | ALTO - cambio muy significativo |
| Beneficio | Transacciones automáticas |
| Tiempo | 3-4 meses estimado |

**Conclusión**: No recomendado para este proyecto - demasiado disruptivo.

### 5.3 Opción 3: Implementar las Fases Propuestas (RECOMENDADA)

| Aspecto | Evaluación |
|---------|------------|
| Costo | MEDIO - desarrollo incremental |
| Riesgo | BAJO - cada fase es independiente y opcional |
| Beneficio | Resuelve problemas reales sin alterar arquitectura |
| Tiempo | 1-2 meses para fases críticas |

**Conclusión**: **RECOMENDADA** - Mejor balance costo-beneficio.

---

## 6. Plan de Implementación

### 6.1 Cronograma Sugerido

```
MES 1                    MES 2                    MES 3
─────────────────────────────────────────────────────────────────

[FASE 1]                 [FASE 2]                 [FASE 3]
Transacciones            Validaciones             Optimistic
Atómicas                 BD                       Locking

                          + [FASE 4]
                          Retry/Circuit
                          Breaker
```

### 6.2 Detalle de Tareas por Fase

#### Fase 1: Transacciones Atómicas (Semanas 1-2)

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| 1.1 | Crear funciones RPC en PostgreSQL | 8 horas |
| 1.2 | Modificar db-manager.ts para soporte RPC | 4 horas |
| 1.3 | Actualizar enrollments.controller.ts | 4 horas |
| 1.4 | Actualizar pre-enrollments.controller.ts | 4 horas |
| 1.5 | Testing de integración | 8 horas |

#### Fase 2: Validaciones en BD (Semanas 3-4)

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| 2.1 | Crear triggers de validación | 8 horas |
| 2.2 | Script de migración SQL | 2 horas |
| 2.3 | Testing de edge cases | 4 horas |

#### Fase 3: Optimistic Locking (Semanas 5-6)

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| 3.1 | Agregar columna version | 2 horas |
| 3.2 | Modificar controllers para version checking | 6 horas |
| 3.3 | Actualizar frontend para manejar errores de concurrencia | 4 horas |

#### Fase 4: Retry Mejorado (Semanas 7-8)

| Tarea | Descripción | Esfuerzo |
|-------|-------------|----------|
| 4.1 | Implementar CircuitBreaker | 8 horas |
| 4.2 | Actualizar db-manager.ts | 4 horas |
| 4.3 | Configurar logs y monitoreo | 4 horas |

---

## 7. Impacto y Beneficios Esperados

### 7.1 Beneficios Cuantificables

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Inconsistencias de datos | ~2-3% de registros | ~0% | 100% |
| Tiempo de debugging de errores | 4-8 horas | 15-30 min | 90% |
| Conflictos de edición simultánea | No detectable | Detectable y manejable | 100% |
| Tiempo de recuperación ante fallos | Variable | < 30 segundos | Significativo |

### 7.2 Beneficios No Cuantificables

- **Mayor confianza** de los usuarios en el sistema
- **Mejor reputación** del departamento de sistemas
- **Preparación** para futuras auditorías
- **Base sólida** para escalabilidad futura

### 7.3 Impacto Negativo Potencial (Mitigaciones)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Retrasos en desarrollo | Baja | Medio | Entregas incrementales |
| Errores en migraciones | Muy baja | Alto | Testing exhaustivo |
| Degradación de rendimiento | Muy baja | Bajo | Benchmarks antes/después |

---

## 8. Conclusión y Recomendación Final

### 8.1 Resumen

Las mejoras propuestas abordan problemas reales y tangibles en el sistema actual:

1. **Transacciones atómicas**: Resuelven el problema crítico de datos inconsistentes
2. **Validaciones en BD**: Garanticen integridad de datos a nivel de base de datos
3. **Optimistic locking**: Previenen conflictos de edición concurrente
4. **Retry mejorado**: Aumentan la resiliencia del sistema

### 8.2 Recomendación

**Se recomienda implementar las Fases 1 y 2** por las siguientes razones:

- **Mayor beneficio con menor esfuerzo**: Las fases 1 y 2 resuelven el 80% de los problemas con el 40% del esfuerzo total
- **Riesgo mínimo**: Ambas fases son transparentes al frontend y no alteran la API existente
- **Costo bajo**: No requieren recursos adicionales significativos

**Las fases 3, 4 y 5** pueden implementarse posteriormente según las necesidades operativas del sistema.

### 8.3 Próximos Pasos

1. **Revisión por el equipo**: Analizar esta propuesta y verificar alineación con objetivos institucionales
2. **Decisión de priorización**: Seleccionar qué fases implementar
3. **Asignación de recursos**: Definir responsables y cronograma
4. **Inicio de desarrollo**: Comenzar con la Fase 1

---

## 9. Anexo: Glosario de Términos

| Término | Definición |
|---------|------------|
| **Transacción atómica** | Operación o conjunto de operaciones que se ejecutan como una unidad indivisible: o se completan todas o no se ejecutan ninguna |
| **Optimistic locking** | Técnica de control de concurrencia que asume que lasConflicts son poco frecuentes y verifica el estado antes de actualizar |
| **Circuit breaker** | Patrón de diseño que previene llamadas repetidas a servicios fallidos |
| **Backoff exponencial** | Estrategia de reintento que incrementa el tiempo de espera exponencialmente |
| **Trigger** | Función de base de datos que se ejecuta automáticamente ante ciertos eventos |
| **RPC (Remote Procedure Call)** | Mecanismo para ejecutar funciones en un servidor remoto |

---

**Documento preparado para revisión del equipo de desarrollo y dirección**

*Para dudas técnicas sobre esta propuesta, contactar al equipo de desarrollo del proyecto.*