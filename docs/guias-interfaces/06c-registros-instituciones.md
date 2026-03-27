# Guía de Interfaz: Registros > Instituciones

## 1. Descripción General

El módulo de **Instituciones** permite gestionar el registro de instituciones receptoras de pasantías. Este módulo tiene dos secciones principales:

1. **Instituciones**: Gestión de empresas/instituciones
2. **Responsables**: Gestión de responsables institucionales

### Propósito

- Registrar nuevas instituciones receptoras de pasantías
- Editar información de instituciones existentes
- Gestionar el estado de instituciones (activo/inactivo)
- Administrar responsables institucionales
- Asignar carreras a cada institución
- Definir tipos de prácticas aceptados

### Ruta

```
/institutions
```

### Roles que Acceden

| Rol | Acceso |
|-----|--------|
| Administrador (role: 1) | ✅ Sí |
| Asistente (role: 2) | ✅ Sí |
| Tutor (role: 3) | ❌ No |
| Estudiante (role: 4) | ❌ No |

---

## 2. Estructura Visual

### Layout de la Página

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [SIDEBAR]                              [HEADER: Usuario + Notificaciones]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  GESTIÓN DE INSTITUCIONES                                                     │
│  Administra las instituciones receptoras de pasantías y sus responsables        │
│                                                                                 │
│  ┌─────────────────────────────────────┐ ┌──────────────────────────────┐   │
│  │ [Reporte PDF]  [+ Nueva Institución] │ │                              │   │
│  └─────────────────────────────────────┘ └──────────────────────────────┘   │
│                                                                                 │
│  [Instituciones] [Responsables]          (Tabs principales)                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Activas] [Inactivas]                                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  RIF      | Nombre           | Teléfono    | Tipo      | Estado       │   │
│  │  ─────────────────────────────────────────────────────────────────────│   │
│  │  J-123456| Empresa XYZ      | 0212-1234567| PRIVADA   | [Activo]     │   │
│  │  J-987654| Hospital Central  | 0212-7654321| PÚBLICA   | [Activo]     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Secciones del Módulo

### 3.1 Pestañas Principales

```
[Instituciones] [Responsables]
```

- **Instituciones**: Gestión de empresas/instituciones receptoras
- **Responsables**: Gestión de responsables institucionales

### 3.2 Pestañas Secundarias

```
[Activas] [Inactivas]
```

- **Activas**: Registros con `status = true`
- **Inactivas**: Registros con `status = false`

---

## 4. Sección: Instituciones

### 4.1 Tabla de Instituciones

#### Columnas

| Columna | Descripción | Ordenable |
|---------|-------------|-----------|
| RIF | Identificación fiscal | ✅ |
| Nombre | Nombre de la institución | ✅ |
| Teléfono | Teléfono de contacto | ✅ |
| Tipo | Pública/Privada | ✅ |
| Estado | Estatus actual | ✅ |
| Acciones | Menú de acciones | ❌ |

### 4.2 Estados

| Status | Label | Color |
|--------|-------|-------|
| true | Activo | Verde |
| false | Inactivo | Gris |

---

## 5. Modal de Institución

### 5.1 Campos del Formulario

| Campo | Tipo | Required | Validaciones |
|-------|------|----------|--------------|
| RIF | text | ✅ Sí | Formato: J-12345678-9 |
| Nombre | text | ✅ Sí | Nombre de la institución |
| Dirección Fiscal | textarea | ✅ Sí | Dirección legal |
| Teléfono | text | ✅ Sí | Formato: 0212-1234567 |
| Región | text | ✅ Sí | Región geográfica |
| Núcleo | text | ✅ Sí | Núcleo universitario |
| Extensión | text | ❌ No | Extensión del núcleo |
| Tipo de Empresa | select | ✅ Sí | Pública/Privada |
| Tipo de Práctica | select | ✅ Sí | Ordinaria / Hospitalaria y Comunitaria |
| Carreras Atendidas | multi-select | ✅ Sí | Al menos una carrera |

### 5.2 UI del Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGISTRAR NUEVA INSTITUCIÓN                                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ INFORMACIÓN BÁSICA                                               │   │
│  │                                                                 │   │
│  │  RIF *                                                           │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ J-12345678-9                                           │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  │                                                                 │   │
│  │  Nombre de la Institución *                                    │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ Empresa XYZ C.A.                                     │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  │                                                                 │   │
│  │  Dirección Fiscal *                                            │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ Av. Principal, Edificio, Ciudad                      │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  │                                                                 │   │
│  │  Teléfono *                                                    │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ 0212-1234567                                           │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ INFORMACIÓN ADICIONAL                                           │   │
│  │                                                                 │   │
│  │  Región *         Núcleo *           Extensión                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │   │
│  │  │ Capital      │ │ Caracas      │ │              │       │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘       │   │
│  │                                                                 │   │
│  │  Tipo de Empresa *    Tipo de Práctica *                      │   │
│  │  ┌──────────────┐ ┌──────────────┐                        │   │
│  │  │ PRIVADA     ▼ │ │ Ordinaria    ▼│                        │   │
│  │  └──────────────┘ └──────────────┘                        │   │
│  │                                                                 │   │
│  │  Carreras Atendidas *                                         │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ ☑ Ingeniería de Sistemas                               │    │   │
│  │  │ ☑ Ingeniería Civil                                     │    │   │
│  │  │ ☐ Ingeniería Eléctrica                                 │    │   │
│  │  │ ☐ Medicina                                              │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Cancelar]                                    [Registrar]            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Validaciones

### 6.1 RIF

```typescript
// Formato: J-XXXXXXXX-X
// Validaciones:
- Debe comenzar con J, V, E, G, P
- Seguido de 9 dígitos
- Terminado en dígito verificador
- Unique en el sistema
```

### 6.2 Teléfono

```typescript
// Formato: 0212-1234567
// Validaciones:
- Código de área + número
- Solo dígitos
```

---

## 7. Tipos de Práctica

| Tipo | Descripción |
|------|-------------|
| Ordinaria | Práctica profesional regular |
| Hospitalaria y Comunitaria | Práctica en sector salud o comunitario |

---

## 8. Carreras Atendidas

### 8.1 Descripción

Cada institución puede atender estudiantes de **una o múltiples carreras**.

### 8.2 UI de Selección

```
Carreras Atendidas *:
┌─────────────────────────────────────────┐
│ ☑ Ingeniería de Sistemas               │
│ ☑ Ingeniería Civil                      │
│ ☐ Ingeniería Eléctrica                 │
│ ☐ Medicina                             │
│ ☐ Derecho                             │
└─────────────────────────────────────────┘
```

---

## 9. Sección: Responsables Institucionales

### 9.1 Descripción

Los **Responsables Institucionales** son las personas de contacto en cada institución que supervisan a los estudiantes durante sus pasantías.

### 9.2 Tabla de Responsables

#### Columnas

| Columna | Descripción |
|---------|-------------|
| Cédula | Identificación del responsable |
| Nombre | Nombre completo |
| Cargo | Cargo en la institución |
| Teléfono | Teléfono de contacto |
| Correo | Email institucional |
| Estado | Activo/Inactivo |

---

## 10. Modal de Responsable

### 10.1 Campos

| Campo | Tipo | Required |
|-------|------|----------|
| Prefijo | select | ✅ Sí |
| Cédula | text | ✅ Sí |
| Primer Nombre | text | ✅ Sí |
| Segundo Nombre | text | ❌ No |
| Primer Apellido | text | ✅ Sí |
| Segundo Apellido | text | ❌ No |
| Cargo | text | ✅ Sí |
| Teléfono | text | ✅ Sí |
| Correo | text | ✅ Sí |
| Institución | select | ✅ Sí |

---

## 11. Tipos de Datos

### 11.1 Institution

```typescript
interface Institution {
  institutionId: string;
  rif: string;                    // J-XXXXXXXX-X
  name: string;                    // Nombre completo
  fiscalAddress: string;           // Dirección fiscal
  phone: string;                  // Teléfono
  region: string;                  // Región
  nucleus: string;                // Núcleo
  extension?: string;              // Extensión
  institutionType: string;         // Pública/Privada
  practiceType?: string;          // Ordinaria / Hosp. y Comunitaria
  internshipTypeIds?: string[];  // Tipos de práctica
  careerIds?: string[];           // Carreras atendidas
  
  // Metadatos
  registrationDate: string | Date;
  status: boolean;
  responsibleCount?: number;
  isInUse?: boolean;
}
```

### 11.2 InstitutionalResponsible

```typescript
interface InstitutionalResponsible {
  responsibleId: string;
  identificationPrefix: "V" | "E";
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  phone: string;
  email: string;
  cargo: string;
  
  // Relaciones
  institutionId: string;
  
  // Metadatos
  registrationDate: string | Date;
  status: boolean;
}
```

---

## 12. Obtención de Datos

### 12.1 Hooks

```typescript
// Instituciones
const {
  institutions,
  status,
  addInstitution,
  editInstitution,
  toggleStatus,
  bulkRemoveInstitutions,
  bulkRestoreInstitutions,
} = useInstitutions();

// Responsables
const {
  responsibles,
  addResponsible,
  editResponsible,
  toggleStatus: toggleResponsibleStatus,
} = useInstitutionalResponsibles();
```

### 12.2 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/institutions` | Obtener instituciones |
| POST | `/api/institutions` | Crear institución |
| PUT | `/api/institutions/:id` | Actualizar institución |
| DELETE | `/api/institutions/:id` | Eliminar institución |
| GET | `/api/institutional-responsibles` | Obtener responsables |
| POST | `/api/institutional-responsibles` | Crear responsable |

---

## 13. Listas Dinámicas

| Lista | Uso |
|-------|-----|
| Rif | Prefijos de RIF (J, V, E, G, P) |
| Tipo de empresa | Pública/Privada |

---

## 14. Acciones

### 14.1 Acciones por Registro

| Acción | Icono | Descripción |
|--------|-------|-------------|
| Ver | 👁️ | Ver detalles completos |
| Editar | ✏️ | Modificar datos |
| Activar/Desactivar | 🔄 | Cambiar estado |
| Eliminar | 🗑️ | Eliminar permanentemente |

---

## 15. Reporte PDF

### 15.1 Columnas del PDF (Instituciones)

| Columna | Datos |
|---------|-------|
| RIF | rif |
| Nombre | name |
| Teléfono | phone |
| Tipo | institutionType |
| Estado | status |

---

## 16. Casos Edge

| Caso | Comportamiento |
|------|----------------|
| RIF duplicado | Validación rejecta |
| Institución con estudiantes | Warning al eliminar |
| Sin carreras atendidas | Validación rejecta |
| Responsable sin institución | Validación rejecta |

---

## 17. Archivos Relacionados

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Institutions/institutions.tsx` | Página principal |
| `src/features/institutions/components/InstitutionTable.tsx` | Tabla de instituciones |
| `src/features/institutions/components/InstitutionModal.tsx` | Modal de institución |
| `src/features/institutions/components/InstitutionalResponsibleTable.tsx` | Tabla de responsables |
| `src/features/institutions/components/InstitutionalResponsibleModal.tsx` | Modal de responsable |
| `src/features/institutions/hooks/useInstitutions.tsx` | Hook de instituciones |
| `src/features/institutions/hooks/useInstitutionalResponsibles.tsx` | Hook de responsables |
| `src/features/institutions/types/index.tsx` | Tipos TypeScript |

### Backend

| Archivo | Descripción |
|---------|-------------|
| `backend/src/routes/institutions.routes.ts` | Rutas de instituciones |
| `backend/src/routes/institutional-responsibles.routes.ts` | Rutas de responsables |

---

## 18. Siguiente Módulo

El módulo "Registros" está completo. El siguiente en el sidebar es:

| # | Módulo | Ruta |
|---|--------|------|
| 07 | Prácticas Profesionales > Pre-Inscripción | `/pre-enrollment` |
