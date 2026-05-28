# UNEFA Dashboard — Plan de App Desktop Offline con Electron

> **Fecha:** 2026-05-28
> **Versión:** 1.0
> **Propósito:** Plan de implementación para versión de escritorio con capacidad offline y sincronización manual con Supabase Cloud

---

## 1. Visión General de Arquitectura

### Capas del Sistema

```
┌──────────────────────────────────────────────────────────┐
│                   APP DESKTOP (Electron)                  │
│                                                           │
│  ┌──────────────────┐   ┌──────────────────────────────┐ │
│  │   Renderer        │   │        Main Process           │ │
│  │   (React + Vite)  │   │                               │ │
│  │   localhost:5173   │◄──►  Servidor Express Local      │ │
│  │                    │   │  (mismos controllers)         │ │
│  └──────────────────┘   │  localhost:3000                │ │
│                          │                               │ │
│                          │  ┌─────────────────────────┐  │ │
│                          │  │   PGlite (DB Local)      │  │ │
│                          │  │   PostgreSQL via WASM     │  │ │
│                          │  │   Archivo: ~/.unefa/db    │  │ │
│                          │  └─────────────────────────┘  │ │
│                          │                               │ │
│                          │  ┌─────────────────────────┐  │ │
│                          │  │   Sync Manager           │  │ │
│                          │  │   (Manual, on-demand)    │  │ │
│                          │  └─────────────────────────┘  │ │
│                          └──────────┬────────────────────┘ │
└─────────────────────────────────────┼──────────────────────┘
                                      │
                    ┌──────────────────▼──────────────────┐
                    │        SUPABASE CLOUD (Producción)    │
                    │        rgvnwslyvixviypgegra           │
                    │        (fuente de verdad oficial)     │
                    └─────────────────────────────────────┘
```

### Principios de Diseño

1. **Los controllers NO se modifican** — la capa de abstracción los aísla del motor de BD
2. **La nube es la fuente de verdad** — los datos oficiales están en Supabase Cloud
3. **Sincronización manual** — el admin decide cuándo y en qué dirección sincronizar
4. **Offline-first** — la app funciona completa sin internet

---

## 2. Estrategia de Base de Datos Local

### Motor: PGlite (PostgreSQL WASM)

Se elige **PGlite** sobre SQLite porque:

| Aspecto | PGlite | SQLite |
|---------|--------|--------|
| Compatibilidad con PostgreSQL | ✅ 99% | ❌ Diferencias significativas |
| JSONB, ARRAYs, TIMESTAMPTZ | ✅ Nativos | ❌ No soportados |
| Migraciones existentes | ✅ Corren sin cambios | ❌ Hay que adaptarlas |
| Sync con Supabase | ✅ Mismo motor | ❌ Motores distintos |
| Peso | ~3MB WASM | ~500KB nativo |
| Madurez | 🟡 2024 (ElectricSQL) | ✅ Décadas |

### Arquitectura del Adaptador

Se crea una **capa de abstracción** que implementa la misma interfaz que Supabase JS:

```typescript
// Interfaz que expone dbManager.getConnection()
interface DatabaseAdapter {
  from(table: string): QueryBuilder;
}

interface QueryBuilder {
  select(columns: string): Promise<{ data: any; error: any }>;
  insert(values: any): Promise<{ data: any; error: any }>;
  update(values: any): Promise<{ data: any; error: any }>;
  delete(): Promise<{ data: any; error: any }>;
  eq(column: string, value: any): this;
  neq(column: string, value: any): this;
  in(column: string, values: any[]): this;
  is(column: string, value: null): this;
  order(column: string, opts?: { ascending: boolean }): this;
  limit(count: number): this;
  single(): this;
  maybeSingle(): this;
  or(filter: string): this;
  not(column: string, operator: string, value: any): this;
  returns(type: 'minimal'): this;
}
```

El adaptador traduce cada llamada a SQL y la ejecuta contra PGlite.

### Ejemplo de Traducción

```typescript
// Código del controller (NO CAMBIA):
supabase
  .from('t_students')
  .select('*')
  .eq('STATUS', 1)
  .order('NAME')

// Se traduce internamente a:
// SELECT * FROM t_students WHERE STATUS = $1 ORDER BY NAME
// Parámetros: [1]
```

---

## 3. Estrategia de Sincronización

### Modalidad: Manual (on-demand)

El admin accede desde Configuración → "Sincronizar Base de Datos" y elige:

- **⬇️ Bajar de nube** → Sobrescribe datos locales con los de Supabase
- **⬆️ Subir a nube** → Envía cambios locales a Supabase
- **🔄 Bidireccional** → Merge inteligente (timestamp + last-writer-wins)

### Algoritmo de Sync

```
PULL (Nube → Local):
  1. Conectar a Supabase Cloud
  2. Para cada tabla:
     a. Traer registros con updated_at > ultima_sincronizacion
     b. Si el registro no existe localmente → INSERT
     c. Si el registro existe y nube es más nueva → UPDATE
     d. Si el registro existe y local es más nueva → SALTAR (conflicto)
  3. Guardar timestamp de sincronización

PUSH (Local → Nube):
  1. Conectar a Supabase Cloud
  2. Para cada tabla:
     a. Buscar registros locales con updated_at > ultimo_push
     b. Para cada uno:
        - Intentar UPDATE por ID
        - Si no existe → INSERT
  3. Guardar timestamp de push

CONFLICTOS:
  - Por defecto: "Gana la nube" (más seguro)
  - Opcional: "Gana lo local" (admin override)
```

---

## 4. Estructura de Archivos Nuevos

```
backend/src/
├── lib/
│   ├── dbAdapter.ts              ← Interfaz abstracta
│   ├── pgliteAdapter.ts          ← Implementación PGlite
│   ├── supabaseAdapter.ts        ← Wrapper del Supabase SDK actual
│   ├── syncManager.ts            ← Lógica de sincronización
│   └── dbManager.ts              ← MODIFICADO: elige adaptador según modo
│
electron/
├── main.ts                       ← Entry point de Electron
├── preload.ts                    ← Bridge seguro
└── electron-builder.yml          ← Config de empaquetado

prisma/
└── schema.prisma                 ← ACTUALIZADO: refleja las 54 tablas reales
```

---

## 5. Plan de Implementación por Fases

### Fase 0 — Fundación (~1 semana)

| # | Tarea | Archivos | Estimado |
|---|-------|----------|----------|
| 0.1 | Actualizar schema Prisma con las 54 tablas reales | `prisma/schema.prisma` | 1 día |
| 0.2 | Generar tipos TypeScript desde Prisma | Tipos generados | 1 día |
| 0.3 | Crear interfaz DbAdapter + PGliteAdapter (básico) | `lib/dbAdapter.ts`, `lib/pgliteAdapter.ts` | 2 días |
| 0.4 | Modificar dbManager para modo offline | `lib/dbManager.ts` | 1 día |
| 0.5 | Probar 1 controller sin cambios | Testing | 1 día |

### Fase 1 — Adaptador Completo (~1 semana)

| # | Tarea | Archivos | Estimado |
|---|-------|----------|----------|
| 1.1 | Implementar insert, update, delete | `pgliteAdapter.ts` | 1 día |
| 1.2 | Implementar in, neq, is, or, not | `pgliteAdapter.ts` | 1 día |
| 1.3 | Implementar upsert, returns, maybeSingle | `pgliteAdapter.ts` | 1 día |
| 1.4 | Manejar joins implícitos | `pgliteAdapter.ts` | 1 día |
| 1.5 | Tests unitarios del adaptador | `tests/pgliteAdapter.test.ts` | 1 día |

### Fase 2 — Sync Manager (~1 semana)

| # | Tarea | Archivos | Estimado |
|---|-------|----------|----------|
| 2.1 | Sync Engine: pull (nube → local) | `lib/syncManager.ts` | 2 días |
| 2.2 | Sync Engine: push (local → nube) | `lib/syncManager.ts` | 2 días |
| 2.3 | UI: Panel de sincronización en settings | `features/sync/SyncPanel.tsx` | 1 día |
| 2.4 | UI: Indicador de estado de sync | Componente | 1 día |

### Fase 3 — Electron Shell (~1 semana)

| # | Tarea | Archivos | Estimado |
|---|-------|----------|----------|
| 3.1 | Inicializar Electron + configuración | `electron/main.ts`, `electron/preload.ts` | 2 días |
| 3.2 | Embeber Express en main process | `electron/main.ts` | 1 día |
| 3.3 | Inicializar PGlite al arrancar | `electron/main.ts` | 1 día |
| 3.4 | Build + empaquetado (.exe) | Config electron-builder | 1 día |

### Fase 4 — Testing y Pulido (~3 días)

| # | Tarea | Estimado |
|---|-------|----------|
| 4.1 | Probar sync con datos reales de Supabase | 1 día |
| 4.2 | Manejo de errores (sin disco, sin permisos) | 1 día |
| 4.3 | Builder para Windows installer | 1 día |
| 4.3 | Documentación de uso para el equipo | 0.5 día |

---

## 6. Totales Estimados

| Fase | Tiempo estimado | Líneas de código nuevo |
|------|-----------------|------------------------|
| Fase 0 | ~1 semana | ~500 |
| Fase 1 | ~1 semana | ~400 |
| Fase 2 | ~1 semana | ~500 |
| Fase 3 | ~1 semana | ~300 |
| Fase 4 | ~3 días | ~100 |
| **Total** | **~4.5 semanas** | **~1800 líneas** |

- **Controllers modificados:** 0
- **Lógica de negocio cambiada:** 0
- **Migraciones de Supabase alteradas:** 0

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| PGlite no soporta alguna feature de PG | Baja | Alto | Probar con las queries reales del backend antes de avanzar |
| Sync causa duplicados de datos | Media | Alto | Usar IDs únicos + upsert; probar exhaustivamente |
| Rendimiento de PGlite en equipos lentos | Baja | Medio | Evaluar con datos reales (~1000 registros por tabla) |
| Electron + PGlite en Windows sin WASM | Baja | Alto | Probar en Windows antes de empaquetar |
---
