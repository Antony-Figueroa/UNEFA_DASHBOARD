# 🗄️ Modelo Entidad-Relación — UNEFA Dashboard

> **Diagramas del modelo de datos** explicados para la exposición
> Las tablas reales tienen el prefijo `t_` (ej: `t_students`). Acá usamos nombres legibles.

---

## 📊 Mapa General de Datos

El sistema tiene **69 tablas** en total. Este diagrama muestra las ~25 entidades principales organizadas por dominio funcional.

```mermaid
erDiagram

    %% ====================================================================
    %% DOMINIO: SEGURIDAD Y ACCESO  (🔵 Azul)
    %% ====================================================================

    Personas ||--o| Usuarios : "es"
    Personas ||--o| Estudiantes : "es"
    Personas ||--o| Tutores : "es"
    Personas ||--o| Representantes : "es"

    Usuarios ||--o{ Roles_Usuario : "tiene"
    Roles ||--o{ Roles_Usuario : "asignado a"
    Roles ||--o{ Roles_Permisos : "tiene"
    Permisos ||--o{ Roles_Permisos : "asignado a"

    Usuarios ||--o{ Notificaciones : "recibe"
    Usuarios ||--o{ Historial_Auth : "genera"
    Usuarios ||--o{ Sesiones : "inicia"

    %% ====================================================================
    %% DOMINIO: ACADÉMICO  (🟢 Verde)
    %% ====================================================================

    Carreras ||--o{ Estudiantes : "cursa"
    Carreras ||--o{ Pasantias : "requiere"
    Carreras ||--o{ Carreras_TipoPasantia : "tiene"
    Tipos_Pasantia ||--o{ Carreras_TipoPasantia : "pertenece a"

    Periodos ||--o{ Pasantias : "se realiza en"

    %% ====================================================================
    %% DOMINIO: INSTITUCIONES  (🟠 Naranja)
    %% ====================================================================

    Instituciones ||--o{ Pasantias : "recibe practicantes"
    Instituciones ||--o{ Representantes : "tiene"
    Representantes ||--o{ Pasantias : "supervisa"

    %% ====================================================================
    %% DOMINIO: PASANTÍAS (CORAZÓN DEL SISTEMA)  (🔴 Rojo)
    %% ====================================================================

    Estudiantes ||--o{ Pasantias : "realiza"
    Estudiantes ||--o{ Documentos : "tiene"
    Estudiantes ||--o{ Solicitudes : "solicita"

    Pasantias ||--o{ Pasantias_Tutor : "tiene tutores"
    Tutores ||--o{ Pasantias_Tutor : "asignado a"
    Pasantias ||--o{ Bitacora : "registra actividades"
    Pasantias ||--o{ Evaluaciones : "es evaluado"
    Pasantias ||--o{ Visitas_Seguimiento : "recibe visitas"
    Pasantias ||--o{ Visitas : "tiene visitas"

    Evaluaciones ||--o{ Evaluacion_Detalle : "compuesta por"
    Criterios_Evaluacion ||--o{ Evaluacion_Detalle : "evaluado con"
```

---

## 1. 🔵 Dominio: Seguridad y Acceso

Son las tablas que controlan **quién entra al sistema** y **qué puede hacer**.

```mermaid
erDiagram

    Personas {
        int persona_id PK
        string ci "Cédula (única)"
        string primer_nombre
        string primer_apellido
        string email
        string telefono
        int status "1=activo, 0=inactivo"
    }

    Usuarios {
        int usuario_id PK
        int persona_id FK
        string username
        string password_hash "Encriptado con bcrypt"
        int status
    }

    Roles {
        int rol_id PK
        string nombre "Admin, Coordinador, Tutor, Estudiante"
        string descripcion
    }

    Roles_Usuario {
        int usuario_id FK
        int rol_id FK
    }

    Permisos {
        int permiso_id PK
        string nombre "ej: ver_estudiantes, crear_periodos"
    }

    Roles_Permisos {
        int rol_id FK
        int permiso_id FK
    }

    Notificaciones {
        int notificacion_id PK
        int usuario_id FK
        string tipo "pre_enrollment, tracking, reminder..."
        string titulo
        string mensaje
        bool leida
    }

    Sesiones {
        int sesion_id PK
        int usuario_id FK
        timestamp inicio
        int status
    }

    Historial_Auth {
        int historial_id PK
        int usuario_id FK
        string accion "login, logout, fallo"
        string direccion_ip
        timestamp creado_en
    }

    Personas ||--o| Usuarios : "una persona\npuede ser usuario"
    Usuarios ||--o{ Roles_Usuario : "tiene roles"
    Roles ||--o{ Roles_Usuario : "asignado a usuarios"
    Roles ||--o{ Roles_Permisos : "tiene permisos"
    Permisos ||--o{ Roles_Permisos : "asignado a roles"
    Usuarios ||--o{ Notificaciones : "recibe"
    Usuarios ||--o{ Historial_Auth : "genera registros"
    Usuarios ||--o{ Sesiones : "inicia sesión"
```

### ¿Cómo se relacionan?

**Analogía universitaria:**
- **Personas** es el registro civil de la universidad: todas las personas que tienen relación con la institución
- **Usuarios** son los que tienen carnet para entrar al sistema digital
- **Roles** definen si sos estudiante, profesor, coordinador o admin
- **Permisos** son autorizaciones específicas: "María tiene rol Coordinadora, y como coordinadora puede ver estudiantes, crear periodos, pero no borrar backups"
- **Notificaciones** son los avisos que le llegan a cada usuario
- **Historial_Auth** registra cada vez que alguien entra o intenta entrar (como el libro de visitas de la prefectura)

> 💡 **Para la expo:** Mostrá que UNA persona puede tener varios roles (un profesor que también es tutor), y que los permisos no se asignan a cada usuario uno por uno — se asignan al ROL, y el usuario hereda los permisos de su rol.

---

## 2. 🟢 Dominio: Académico

Carreras, periodos y tipos de pasantía — la **estructura académica** de la universidad.

```mermaid
erDiagram

    Carreras {
        int carrera_id PK
        string nombre "Ingeniería de Sistemas"
        string codigo "ING-SIS (único)"
        int status
    }

    Tipos_Pasantia {
        int tipo_id PK
        string nombre "Pasantía Corta, Larga, Industrial"
        string descripcion
    }

    Carreras_TipoPasantia {
        int id PK
        int carrera_id FK
        int tipo_id FK
    }

    Periodos {
        int periodo_id PK
        string nombre "2026-I"
        date inicio
        date fin
        int status
    }

    Carreras ||--o{ Carreras_TipoPasantia : "puede tener\nvarios tipos"
    Tipos_Pasantia ||--o{ Carreras_TipoPasantia : "aplica a\nvarias carreras"
```

### ¿Cómo se relacionan?

**Analogía:** Cada carrera (Ing. Sistemas, Administración) puede tener varios tipos de pasantía (corta, larga, industrial). Es como un catálogo: cada carrera elige qué tipos de pasantía ofrece. La tabla `Carreras_TipoPasantia` es la "lista de opciones" que conecta ambas.

Los **Periodos** definen las ventanas de tiempo (2026-I, 2026-II) en las que se realizan las pasantías.

---

## 3. 🟠 Dominio: Instituciones

Las **empresas y organizaciones** donde los estudiantes hacen sus pasantías.

```mermaid
erDiagram

    Instituciones {
        int institucion_id PK
        string nombre "PDVSA, Mercantil..."
        string rif "J-12345678-0 (único)"
        string direccion
        string telefono
        string email
        int status
    }

    Representantes {
        int representante_id PK
        int institucion_id FK
        string nombre
        string cargo "Gerente de RRHH"
        string ci "Cédula (única)"
        string telefono
        string email
    }

    Instituciones ||--o{ Representantes : "tiene"
```

### ¿Cómo se relacionan?

**Analogía:** Cada institución (empresa) tiene uno o varios representantes. El representante es la persona que firma los convenios, recibe a los pasantes y coordina con la universidad. Una institución SIN representante no puede recibir pasantes.

> 💡 **Para la expo:** Preguntá "¿En sus pasantías, quién los recibía en la empresa?" — Ese es el representante. Y la empresa es la institución.

---

## 4. 🔴 Dominio: Pasantías — El Corazón del Sistema

Este es el **núcleo** de todo el sistema. Todo gira alrededor de las pasantías.

### 4.1. Estudiantes y su relación con pasantías

```mermaid
erDiagram

    Estudiantes {
        int estudiante_id PK
        int persona_id FK
        int carrera_id FK
        string cedula "Cédula (única)"
        date fecha_inscripcion
        int status "1=activo, 0=egresado"
    }

    Documentos {
        int documento_id PK
        int estudiante_id FK
        string tipo "carta_aval, curriculum, informe"
        string archivo_nombre "informe_final.pdf"
        string estado "pendiente, aprobado, rechazado"
    }

    Solicitudes {
        int solicitud_id PK
        int estudiante_id FK
        string tipo "reasignacion_tutor, cambio_institucion"
        string estado "pendiente, procesado"
        json datos_adicionales
    }

    Estudiantes ||--o{ Documentos : "sube"
    Estudiantes ||--o{ Solicitudes : "hace"
```

### 4.2. Pasantías — La tabla central

```mermaid
erDiagram

    Pasantias {
        int pasantia_id PK
        int estudiante_id FK "¿Quién?"
        int carrera_id FK "¿Qué carrera?"
        int periodo_id FK "¿Cuándo?"
        int institucion_id FK "¿Dónde?"
        int representante_id FK "¿Quién recibe?"
        int tipo_pasantia_id FK "¿Corta o larga?"
        date fecha_registro
        string estado "activa, culminada, cancelada"
    }

    Tutores {
        int tutor_id PK
        int persona_id FK
        string cedula "Cédula (única)"
        string especialidad
        int status
    }

    Pasantias_Tutor {
        int id PK
        int pasantia_id FK
        int tutor_id FK
    }

    Bitacora {
        int bitacora_id PK
        int pasantia_id FK
        int estudiante_id FK
        date fecha_actividad
        string descripcion "Actividades realizadas"
        string observaciones
    }

    Pasantias ||--o{ Pasantias_Tutor : "tiene tutores"
    Tutores ||--o{ Pasantias_Tutor : "asignado a"

    Pasantias ||--o{ Bitacora : "registra\nactividades diarias"
```

### 4.3. Evaluaciones y Visitas

```mermaid
erDiagram

    Evaluaciones {
        int evaluacion_id PK
        int pasantia_id FK
        string tipo_evaluador "tutor_empresa, tutor_academico"
        decimal puntaje_total
        int status
    }

    Criterios_Evaluacion {
        int criterio_id PK
        string nombre "Responsabilidad, Calidad de trabajo..."
        string aplica_para "tutor_empresa, tutor_academico"
        int puntaje_maximo
    }

    Evaluacion_Detalle {
        int detalle_id PK
        int evaluacion_id FK
        int criterio_id FK
        int puntaje "Del 1 al 10"
    }

    Visitas_Seguimiento {
        int visita_id PK
        int pasantia_id FK
        int tutor_id FK
        date fecha_visita
        string tipo "PRESENCIAL, VIRTUAL"
        decimal horas_trabajadas
        string actividades_realizadas
        string observaciones
        string estado "pendiente, realizada"
    }

    Visitas {
        int visita_id PK
        int pasantia_id FK
        int tutor_id FK
        date fecha_visita
        string actividad_solicitada
        string actividad_realizada
        int status
    }

    Evaluaciones ||--o{ Evaluacion_Detalle : "compuesta por\nvarios criterios"
    Criterios_Evaluacion ||--o{ Evaluacion_Detalle : "evaluado con"
    Pasantias ||--o{ Evaluaciones : "tiene"
    Pasantias ||--o{ Visitas_Seguimiento : "recibe visitas\nde seguimiento"
    Pasantias ||--o{ Visitas : "tiene visitas\nde campo"
```

### ¿Cómo se relaciona todo?

```mermaid
flowchart TB
    classDef student fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef core fill:#FFCDD2,stroke:#D32F2F,stroke-width:3px,color:#B71C1C
    classDef tutor fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#0D47A1
    classDef eval fill:#FFF3E0,stroke:#FF9800,stroke-width:2px,color:#E65100
    classDef inst fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20

    A["🧑 Estudiante<br/>cursa una carrera"] --> B["🎯 Pasantía<br/><b>TABLA CENTRAL</b>"]
    C["🏢 Institución<br/>donde trabaja"] --> B
    D["👨‍🏫 Tutor<br/>asignado"] --> B
    E["📅 Periodo<br/>en que se realiza"] --> B
    B --> F["📋 Bitácora<br/>actividades diarias"]
    B --> G["⭐ Evaluaciones<br/>notas del tutor"]
    B --> H["👁️ Visitas<br/>seguimiento"]
    B --> I["📄 Documentos<br/>informes, cartas"]
    B --> J["📨 Solicitudes<br/>reasignaciones, etc."]

    class A student
    class B core
    class D tutor
    class G,H eval
    class C inst
```

### El viaje completo de una pasantía:

```
1. Un ESTUDIANTE está cursando una CARRERA
         ↓
2. Llega el PERIODO de pasantías
         ↓
3. El estudiante busca una INSTITUCIÓN (empresa)
         ↓
4. La institución asigna un REPRESENTANTE que lo recibe
         ↓
5. Se REGISTRA la PASANTÍA (tabla central)
         ↓
6. Se asigna un TUTOR académico (pueden ser varios)
         ↓
7. Durante la pasantía:
   ├── El estudiante registra BITÁCORA (actividades diarias)
   ├── El tutor hace VISITAS de seguimiento
   ├── Se suben DOCUMENTOS (informes, cartas)
   └── El estudiante puede hacer SOLICITUDES (cambios)
         ↓
8. Al finalizar: EVALUACIÓN
   ├── Evalúa el tutor de la empresa
   ├── Evalúa el tutor académico
   └── Cada evaluación tiene CRITERIOS con puntajes
         ↓
9. La pasantía se MARCA como culminada ✅
```

> 💡 **Para la expo:** Este flujo es perfecto para contarlo como una historia. El público sigue naturalmente: estudiante → busca empresa → hace pasantía → lo evalúan. Es la vida real de cualquier pasante universitario.

---

## 5. 📋 Tablas de Soporte (Sistema y Configuración)

Además de las tablas principales, el sistema tiene tablas de **soporte técnico**:

| Tabla | ¿Qué guarda? | Analogía |
|-------|-------------|----------|
| `t_config` | Configuración general del sistema | El manual de normas de la universidad |
| `t_academic_config` | Días de gracia, validaciones de periodo | El calendario académico |
| `t_landing_config` | Contenido de la página principal (landing) | La cartelera de la entrada |
| `t_backups` | Historial de respaldos de la base de datos | Las copias de seguridad del archivo |
| `t_list` / `t_value_list` | Listas desplegables (tipos, categorías) | Los formularios con opciones pre-cargadas |
| `t_change_log` | Registro de cambios en datos importantes | El libro de actas: quién cambió qué y cuándo |
| `t_chat_sessions` | Conversaciones del asistente IA | El historial del chatbot |
| `t_prospect_lists` / `t_prospect_list_items` | Listas de prospectos (postulantes) | La lista de aspirantes a ingresar |
| `t_system_institution` | Datos de la universidad (UNEFA) | La información institucional |

---

## 🎯 Resumen: El Sistema en 3 Tablas Clave

Si tenés que explicar el modelo de datos en 3 minutos, mostrá estas 3 tablas:

```mermaid
flowchart TB
    classDef persons fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1
    classDef practices fill:#FFCDD2,stroke:#D32F2F,stroke-width:3px,color:#B71C1C
    classDef users fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#0D47A1

    A["👤 PERSONAS<br/><b>Registro civil digital</b><br/>Todos: estudiantes, tutores,<br/>coordinadores, admins"]
    B["🎯 PASANTÍAS<br/><b>El corazón del sistema</b><br/>Conecta estudiante + empresa<br/>+ tutor + periodo + evaluación"]
    C["🗄️ USUARIOS + ROLES<br/><b>¿Quién entra y qué hace?</b><br/>Seguridad y permisos<br/>Carnet digital + roles"]

    A --> B
    A --> C

    class A persons
    class B practices
    class C users
```

---

> **📝 Nota:** Los nombres de tablas reales usan el prefijo `t_` y mayúsculas (ej: `t_professional_practices`). Acá se simplificaron para hacerlos más legibles. El sistema tiene 69 tablas en total; este documento cubre las ~25 entidades principales.
