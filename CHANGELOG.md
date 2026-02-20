# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.2.0] - 2026-02-20

### Added
- ✨ **Sistema de Documentos para Estudiantes** - Upload, revisión y gestión de documentos
- ✨ **Personalización de Tema** - 8 colores de marca seleccionables por usuario
- ✨ **Dashboard de Estudiante Completo** - Progreso de horas, bitácora, documentos, solicitudes
- ✨ **Sistema de Solicitudes** - Estudiantes pueden crear solicitudes a coordinación
- ✨ **Tipos de Solicitud** - 8 tipos predefinidos (cambio empresa, tutor, prórroga, etc.)
- ✨ **Bitácora de Actividades** - Registro diario/semanal para estudiantes
- ✨ **Notificaciones en Tiempo Real** - SSE para alertas instantáneas

### Changed
- 🔄 Sidebar mejorado - Menú padre se resalta cuando subpágina está activa
- 🔄 Búsqueda case-insensitive en listas (por ID y nombre)
- 🔄 StudentDashboard rediseñado con barra de progreso de horas

### Fixed
- 🐛 Corregido error TypeScript en `EvaluationDetailModal.tsx` (imports no usados)
- 🐛 Corregido error TypeScript en `Backups.tsx` (UnifiedDialog children)
- 🐛 Corregido error TypeScript en `EvaluationsList.tsx` (null check)
- 🐛 Corregido error TypeScript en `StudentEvaluations.tsx` (prop title)

### Documentation
- 📚 README.md actualizado a versión 2.2.0
- 📚 docs/API.md con endpoints de documentos, tema, notificaciones
- 📚 Migraciones SQL para nuevas tablas (documents, theme, notifications, requests)

---

## [2.1.0] - 2026-02-18

### Added
- ✨ **Módulo de Evaluaciones Completo** - 3 tipos ponderados (Institucional 40%, Académico 30%, Comité 30%)
- ✨ **Criterios de Evaluación Dinámicos** - Por tipo de evaluador
- ✨ **Panel de Tutor** - Estudiantes asignados, seguimientos, evaluaciones
- ✨ **Rutas protegidas por rol** - Acceso diferenciado admin/tutor/estudiante
- ✨ **Migraciones SQL** - Sistema de evaluaciones, visitas, activity logs

### Changed
- 🔄 Refactorización de rutas de estudiante
- 🔄 Servicios separados para admin y student requests
- 🔄 Tipos centralizados en `features/student/types/`

---

## [2.0.2] - 2026-02-15

### Added
- ✨ Análisis arquitectónico completo del sistema documentado
- ✨ Guía completa para desarrolladores en `AGENTS.md` con 16 features map
- ✨ Documentación técnica profunda en `README_TECNICO.md`
- ✨ Step-by-step guide para agregar nuevos features
- ✨ Troubleshooting guide con soluciones a problemas comunes
- ✨ Badges informativos en README.md
- ✨ Sección de características principales en README.md

### Changed
- 🔄 README.md completamente renovado con mejor estructura
- 🔄 AGENTS.md expandido con patrones de código y ejemplos
- 🔄 Reorganización de documentación para mejor navegabilidad
- 🔄 Mejoras en convenciones de naming y código

### Documentation
- 📚 13 documentos markdown actualizados y sincronizados
- 📚 Diagramas Mermaid agregados para flujos y arquitectura
- 📚 Referencias cruzadas entre documentos
- 📚 Guías de contribución mejoradas
- 📚 Tabla de tecnologías con versiones actualizadas

### Removed
- 🗑️ Archivos duplicados en carpeta `docs/` eliminados
- 🗑️ Documentación redundante consolidada

---

## [2.0.1] - 2026-02-10

### Fixed
- 🐛 Corregido error de duplicate keys en `TrackingTable.tsx`
- 🐛 Resuelto hook order error en `PeriodStatusCard.tsx`
- 🐛 Arreglado dependency error con `lucide-react` en múltiples componentes
- 🐛 Solucionado CSS build errors

### Added
- ✨ Componente `PeriodStatusCard` en sidebar
- ✨ Integración de hook `usePeriods` en sidebar
- ✨ Adaptación de card a estados collapsed/expanded del sidebar

### Changed
- 🔄 Revertidos cambios de color primario
- 🔄 Mejorado manejo de errores de red en generación QR

---

## [2.0.0] - 2026-01-15

### Added
- ✨ Migración completa a React 19
- ✨ Actualización a Tailwind CSS v4
- ✨ Sistema de variables CSS semánticas
- ✨ Lazy loading de rutas con React.lazy
- ✨ Code splitting manual optimizado
- ✨ Vercel Analytics reactivado

### Changed
- 🔄 Modularización de rutas: lógica movida de `App.tsx` a `src/routes/index.tsx`
- 🔄 Refactorización de código aplicando principios SOLID
- 🔄 Optimización de arquitectura feature-based
- 🔄 Actualización de dependencias a versiones estables con React 19
- 🔄 Mejora en configuración de Docker con HMR

### Fixed
- 🐛 Problemas de compatibilidad con React 19
- 🐛 Errores de chunk loading en producción

### Security
- 🔐 Archivos `.env` en Docker montados como read-only
- 🔐 Verificación de integridad MD5 en setup scripts
- 🔐 Headers de seguridad mejorados con Helmet

---

## [1.8.0] - 2026-01-05

### Added
- ✨ Sistema de pre-inscripciones implementado
- ✨ Feature de tracking de pasantías completo
- ✨ Módulo de instituciones externas
- ✨ Gestión de tutores académicos

### Changed
- 🔄 Mejoras en UX del sistema de inscripciones
- 🔄 Optimización de queries a base de datos
- 🔄 UI refinements en módulo de estudiantes

---

## [1.7.0] - 2025-12-20

### Added
- ✨ Dashboard analítico con ApexCharts
- ✨ Visualización de estadísticas académicas
- ✨ Exportación de reportes a PDF
- ✨ Calendario de eventos con FullCalendar

### Changed
- 🔄 Refactor de componentes de formulario
- 🔄 Mejoras de performance en tablas grandes
- 🔄 Optimización de carga inicial

---

## [1.6.0] - 2025-12-01

### Added
- ✨ Sistema de autenticación con JWT
- ✨ Control de acceso basado en roles
- ✨ Sincronización de sesión entre pestañas
- ✨ Protected y Public routes

### Security
- 🔐 Cookies HttpOnly para tokens
- 🔐 CORS configurado correctamente
- 🔐 Bcrypt para hashing de contraseñas

---

## [1.5.0] - 2025-11-15

### Added
- ✨ Feature de gestión de periodos académicos
- ✨ Feature de gestión de carreras
- ✨ Componente DualCalendar para fechas
- ✨ Validaciones con Zod schemas

### Changed
- 🔄 Migración a React Hook Form
- 🔄 Implementación de CRUD service factory
- 🔄 Estandarización de hooks CRUD

---

## [1.0.0] - 2025-10-01

### Added
- 🎉 Release inicial del sistema UNEFA Dashboard
- ✨ Arquitectura base: React + Vite + Tailwind
- ✨ Backend con Express + Supabase
- ✨ Módulo de usuarios básico
- ✨ Landing page pública
- ✨ Docker support

---

## Tipos de Cambios

- `Added` ✨ para nuevas características
- `Changed` 🔄 para cambios en funcionalidad existente
- `Deprecated` ⚠️ para características que serán eliminadas
- `Removed` 🗑️ para características eliminadas
- `Fixed` 🐛 para corrección de bugs
- `Security` 🔐 para cambios de seguridad
- `Documentation` 📚 para cambios en documentación
- `Performance` ⚡ para mejoras de rendimiento

---

## Enlaces

- [Repositorio](https://github.com/Antony-Figueroa/UNEFA_DASHBOARD)
- [Documentación](README.md)
- [Guía Técnica](README_TECNICO.md)
- [Issues](https://github.com/Antony-Figueroa/UNEFA_DASHBOARD/issues)
