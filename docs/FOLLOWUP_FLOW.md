# Flujo de Seguimiento de Prácticas Profesionales

> **Última actualización:** Feb 2026
> **Versión:** 1.0
> **Estado:** En implementación

---

## 1. Estados de la Práctica Profesional

| Código | Estado | Descripción |
|--------|--------|-------------|
| 1 | **Pre-inscrito** | El estudiante solicitó pre-inscripción |
| 2 | **Activo** | La práctica está en curso |
| 3 | **Completado** | La práctica terminó exitosamente |
| 4 | **Suspendido** | La práctica se pausó temporalmente |
| 5 | **Cancelado** | La práctica fue cancelada |

---

## 2. Tipos de Visitas

| Tipo | Descripción |
|------|-------------|
| **PRESENCIAL** | Visita física a la empresa/institución |
| **VIRTUAL** | Videollamada o reunión online |
| **TELEFONICA** | Llamada telefónica de seguimiento |

---

## 3. Casos de Seguimiento

| # | Caso | Tipo de Visita | Descripción |
|---|------|----------------|-------------|
| 1 | **VISITA_INICIAL** | Presencial/Virtual | Primera visita de presentación y verificación de inicio |
| 2 | **SEGUIMIENTO_REGULAR** | Presencial/Virtual/Telefónica | Visita de monitoreo de progreso |
| 3 | **REVISION_BITACORAS** | Virtual/Telefónica | Verificación de actividades registradas |
| 4 | **EVALUACION_PARCIAL** | Presencial/Virtual | Evaluación parcial del estudiante |
| 5 | **SEGUIMIENTO_PROBLEMAS** | Presencial/Virtual/Telefónica | Atención a dificultades reportadas |
| 6 | **CAMBIO_EMPRESA** | Presencial | Verificación y aprobación de nueva empresa |
| 7 | **CAMBIO_TUTOR** | Virtual | Asignación de nuevo tutor académico |
| 8 | **SUSPENSION** | Presencial | Gestión de pausa de prácticas |
| 9 | **REANUDACION** | Presencial | Verificación de reinicio de actividades |
| 10 | **EVALUACION_FINAL** | Presencial | Cierre y calificación de prácticas |
| 11 | **CERTIFICACION** | Virtual | Verificación de documentos finales |

---

## 4. Flujo por Etapa

### A) Inicio de Práctica
```
Pre-inscrito → Activo
     ↓
1. VISITA_INICIAL
2. Confirmación de supervisor
```

### B) Durante la Práctica
```
Activo (repite según periodicidad)
     ↓
1. SEGUIMIENTO_REGULAR (quincenal)
2. REVISION_BITACORAS (semanal)
3. EVALUACION_PARCIAL (mensual)
4. SEGUIMIENTO_PROBLEMAS (si aplica)
```

### C) Problemas/Incidentes
```
Activo → Suspendido/Cancelado
     ↓
1. SEGUIMIENTO_PROBLEMAS
2. CAMBIO_EMPRESA (si aplica)
3. CAMBIO_TUTOR (si aplica)
4. SUSPENSION (si aplica)
```

### D) Culminación
```
Activo → Completado
     ↓
1. EVALUACION_FINAL
2. CERTIFICACION
```

---

## 5. Permisos por Rol

| Rol | Casos Permitidos |
|-----|------------------|
| Administrador (1) | Todos |
| Asistente (2) | VISITA_INICIAL, SEGUIMIENTO_REGULAR, SEGUIMIENTO_PROBLEMAS, EVALUACION_FINAL |
| Tutor (3) | Todos |
| Estudiante (4) | Ver solo sus registros |

---

## 6. Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Feb 2026 | Versión inicial con 11 casos de seguimiento |

---

## 7. Notas

- Los casos pueden ser modificados o agregados según necesidades del sistema
- La periodicidad de visitas puede configurarse por período académico
- Algunos casos requieren documentación adicional (ej: cambio de empresa)
