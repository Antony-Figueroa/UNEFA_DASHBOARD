# 🗄️ Modelo Entidad-Relación — UNEFA Dashboard

> **Diagrama de clases UML** del modelo de datos
> Nombres reales de tablas (`t_*`) y columnas, tipos PostgreSQL, relaciones explícitas con FK.

---

## 1. Diagrama General (Vista de Alto Nivel)

```mermaid
classDiagram
    class t_persons {
        <<table>>
    }
    class t_user {
        <<table>>
    }
    class t_students {
        <<table>>
    }
    class t_tutors {
        <<table>>
    }
    class t_career {
        <<table>>
    }
    class t_internship_type {
        <<table>>
    }
    class t_internships_period {
        <<table>>
    }
    class t_institution {
        <<table>>
    }
    class t_institution_manager {
        <<table>>
    }
    class t_professional_practices {
        <<table>>
    }
    class t_evaluation {
        <<table>>
    }
    class t_evaluation_criteria {
        <<table>>
    }
    class t_evaluation_detail {
        <<table>>
    }
    class t_practice_visits {
        <<table>>
    }
    class t_activity_logs {
        <<table>>
    }
    class t_notifications {
        <<table>>
    }

    t_persons "1" --> "0..1" t_user : person_id
    t_persons "1" --> "0..1" t_students : person_id
    t_persons "1" --> "0..1" t_tutors : person_id
    t_career "1" --> "0..*" t_students : CAREER_ID
    t_career "1" --> "0..*" t_professional_practices : CAREER_ID
    t_internships_period "1" --> "0..*" t_professional_practices : PERIOD_ID
    t_internship_type "1" --> "0..*" t_professional_practices : INTERNSHIP_TYPE_ID
    t_institution "1" --> "0..*" t_professional_practices : INSTITUTION_ID
    t_institution "1" --> "0..*" t_institution_manager : INSTITUTION_ID
    t_institution_manager "1" --> "0..*" t_professional_practices : MANAGER_ID
    t_students "1" --> "0..*" t_professional_practices : STUDENTS_ID
    t_professional_practices "1" --> "0..*" t_evaluation : PROFESSIONAL_PRACTICE_ID
    t_professional_practices "1" --> "0..*" t_practice_visits : PROFESSIONAL_PRACTICE_ID
    t_professional_practices "1" --> "0..*" t_activity_logs : PROFESSIONAL_PRACTICE_ID
    t_evaluation "1" --> "0..*" t_evaluation_detail : EVALUATION_ID
    t_evaluation_criteria "1" --> "0..*" t_evaluation_detail : CRITERIA_ID
    t_user "1" --> "0..*" t_notifications : USER_ID
    t_user "1" --> "0..*" t_evaluation : REGISTERED_BY
```

---

## 2. 🔵 Dominio: Personas, Usuarios y Seguridad

### 2.1. t_persons — Registro Unificado de Personas

Tabla base: toda persona física en el sistema (estudiantes, tutores, usuarios, representantes).

```mermaid
classDiagram
    class t_persons {
        <<table>>
        +int person_id PK
        +string ci
        +string first_name
        +string last_name
        +string email
        +string phone
        +int status
        +timestamp created_at
        +timestamp updated_at
        +int version
    }
```

### 2.2. t_user — Usuarios del Sistema

```mermaid
classDiagram
    class t_user {
        <<table>>
        +int USER_ID PK
        +int person_id FK "→ t_persons.person_id"
        +string USER_CI UK
        +string NAME
        +string SURNAME
        +string EMAIL
        +string PASSWORD
        +int STATUS
        +timestamp CREATION_DATE
    }

    class t_roles {
        <<table>>
        +int ID_ROLS PK
        +string NAME UK
        +string DESCRIPTION
        +int STATUS
    }

    class t_user_roles {
        <<table>>
        +int ID_USER PK, FK "→ t_user.USER_ID"
        +int ID_ROLES PK, FK "→ t_roles.ID_ROLS"
    }

    class t_permissions {
        <<table>>
        +int PERMISSIONS_ID PK
        +string NAME UK
        +string DESCRIPTION
        +int STATUS
    }

    class t_roles_permissions {
        <<table>>
        +int ROLES_ID PK, FK "→ t_roles.ID_ROLS"
        +int PERMISSIONS_ID PK, FK "→ t_permissions.PERMISSIONS_ID"
    }

    t_user "1" --> "0..1" t_persons : person_id
    t_user "1" --> "0..*" t_user_roles : USER_ID
    t_roles "1" --> "0..*" t_user_roles : ID_ROLS
    t_roles "1" --> "0..*" t_roles_permissions : ID_ROLS
    t_permissions "1" --> "0..*" t_roles_permissions : PERMISSIONS_ID
```

### 2.3. Sesiones, Autenticación y Notificaciones

```mermaid
classDiagram
    class t_session {
        <<table>>
        +int SESSION_ID PK
        +int USER_ID PK, FK "→ t_user.USER_ID"
        +timestamp LOGIN_TIME
        +int STATUS
    }

    class t_session_history {
        <<table>>
        +int SESSION_HISTORY_ID PK
        +int SESSION_ID PK, FK "→ t_session.SESSION_ID"
        +int USER_ID PK, FK "→ t_session.USER_ID"
        +timestamp LOGIN_TIME
        +timestamp LOGOUT_TIME
        +int STATUS
    }

    class t_session_attempts {
        <<table>>
        +int ATTEMPT_ID PK
        +int USER_ID PK, FK "→ t_user.USER_ID"
        +timestamp ATTEMPT_TIME
        +int ACTION "1=login, 2=logout, 3=failed"
        +int STATUS
    }

    class t_auth_log {
        <<table>>
        +int ID PK
        +int USER_ID FK "→ t_user.USER_ID"
        +string USER_CI
        +string ACTION
        +string IP_ADDRESS
        +text USER_AGENT
        +text DETAILS
        +timestamptz CREATED_AT
    }

    class t_recovery_tokens {
        <<table>>
        +int TOKEN_ID PK
        +int USER_ID FK "→ t_user.USER_ID"
        +string TOKEN
        +timestamp EXPIRATION_DATE
        +int STATUS
    }

    class t_password_history {
        <<table>>
        +int HISTORY_ID PK
        +int USER_ID FK "→ t_user.USER_ID"
        +text KEY "password hash"
        +timestamp CREATION_DATE
    }

    class t_notifications {
        <<table>>
        +int NOTIFICATION_ID PK
        +int USER_ID FK "→ t_user.USER_ID"
        +varchar TYPE
        +varchar TITLE
        +text MESSAGE
        +bool READ
        +timestamp READ_AT
        +jsonb DATA
        +timestamp CREATED_AT
    }

    class t_user_theme {
        <<table>>
        +int USER_THEME_ID PK
        +int USER_ID FK, UK "→ t_user.USER_ID"
        +varchar BRAND_COLOR
        +timestamp CREATION_DATE
        +int STATUS
    }

    t_user "1" --> "0..*" t_session : USER_ID
    t_session "1" --> "0..*" t_session_history : SESSION_ID + USER_ID
    t_user "1" --> "0..*" t_session_attempts : USER_ID
    t_user "1" --> "0..*" t_auth_log : USER_ID
    t_user "1" --> "0..*" t_recovery_tokens : USER_ID
    t_user "1" --> "0..*" t_password_history : USER_ID
    t_user "1" --> "0..*" t_notifications : USER_ID
    t_user "1" --> "0..1" t_user_theme : USER_ID
```

### 2.4. Preguntas de Seguridad

```mermaid
classDiagram
    class t_preset_questions {
        <<table>>
        +int PRESET_QUESTION_ID PK
        +string QUESTION_TEXT
        +int STATUS
    }

    class t_user_questions {
        <<table>>
        +int USER_QUESTION_ID PK
        +int USER_ID FK "→ t_user.USER_ID"
        +varchar QUESTION_TYPE "'PRESET' | 'CUSTOM'"
        +int PRESET_QUESTION_ID FK "→ t_preset_questions.PRESET_QUESTION_ID"
        +varchar CUSTOM_QUESTION
        +varchar ANSWER
        +smallint ORDER_NUM
        +timestamp CREATED_AT
        +int STATUS
    }

    class t_security_questions {
        <<table>>
        +int SECURITY_QUESTIONS_ID PK
        +int USER_ID FK "→ t_user.USER_ID"
        +int PRESET_QUESTION_ID FK "→ t_preset_questions.PRESET_QUESTION_ID"
        +text ANSWER
        +text CUSTOM_QUESTION
    }

    t_user "1" --> "0..*" t_user_questions : USER_ID
    t_user "1" --> "0..*" t_security_questions : USER_ID
    t_preset_questions "1" --> "0..*" t_user_questions : PRESET_QUESTION_ID
    t_preset_questions "1" --> "0..*" t_security_questions : PRESET_QUESTION_ID
```

---

## 3. 🟢 Dominio: Académico

```mermaid
classDiagram
    class t_career {
        <<table>>
        +int CAREER_ID PK
        +string CAREER_NAME
        +string CAREER_CODE UK
        +int STATUS
    }

    class t_internship_type {
        <<table>>
        +int INTERNSHIP_TYPE_ID PK
        +string NAME
        +string DESCRIPTION
        +int STATUS
    }

    class t_career_internship_type {
        <<table>>
        +int ID_CAREER_INTERNSHIP_TYPE_ID PK
        +int CAREER_ID FK "→ t_career.CAREER_ID"
        +int INTERNSHIP_TYPE_ID FK "→ t_internship_type.INTERNSHIP_TYPE_ID"
    }

    class t_internships_period {
        <<table>>
        +int PERIOD_ID PK
        +string PERIOD_NAME
        +date START_DATE
        +date END_DATE
        +int STATUS
    }

    class t_academic_config {
        <<table>>
        +int CONFIG_ID PK
        +int GRACE_DAYS
        +int GRACE_DAYS_ENABLED
        +timestamp UPDATED_AT
        +int UPDATED_BY
    }

    t_career "1" --> "0..*" t_career_internship_type : CAREER_ID
    t_internship_type "1" --> "0..*" t_career_internship_type : INTERNSHIP_TYPE_ID
```

---

## 4. 🟠 Dominio: Instituciones

```mermaid
classDiagram
    class t_institution {
        <<table>>
        +int INSTITUTION_ID PK
        +string INSTITUTION_NAME
        +string RIF UK
        +string ADDRESS
        +string PHONE
        +string EMAIL
        +string INSTITUTION_CODE
        +int STATUS
        +timestamp CREATED_AT
    }

    class t_institution_manager {
        <<table>>
        +int MANAGER_ID PK
        +int INSTITUTION_ID FK "→ t_institution.INSTITUTION_ID"
        +string MANAGER_NAME
        +string MANAGER_CI UK
        +string MANAGER_POSITION
        +string PHONE
        +string EMAIL
        +int STATUS
    }

    class t_institution_career {
        <<table>>
        +int INSTITUTION_CAREER_ID PK
        +int INSTITUTION_ID FK "→ t_institution.INSTITUTION_ID"
        +int CAREER_ID FK "→ t_career.CAREER_ID"
    }

    class t_institution_internship_type {
        <<table>>
        +int INSTITUTION_INTERNSHIP_TYPE_ID PK
        +int INSTITUTION_ID FK "→ t_institution.INSTITUTION_ID"
        +int INTERNSHIP_TYPE_ID FK "→ t_internship_type.INTERNSHIP_TYPE_ID"
    }

    class t_institution_manager_institution {
        <<table>>
        +int INSTITUTION_MANAGER_INSTITUTION_ID PK
        +int MANAGER_ID FK "→ t_institution_manager.MANAGER_ID"
        +int INSTITUTION_ID FK "→ t_institution.INSTITUTION_ID"
    }

    class t_institution_address {
        <<table>>
        +int institution_address_id PK
        +int INSTITUTION_ID FK "→ t_institution.INSTITUTION_ID"
        +int address_id FK "→ t_address.address_id"
        +bool is_primary
    }

    t_institution "1" --> "0..*" t_institution_manager : INSTITUTION_ID
    t_institution "1" --> "0..*" t_institution_career : INSTITUTION_ID
    t_career "1" --> "0..*" t_institution_career : CAREER_ID
    t_institution "1" --> "0..*" t_institution_internship_type : INSTITUTION_ID
    t_internship_type "1" --> "0..*" t_institution_internship_type : INTERNSHIP_TYPE_ID
    t_institution_manager "1" --> "0..*" t_institution_manager_institution : MANAGER_ID
    t_institution "1" --> "0..*" t_institution_manager_institution : INSTITUTION_ID
```

---

## 5. 🔴 Dominio: Pasantías — El Corazón del Sistema

### 5.1. Estudiantes y Tutores

```mermaid
classDiagram
    class t_students {
        <<table>>
        +int STUDENTS_ID PK
        +int person_id FK "→ t_persons.person_id"
        +int CAREER_ID FK "→ t_career.CAREER_ID"
        +string STUDENTS_CI UK
        +string NAME
        +string SURNAME
        +string EMAIL
        +string PHONE
        +string ADDRESS
        +date BIRTH_DATE
        +date ENROLLMENT_DATE
        +int STATUS
        +timestamp CREATION_DATE
    }

    class t_tutors {
        <<table>>
        +int TUTOR_ID PK
        +int person_id FK "→ t_persons.person_id"
        +string TUTOR_CI UK
        +string NAME
        +string SURNAME
        +string SPECIALTY
        +string PHONE
        +string EMAIL
        +int STATUS
    }

    class t_tutor_career {
        <<table>>
        +int TUTOR_CAREER_ID PK
        +int TUTOR_ID FK "→ t_tutors.TUTOR_ID"
        +int CAREER_ID FK "→ t_career.CAREER_ID"
    }

    class t_coordinadores {
        <<table>>
        +int COORDINADOR_ID PK
        +varchar TIPO "'ACADEMICO' | 'PASANTIA'"
        +int CAREER_ID FK "→ t_career.CAREER_ID"
        +string NAME
        +string SURNAME
        +string CI
        +string CARGO
        +int STATUS
    }

    t_persons "1" --> "0..1" t_students : person_id
    t_persons "1" --> "0..1" t_tutors : person_id
    t_career "1" --> "0..*" t_students : CAREER_ID
    t_tutors "1" --> "0..*" t_tutor_career : TUTOR_ID
    t_career "1" --> "0..*" t_tutor_career : CAREER_ID
    t_career "1" --> "0..*" t_coordinadores : CAREER_ID
```

### 5.2. Tabla Central — t_professional_practices

```mermaid
classDiagram
    class t_professional_practices {
        <<table>>
        +int PROFESSIONAL_PRACTICE_ID PK
        +int STUDENTS_ID FK "→ t_students.STUDENTS_ID"
        +int CAREER_ID FK "→ t_career.CAREER_ID"
        +int PERIOD_ID FK "→ t_internships_period.PERIOD_ID"
        +int INSTITUTION_ID FK "→ t_institution.INSTITUTION_ID"
        +int MANAGER_ID FK "→ t_institution_manager.MANAGER_ID"
        +int INTERNSHIP_TYPE_ID FK "→ t_internship_type.INTERNSHIP_TYPE_ID"
        +date REGISTRATION_DATE
        +date START_DATE
        +date END_DATE
        +varchar STATUS "'active' | 'completed' | 'cancelled'"
        +timestamp CREATED_AT
        +timestamp UPDATED_AT
    }

    class t_professional_practices_tutor {
        <<table>>
        +int PROFESSIONAL_PRACTICES_TUTOR_ID PK
        +int PROFESSIONAL_PRACTICE_ID FK "→ t_professional_practices.PROFESSIONAL_PRACTICE_ID"
        +int TUTOR_ID FK "→ t_tutors.TUTOR_ID"
    }

    t_professional_practices "1" --> "0..*" t_professional_practices_tutor : PROFESSIONAL_PRACTICE_ID
    t_tutors "1" --> "0..*" t_professional_practices_tutor : TUTOR_ID
    t_students "1" --> "0..*" t_professional_practices : STUDENTS_ID
    t_career "1" --> "0..*" t_professional_practices : CAREER_ID
    t_internships_period "1" --> "0..*" t_professional_practices : PERIOD_ID
    t_institution "1" --> "0..*" t_professional_practices : INSTITUTION_ID
    t_institution_manager "1" --> "0..*" t_professional_practices : MANAGER_ID
    t_internship_type "1" --> "0..*" t_professional_practices : INTERNSHIP_TYPE_ID
```

### 5.3. Evaluaciones

```mermaid
classDiagram
    class t_evaluation {
        <<table>>
        +int EVALUATION_ID PK
        +int PROFESSIONAL_PRACTICE_ID FK "→ t_professional_practices.PROFESSIONAL_PRACTICE_ID"
        +varchar EVALUATOR_TYPE "'TUTOR_ACADEMICO' | 'TUTOR_EMPRESA'"
        +int REGISTERED_BY FK "→ t_user.USER_ID"
        +decimal TOTAL_SCORE
        +int STATUS
    }

    class t_evaluation_criteria {
        <<table>>
        +int CRITERIA_ID PK
        +string NAME
        +varchar EVALUATOR_TYPE
        +int MAX_SCORE
        +int ITEM_NUMBER
        +int STATUS
    }

    class t_evaluation_detail {
        <<table>>
        +int DETAIL_ID PK
        +int EVALUATION_ID FK "→ t_evaluation.EVALUATION_ID"
        +int CRITERIA_ID FK "→ t_evaluation_criteria.CRITERIA_ID"
        +int ITEM_NUMBER
        +decimal SCORE "CHECK 1..10"
        +int STATUS
    }

    t_professional_practices "1" --> "0..*" t_evaluation : PROFESSIONAL_PRACTICE_ID
    t_evaluation "1" --> "0..*" t_evaluation_detail : EVALUATION_ID
    t_evaluation_criteria "1" --> "0..*" t_evaluation_detail : CRITERIA_ID
    t_user "1" --> "0..*" t_evaluation : REGISTERED_BY
```

### 5.4. Visitas de Seguimiento

```mermaid
classDiagram
    class t_practice_visits {
        <<table>>
        +int VISIT_ID PK
        +int PROFESSIONAL_PRACTICE_ID FK "→ t_professional_practices.PROFESSIONAL_PRACTICE_ID"
        +int TUTOR_ID FK "→ t_tutors.TUTOR_ID"
        +timestamp VISIT_DATE
        +varchar VISIT_TYPE "'PRESENCIAL' | 'VIRTUAL'"
        +decimal HOURS_WORKED
        +text ACTIVITIES_PERFORMED
        +text OBSERVATIONS
        +text RECOMMENDATIONS
        +varchar VISIT_CASE
        +int STATUS
        +timestamp CREATED_AT
        +int CREATED_BY FK "→ t_user.USER_ID"
    }

    class t_visit {
        <<table>>
        +int VISIT_ID PK
        +int PROFESSIONAL_PRACTICE_ID FK "→ t_professional_practices.PROFESSIONAL_PRACTICE_ID"
        +int TUTOR_ID FK "→ t_tutors.TUTOR_ID"
        +date VISIT_DATE
        +varchar NOTE
        +varchar REQUESTED_ACTIVITY
        +varchar CARRIED_ACTIVITY
        +int STATUS
    }

    t_professional_practices "1" --> "0..*" t_practice_visits : PROFESSIONAL_PRACTICE_ID
    t_tutors "1" --> "0..*" t_practice_visits : TUTOR_ID
    t_professional_practices "1" --> "0..*" t_visit : PROFESSIONAL_PRACTICE_ID
    t_tutors "1" --> "0..*" t_visit : TUTOR_ID
```

### 5.5. Bitácora, Documentos y Solicitudes

```mermaid
classDiagram
    class t_activity_logs {
        <<table>>
        +int ACTIVITY_LOG_ID PK
        +int PROFESSIONAL_PRACTICE_ID FK "→ t_professional_practices.PROFESSIONAL_PRACTICE_ID"
        +int STUDENT_ID FK "→ t_students.STUDENTS_ID"
        +timestamp ACTIVITY_DATE
        +text DESCRIPTION
        +text OBSERVATIONS
        +int STATUS
        +timestamp CREATED_AT
        +int CREATED_BY "t_user.USER_ID"
    }

    class t_student_documents {
        <<table>>
        +int DOCUMENT_ID PK
        +int STUDENT_ID FK "→ t_students.STUDENTS_ID"
        +int student_person_id FK "→ t_persons.person_id"
        +varchar DOCUMENT_TYPE "'carta_aval' | 'curriculum' | 'informe' | ..."
        +varchar TITLE
        +text DESCRIPTION
        +varchar FILE_NAME
        +varchar FILE_PATH
        +int FILE_SIZE
        +varchar FILE_TYPE
        +varchar STATUS "'pending' | 'approved' | 'rejected'"
        +text REJECTION_REASON
        +timestamp UPLOADED_AT
        +timestamp REVIEWED_AT
        +int REVIEWED_BY FK "→ t_user.USER_ID"
    }

    class t_student_requests {
        <<table>>
        +int REQUEST_ID PK
        +int STUDENT_ID FK "→ t_students.STUDENTS_ID"
        +int student_person_id FK "→ t_persons.person_id"
        +int REQUEST_TYPE_ID FK "→ t_request_types.REQUEST_TYPE_ID"
        +varchar SUBJECT
        +text DESCRIPTION
        +varchar STATUS "'pending' | 'processed'"
        +text RESPONSE
        +int PROCESSED_BY
        +timestamp PROCESSED_AT
        +jsonb REASSIGNMENT_DATA
        +smallint IS_REASSIGNMENT
        +int PREVIOUS_TUTOR_ID
        +int PREVIOUS_INSTITUTION_ID
        +int PREVIOUS_CAREER_ID
        +timestamp CREATION_DATE
    }

    class t_request_types {
        <<table>>
        +int REQUEST_TYPE_ID PK
        +string NAME
        +varchar CATEGORY
        +int STATUS
    }

    t_professional_practices "1" --> "0..*" t_activity_logs : PROFESSIONAL_PRACTICE_ID
    t_students "1" --> "0..*" t_student_documents : STUDENT_ID
    t_students "1" --> "0..*" t_student_requests : STUDENT_ID
    t_request_types "1" --> "0..*" t_student_requests : REQUEST_TYPE_ID
```

---

## 6. 📋 Tablas de Soporte

```mermaid
classDiagram
    class t_config {
        <<table>>
        +int CONFIG_ID PK
        +varchar CONFIG_KEY UK
        +text CONFIG_VALUE
        +int STATUS
    }

    class t_landing_config {
        <<table>>
        +int config_id PK
        +varchar config_key UK
        +text config_value
        +varchar section
        +int sort_order
    }

    class t_backups {
        <<table>>
        +uuid id PK
        +varchar name
        +text description
        +varchar file_name
        +text[] tables
        +jsonb data
        +int created_by FK "→ t_user.USER_ID"
        +timestamptz created_at
    }

    class t_chat_sessions {
        <<table>>
        +uuid SESSION_ID PK
        +int USER_ID FK "→ t_user.USER_ID"
        +varchar TITLE
        +jsonb MESSAGES
        +timestamp CREATED_AT
        +timestamp UPDATED_AT
        +int STATUS
    }

    class t_system_institution {
        <<table>>
        +int system_institution_id PK
        +varchar legal_name
        +varchar commercial_name
        +varchar acronym
        +varchar rif
        +varchar phone
        +varchar email
        +varchar website
        +varchar logo_url
        +varchar resolution_number
        +date foundation_date
        +smallint status
    }

    class t_address {
        <<table>>
        +int address_id PK
        +int parroquia_id FK
        +varchar street_address
        +text reference
        +varchar full_address
        +uuid uuid UK
        +timestamp created_at
        +timestamp updated_at
        +int version
    }

    class t_prospect_lists {
        <<table>>
        +int LIST_ID PK
        +string NAME
        +text DESCRIPTION
        +int PERIOD_ID FK "→ t_internships_period.PERIOD_ID"
        +int STATUS
        +int CREATED_BY FK "→ t_user.USER_ID"
    }

    class t_prospect_list_items {
        <<table>>
        +int ITEM_ID PK
        +int LIST_ID FK "→ t_prospect_lists.LIST_ID"
        +int STUDENTS_ID FK "→ t_students.STUDENTS_ID"
        +bool ENROLLED
        +text NOTES
        +int ADDED_BY FK "→ t_user.USER_ID"
    }

    class t_email_templates {
        <<table>>
        +int template_id PK
        +varchar name UK
        +varchar subject
        +text body_html
        +text[] variables
        +int status
    }

    class t_knowledge_base {
        <<table>>
        +int id PK
        +text question
        +text answer
        +varchar category
        +int status
    }

    t_user "1" --> "0..*" t_backups : created_by
    t_user "1" --> "0..*" t_chat_sessions : USER_ID
    t_user "1" --> "0..*" t_prospect_lists : CREATED_BY
    t_prospect_lists "1" --> "0..*" t_prospect_list_items : LIST_ID
    t_students "1" --> "0..*" t_prospect_list_items : STUDENTS_ID
    t_internships_period "1" --> "0..*" t_prospect_lists : PERIOD_ID
```

---

## 7. 📐 Resumen de Cardinalidades

| Relación | Tipo | Significado |
|----------|------|-------------|
| `1 → 0..1` | Uno a cero/uno | Una persona PUEDE ser usuario (pero no es obligatorio) |
| `1 → 0..*` | Uno a muchos | Una carrera TIENE muchos estudiantes (puede tener 0) |
| `1 → 1..*` | Uno a muchos (obligatorio) | Una evaluación TIENE al menos un detalle |
| `* → *` | Muchos a muchos | Roles ↔ Permisos (resuelto con tabla intermedia) |

**Reglas de oro del modelo:**
1. **t_persons** es la raíz — todo el mundo es primero una persona
2. **t_professional_practices** es la tabla más conectada (8 FK salientes)
3. Las relaciones muchos-a-muchos se resuelven con tablas intermedias (ej: `t_user_roles`, `t_roles_permissions`, `t_professional_practices_tutor`)
4. Los IDs son siempre `SERIAL` (autoincrementales) salvo excepciones como `uuid` en backups y chat

---

> **📝 Nota:** Las tablas reales tienen columnas adicionales de auditoría (`MODIF_USER_ID`, `MODIF_USER_DATE`, `ELIM_USER_ID`, `ELIM_USER_DATE`, `REST_USER_ID`, `REST_USER_DATE`) que se omitieron en estos diagramas por claridad. Se incluyeron todas las columnas de negocio relevantes.
