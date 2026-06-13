# Address System for Internship Assignment Management

**Date:** 2026-06-11
**Status:** Design Approved
**Version:** 1.0

## Problem

Internship (pasantía) assignments lack geographic awareness, causing:
- Students assigned to institutions far from their residence
- Tutors unable to conduct supervision visits due to physical distance
- No visibility of geographic distribution for informed decision-making

## Solution Overview

Standardized address management system using Venezuela's administrative hierarchy (Estado > Municipio > Parroquia), persisted in structured database tables, supporting multiple addresses per entity with typed classification. Address data serves as a weighted criterion in internship assignment (proximity score) and provides visibility to decision-makers.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Normalization | 3NF (only `parroquia_id` in `t_address`) | Eliminates transitive dependency, estado/municipio derivable via JOIN |
| Geolocation | NOT included | Overcomplicates without maps dependency; hierarchy grouping sufficient |
| Multiple addresses | Supported via bridge tables | N addresses per entity, each with type + primary flag |
| Address types | Universal catalog (4 types) | PRINCIPAL, DOMICILIO, RESIDENCIA_ACTUAL, SEDE_PRACTICAS |
| Blocking vs weighting | Weighted + visibility | Address informs but doesn't block; decision-maker has final say |
| PK strategy | `bigint generated always as identity` | SQL-standard, better than SERIAL (per Supabase best practices) |
| Naming convention | Lowercase snake_case | Consistent with existing `t_persons` table, avoids quoted identifier issues |
| FK indexes | Explicit on all FKs | Postgres does not auto-index FKs; required for JOIN performance |

## Database Schema

### Geographic Hierarchy (seed from `venezuela.json`)

```sql
create table t_estado (
  estado_id     int primary key,
  iso_31662     varchar(6) not null,
  name          varchar(100) not null,
  capital       varchar(100)
);

create table t_municipio (
  municipio_id  bigint generated always as identity primary key,
  estado_id     int not null references t_estado(estado_id),
  name          varchar(100) not null
);
create index t_municipio_estado_id_idx on t_municipio(estado_id);

create table t_parroquia (
  parroquia_id  bigint generated always as identity primary key,
  municipio_id  bigint not null references t_municipio(municipio_id),
  name          varchar(200) not null
);
create index t_parroquia_municipio_id_idx on t_parroquia(municipio_id);
```

### Address Type Catalog

```sql
create table t_address_type (
  address_type_id bigint generated always as identity primary key,
  code            varchar(20) not null unique,
  name            varchar(50) not null,
  description     text,
  status          smallint not null default 1
);

-- Seed data:
-- 1 | PRINCIPAL         | Dirección Principal    | Dirección primaria
-- 2 | DOMICILIO         | Domicilio              | Residencia habitual
-- 3 | RESIDENCIA_ACTUAL | Residencia Actual      | Dónde vive actualmente
-- 4 | SEDE_PRACTICAS    | Sede de Prácticas      | Lugar de pasantías
```

### Core Address Table (3NF)

```sql
create table t_address (
  address_id      bigint generated always as identity primary key,
  parroquia_id    int not null references t_parroquia(parroquia_id),
  street_address  varchar(300) not null,
  reference       text,
  created_at      timestamptz not null default now()
);
create index t_address_parroquia_id_idx on t_address(parroquia_id);
```

### Bridge Tables (N addresses per entity)

```sql
create table t_person_address (
  person_address_id bigint generated always as identity primary key,
  person_id         int not null references t_persons(person_id),
  address_id        bigint not null references t_address(address_id),
  address_type_id   bigint not null references t_address_type(address_type_id),
  is_primary        boolean not null default false,
  created_at        timestamptz not null default now()
);
create index t_person_address_person_id_idx on t_person_address(person_id);
create index t_person_address_address_id_idx on t_person_address(address_id);
create unique index t_person_address_one_primary_idx
  on t_person_address(person_id, address_type_id) where is_primary = true;

create table t_institution_address (
  institution_address_id bigint generated always as identity primary key,
  institution_id         int not null references t_institution(institution_id),
  address_id             bigint not null references t_address(address_id),
  address_type_id        bigint not null references t_address_type(address_type_id),
  is_primary             boolean not null default false,
  created_at             timestamptz not null default now()
);
create index t_institution_address_institution_id_idx on t_institution_address(institution_id);
create index t_institution_address_address_id_idx on t_institution_address(address_id);
create unique index t_institution_address_one_primary_idx
  on t_institution_address(institution_id, address_type_id) where is_primary = true;
```

### Convenience View

```sql
create view v_address_full with (security_invoker = true) as
select
  a.address_id,
  a.street_address,
  a.reference,
  e.estado_id,
  e.name        as estado,
  m.municipio_id,
  m.name        as municipio,
  p.parroquia_id,
  p.name        as parroquia,
  concat(e.name, ' > ', m.name, ' > ', p.name) as full_address
from t_address a
join t_parroquia p   on p.parroquia_id  = a.parroquia_id
join t_municipio m   on m.municipio_id  = p.municipio_id
join t_estado e      on e.estado_id     = m.estado_id;
```

## Proximity Score Calculation

Used in enrollment assignment to rank institution suggestions.

```sql
-- Weights (configurable):
-- SAME_PARROQUIA  = 10
-- SAME_MUNICIPIO  = 5
-- SAME_STATE      = 3
-- DIFFERENT_STATE = 0

with student_addr as (
  select parroquia_id
  from t_person_address pa
  join t_address a on a.address_id = pa.address_id
  where pa.person_id = :person_id
    and pa.is_primary = true
)
select
  i.institution_id,
  i.institution_name,
  case
    when v.parroquia_id = sa.parroquia_id then 10
    when v.municipio_id = (
      select municipio_id from t_parroquia where parroquia_id = sa.parroquia_id
    ) then 5
    when v.estado_id = (
      select m.estado_id from t_parroquia p2
      join t_municipio m on m.municipio_id = p2.municipio_id
      where p2.parroquia_id = sa.parroquia_id
    ) then 3
    else 0
  end as proximity_score
from t_institution i
join t_institution_address ia
  on ia.institution_id = i.institution_id and ia.is_primary = true
join v_address_full v on v.address_id = ia.address_id
cross join student_addr sa
where i.status = 1
order by proximity_score desc;
```

## API Endpoints

### Address CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/address/person/:personId` | List person addresses |
| GET | `/api/address/institution/:institutionId` | List institution addresses |
| POST | `/api/address` | Create address + bridge |
| PUT | `/api/address/:id` | Update address |
| DELETE | `/api/address/:id` | Soft delete (status=0) |
| PATCH | `/api/address/:id/primary` | Toggle is_primary for type |

### Address Coincidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/address/coincidence?person_id=X&institution_id=Y` | Compare primary addresses |

**Response shape:**
```json
{
  "student_address": {
    "estado_id": 14,
    "estado": "Portuguesa",
    "municipio": "Guanare",
    "parroquia": "Córdoba",
    "street_address": "Calle 5, Edif. Don Pedro"
  },
  "institution_address": {
    "estado_id": 11,
    "estado": "Lara",
    "municipio": "Iribarren",
    "parroquia": "Barquisimeto",
    "street_address": "Av. Vargas, Torre B"
  },
  "coincidence": {
    "level": "DIFFERENT_STATE",
    "state_match": false,
    "municipality_match": false,
    "parish_match": false,
    "proximity_score": 0
  }
}
```

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/address/stats` | Geographic distribution stats |

## Frontend Architecture

### New Feature: `src/features/address/`

```
src/features/address/
├── components/
│   ├── AddressCoincidencePanel.tsx    ← Panel in EnrollmentModal
│   ├── AddressForm.tsx                 ← Form: Estado/Municipio/Parroquia + calle + ref
│   ├── AddressCard.tsx                 ← Card display for one address
│   ├── AddressList.tsx                 ← List of address cards + add button
│   └── AddressBadge.tsx                ← Type badge (colored)
├── services/
│   └── addressService.tsx              ← API client
├── hooks/
│   ├── useAddressCoincidence.tsx       ← Fetch coincidence data
│   └── useAddresses.tsx                ← CRUD for addresses
└── types/
    └── index.ts                        ← AddressInfo, CoincidenceResult, etc.
```

### Shared Components Directory

```
src/components/address/                 ← Reusable across features
├── AddressForm.tsx
├── AddressCard.tsx
├── AddressList.tsx
└── AddressBadge.tsx
```

### Integration Points

| Modal | Integration | Trigger |
|-------|-------------|---------|
| `EnrollmentModal.tsx` | `AddressCoincidencePanel` inside "Empresa / Institución" card | After institution selection |
| `InstitutionModal.tsx` | `AddressList` section | Always visible in edit mode |
| `StudentModal.tsx` | `AddressList` section | New panel |
| `TutorModal.tsx` | `AddressList` section | New panel |

## Legacy Migration

### Step 1: Persist existing free-text addresses

**t_institution.INSTITUTION_ADDRESS → t_institution_address + t_address**

Legacy format: `REGION, NUCLEUS, EXTENSION, TYPE, ESTADO, MUNICIPIO, PARROQUIA, STREET`

Parse strategy: Extract ESTADO/MUNICIPIO/PARROQUIA from positions 4-6, match by name against geographical tables, create t_address record. REGION/NUCLEUS/EXTENSION are UNEFA administrative codes, not geographic — stored separately.

**t_persons.address → t_person_address + t_address**

Free text with no structure. Parse heuristics: search for known estado/municipio/parroquia names within the text. If undetectable, default to Estado Portuguesa (institution's primary region) and mark for manual review.

### Step 2: Keep legacy columns as read-only

- `t_persons.address` — preserved, marked DEPRECATED in schema comments
- `t_institution.INSTITUTION_ADDRESS` — preserved, marked DEPRECATED
- New UI writes to new schema only

## Implementation Order

1. **Database**: Create geographical tables + seed script (venezuela.json import)
2. **Database**: Create t_address_type + seed
3. **Database**: Create t_address, t_person_address, t_institution_address, v_address_full
4. **Backend**: Address CRUD controller + routes + service
5. **Backend**: Address coincidence endpoint
6. **Backend**: Address stats endpoint
7. **Frontend**: Address types + service + hooks
8. **Frontend**: Shared components (AddressForm, AddressCard, AddressList, AddressBadge)
9. **Frontend**: AddressCoincidencePanel → integrate into EnrollmentModal
10. **Frontend**: Integrate AddressList into InstitutionModal
11. **Frontend**: Integrate AddressList into StudentModal + TutorModal
12. **Frontend**: Dashboard stats cards
13. **Migration**: Legacy data migration scripts
14. **Testing**: Backend + frontend tests

## Progress Log

### Session 2 (2026-06-11) — DB Migrations Applied & Seed Completed

**What was done:**
- Applied `create_address_system.sql` → all 7 tables created in Supabase
- Applied `create_address_functions.sql` → 3 RPC functions created (`get_primary_address`, `get_coincidence_stats`, `get_institution_suggestions`)
- Seeded geographic hierarchy from `venezuela.json` → 24 estados, 321 municipios, 1,083 parroquias
- Seeded 4 address types → PRINCIPAL, DOMICILIO, RESIDENCIA_ACTUAL, SEDE_PRACTICAS

**Issues encountered & resolved:**
1. **Column case mismatch**: Existing DB tables (`t_institution`, `t_professional_practices`, etc.) use quoted uppercase columns (`"INSTITUTION_ID"`). Added double quotes to all FK references and RPC function column references.
2. **`execute_sql` RPC limitation**: The function commits each call in its own transaction. Individual statement splitting failed on DDL dependency chains (t_estado→t_municipio→t_parroquia). Fixed by sending entire migration file as a single `EXECUTE` call.
3. **No Supabase CLI**: Used Node.js `tsx` runner with service_role key directly.
4. **Seed timeout**: Default 3min timeout insufficient for 1,083 parroquias across 321 municipios. Split into two runs (18 states, then 6 remaining).
5. **Type mismatch**: `t_address.parroquia_id` was `INT` referencing `t_parroquia.parroquia_id` (BIGINT). Fixed with `ALTER TABLE` after dropping/recreating `v_address_full` view.

**Next steps:**
- Test coincidence endpoint with real student/institution data
- Integrate `AddressList` into InstitutionModal, StudentModal, TutorModal
- Legacy migration scripts for existing `t_persons.address` and `INSTITUTION_ADDRESS`
- Create address management page/routing if needed

---

### Session 3 (2026-06-13) — Frontend Integration & Bug Fixes

**What was done:**
- Built `GeographicAddressFields` — inline cascading selects (estado→municipio→parroquia) for inline address entry
- Built `AddressCard`, `AddressForm`, `AddressList` — modal-based multi-address management
- Built `AddressCoincidencePanel` — geographic match display in `EnrollmentModal`
- Integrated `AddressList` + `GeographicAddressFields` into `InstitutionModal`, `StudentModal`, `TutorModal`
- Removed legacy free-text address fields (`estado`/`municipio`/`parroquia`/`direccion`) from `InstitutionModal`
- Made student address optional in zod schema
- Created `GeographicAddressFields` as reusable controlled component (value/onChange pattern)
- Legacy migration script: 47 addresses converted (8 institutions, 39 persons). 21 persons with junk data skipped. Idempotent with dedup guard.
- Created `GET /api/address/address-types` endpoint (replaces hardcoded type options)
- Backend CRUD endpoints (+ coincidence, suggestions, stats, geo-options)
- Frontend `useAddresses` hook (CRUD with auto-refetch) + `useAddressCoincidence` hook

**Bugs fixed this session:**
1. **Snake_case/camelCase mismatch (read path)**: Supabase returns `address_type` but frontend types use `addressType`. Added `camelizeKeys` transform in both `useAddresses` and `useAddressCoincidence` hooks.
2. **Nested geography not flattened**: Supabase query returns nested `parroquia:municipio:estado` objects but `Address` interface expects flat strings. Added `flattenAddress` to unwrap hierarchy.
3. **Snake_case/camelCase mismatch (write path)**: `addressService` sent camelCase JSON body but backend expects snake_case. Added `snakeify` transform in service.
4. **SSE CORS blocked**: `EventSource` for notifications blocked by CORS middleware (can't send custom headers). Moved SSE route before `app.use(cors(...))` in `app.ts`.
5. **Address type undefined crash**: Fixed by `camelizeKeys` + null guard in `AddressCard` (`addressType?.name ?? 'Sin tipo'`).
6. **Missing key prop**: `institutionAddressId` was `undefined` for person data. Fixed by `getAddrId(addr, entityType)` helper in `AddressList`.
7. **`setPrimary` silently no-op**: Passed `addressTypeId: 0` (invalid). Fixed by accepting `addressTypeId` from caller and passing real value.
8. **Hard delete orphans**: `deleteAddress` only deleted bridge row, leaving orphaned `t_address` rows. Added cleanup check — deletes `t_address` if no bridges reference it.
9. **`addressTypeId` not updateable**: `updateAddress` only allowed `parroquia_id/street_address/reference`. Added `address_type_id` support in controller + frontend payload.

**Issues remaining:**
- `getAddressStats` query uses implicit joins on quoted uppercase columns — may be fragile (resolved: FKs verified)
- No automated tests

**Build status:** `npm run build` + backend `tsc` — **0 errors**.

---

### Session 4 (2026-06-13) — Final Fixes & Cleanup

**What was done:**
- Fixed `AddressList` entity-type-aware ID selection: `getAddrId(addr, entityType)` helper replaces hardcoded `institutionAddressId` for all callbacks (key, delete, edit, setPrimary)
- Fixed `useAddresses` state type: `AddressRow` union type (`InstitutionAddress | PersonAddress`) instead of `InstitutionAddress[]` — prevents type lying
- Added orphan cleanup on `deleteAddress`: after deleting bridge row, checks if any other bridge references `t_address` — if none, deletes from `t_address`
- Added `addressTypeId` to `updateAddress` controller + frontend payload: users can now change address type after creation
- Verified `getAddressStats` query: FKs exist, columns correct, query not fragile — no fix needed
- Verified `get_coincidence_stats` RPC: properly defined with quoted uppercase column references
- Built `AddressBadge.tsx` — reusable colored badge per type code (PRINCIPAL=yellow, DOMICILIO=blue, RESIDENCIA_ACTUAL=purple, SEDE_PRACTICAS=green). Integrated into `AddressCard` replacing inline `<span>`

**Build status:** `npm run build` + backend `tsc` — **0 errors**.

**Remaining (non-blocking, polish):**
- Automated tests

---

## Testing Strategy

### Backend

- Unit test address controller CRUD operations
- Test coincidence endpoint with known fixture data (verify proximity score)
- Edge cases: person with no address, institution with no address, multiple addresses
- Verify soft delete behavior

### Frontend

- `AddressCoincidencePanel`: render with match, no match, loading, error states
- `AddressForm`: validation, cascading dropdown, submit
- `AddressList`: add, edit, delete, change primary
- Integration: verify panel renders inside EnrollmentModal on institution select
