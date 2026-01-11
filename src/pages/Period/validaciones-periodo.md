# Validaciones de Periodos Académicos

Este documento describe todas las validaciones aplicadas a la gestión de periodos académicos en el sistema TailAdmin.

## 1. Estructura y Código de Periodo

- **Código y Descripción**: El código del periodo se sincroniza automáticamente con la descripción.
- **Formato**: `AAAA-S` (Ejemplo: `2026-I`, `2026-II`).
- **Sincronización**: Al guardar un periodo, el campo `code` en la base de datos se establece igual a la descripción generada a partir del año y el tipo de periodo seleccionados.

## 2. Validaciones de Formulario (Zod)

El esquema de validación asegura que los datos básicos sean correctos antes de procesar reglas de negocio más complejas.

- **Año**: Obligatorio.
- **Tipo de Periodo**: Debe ser 'I' o 'II'.
- **Fecha de Inicio**: Obligatoria. Debe corresponder al año seleccionado.
- **Fecha de Fin**: Obligatoria. Debe ser posterior a la fecha de inicio.
- **Duración Mínima**: El periodo debe tener una duración mínima de **16 semanas**.

## 3. Reglas de Negocio (Secuencialidad y Solapamiento)

Estas validaciones se ejecutan al intentar guardar el periodo y comparan los datos con los periodos existentes.

### 3.1 Secuencialidad Académica
- El sistema impone un orden cronológico estricto: `2025-I` -> `2025-II` -> `2026-I` -> `2026-II`.
- **Nuevo Periodo**: Debe ser exactamente el siguiente al último periodo registrado (0.5 años después en términos de valor lógico).
- **Edición**: No se puede cambiar el lapso (año/tipo) si esto rompe la secuencia con los periodos anteriores.

### 3.2 Solapamiento de Fechas
- No se permite que un periodo se solape en fechas con ningún otro periodo existente.
- Un periodo no puede empezar antes de que el anterior termine.

## 4. Estados y Transiciones

- **Pendiente**: Estado inicial de un periodo creado. Se puede editar y eliminar.
- **En Curso**: 
    - Solo puede haber **un periodo** "En Curso" a la vez.
    - Se activa mediante el botón "Activar" (solo visible si no hay otro periodo activo).
    - No se puede editar la fecha de inicio ni el lapso (año/tipo).
- **Culminado**:
    - Un periodo pasa a este estado mediante la acción "Culminar".
    - Los periodos culminados son de **solo lectura** (no se pueden editar).

## 5. Autocompletado

Para facilitar el registro, el sistema ofrece autocompletado inteligente:
- Al crear un nuevo periodo, se pre-seleccionan automáticamente el **Año** y el **Tipo** correspondientes al siguiente lapso académico.
- La **Fecha de Inicio** se sugiere como el día siguiente a la fecha de fin del último periodo.
- La **Fecha de Fin** se calcula automáticamente a 16 semanas de la fecha de inicio seleccionada.

## 6. Ejemplos Prácticos

| Escenario | Resultado | Razón |
|-----------|-----------|-------|
| Crear `2026-I` después de `2025-II` | **Éxito** | Sigue la secuencia correcta. |
| Crear `2026-II` después de `2025-II` | **Error** | Salta el periodo `2026-I`. |
| Fecha fin a 12 semanas de inicio | **Error** | No cumple el mínimo de 16 semanas. |
| Activar periodo con otro ya "En Curso" | **No Permitido** | Solo se permite un periodo activo a la vez. |
