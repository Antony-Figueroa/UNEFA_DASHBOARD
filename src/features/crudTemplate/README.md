# Plantilla CRUD Reutilizable (TailAdmin)

Esta plantilla proporciona una base reutilizable para construir vistas de gestión (CRUD) en el proyecto TailAdmin, manteniendo consistencia visual y funcional con las páginas de **Carreras** y **Periodos**.

## Componentes principales

- `CrudTable`: Tabla genérica con paginación, ordenamiento, filtros y selección múltiple.
- `CrudForm`: Formulario configurable basado en los componentes de formulario existentes.
- `CrudLayout`: Contenedor de página con meta, breadcrumb, alertas, navegación contextual y slots para gráficos.
- `CrudConfirmDialog`: Diálogo de confirmación reutilizable.
- `useCrudResource`: Hook genérico para integrar servicios CRUD (API o in-memory).

## Uso básico

15→1. Define tu tipo de entidad y un servicio que implemente `CrudService<T>`.
16→2. Usa `useCrudResource` para cargar y gestionar el estado de la colección.
17→3. Declara las columnas (`CrudColumn<T>`) y filtros (`CrudFilterConfig`) para la tabla.
18→4. Declara los campos del formulario (`CrudFieldConfig`) para crear/editar registros.
19→5. Usa `CrudLayout`, `CrudTable` y `CrudForm` dentro de una página de gestión.

21→Consulta la página de ejemplo en `src/pages/Management/CrudExample.tsx` para ver una implementación completa.
22→
23→### Ejemplo mínimo
24→
25→```tsx
26→// src/pages/Management/MyEntityPage.tsx
27→import { useState } from "react";
28→import { CrudLayout } from "../../features/crudTemplate/components/CrudLayout";
29→import { CrudTable } from "../../features/crudTemplate/components/CrudTable";
30→import { CrudForm, type CrudFieldConfig, type CrudFormValues } from "../../features/crudTemplate/components/CrudForm";
31→import { useCrudResource, type CrudService } from "../../features/crudTemplate/hooks/useCrudResource";
32→import type { CrudColumn, CrudFilterConfig } from "../../features/crudTemplate/types";
33→import { Modal, ModalHeader, ModalBody } from "../../components/ui/modal";
34→
35→interface MyEntity {
36→  id: string;
37→  name: string;
38→  code: string;
39→  active: boolean;
40→}
41→
42→const myService: CrudService<MyEntity> = {
43→  async list() {
44→    // Llama a tu API GET /my-entity
45→    return [];
46→  },
47→  async create(data) {
48→    // Llama a tu API POST /my-entity
49→    return { ...(data as Omit<MyEntity, "id">), id: crypto.randomUUID() };
50→  },
51→  async update(data) {
52→    // Llama a tu API PUT/PATCH /my-entity/:id
53→    return data;
54→  },
55→  async remove(data) {
56→    // Llama a tu API DELETE /my-entity/:id
57→    return;
58→  },
59→};
60→
61→const columns: CrudColumn<MyEntity>[] = [
62→  { id: "code", header: "Código", sortable: true, accessor: (item) => item.code },
63→  { id: "name", header: "Nombre", sortable: true, accessor: (item) => item.name },
64→];
65→
66→const filters: CrudFilterConfig[] = [
67→  { id: "search", label: "Buscar", type: "search", placeholder: "Buscar por nombre o código" },
68→];
69→
70→const formFields: CrudFieldConfig[] = [
71→  { name: "name", label: "Nombre", type: "text", required: true, minLength: 3 },
72→  { name: "code", label: "Código", type: "text", required: true },
73→  { name: "active", label: "Activo", type: "switch" },
74→];
75→
76→export default function MyEntityPage() {
77→  const [isModalOpen, setIsModalOpen] = useState(false);
78→  const [editing, setEditing] = useState<MyEntity | null>(null);
79→  const [filtersState, setFiltersState] = useState<Record<string, string | string[]>>({});
80→
81→  const { items, status, error, alert, setAlert, createItem, updateItem, removeItem } =
82→    useCrudResource<MyEntity>({ service: myService });
83→
84→  const handleSubmitForm = async (values: CrudFormValues) => {
85→    const payload: MyEntity = {
86→      id: editing?.id ?? "",
87→      name: String(values.name ?? ""),
88→      code: String(values.code ?? ""),
89→      active: Boolean(values.active),
90→    };
91→
92→    if (editing) {
93→      await updateItem(payload);
94→    } else {
95→      await createItem({ ...payload, id: "" });
96→    }
97→
98→    setIsModalOpen(false);
99→    setEditing(null);
100→  };
101→
102→  return (
103→    <>
104→      <CrudLayout
105→        title="Gestión de Entidades"
106→        breadcrumbLabel="Mi Entidad"
107→        primaryActionLabel="Nuevo registro"
108→        onPrimaryAction={() => {
109→          setEditing(null);
110→          setIsModalOpen(true);
111→        }}
112→        alert={alert}
113→        onCloseAlert={() => setAlert(null)}
114→        confirmState={null}
115→        onCloseConfirm={() => undefined}
116→      >
117→        <CrudTable
118→          items={items}
119→          columns={columns}
120→          filters={filters}
121→          filterState={filtersState}
122→          onFilterChange={setFiltersState}
123→          loading={status === "loading"}
124→          errorMessage={error?.message ?? null}
125→        />
126→      </CrudLayout>
127→
128→      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-xl" showCloseButton>
129→        <ModalHeader>{editing ? "Editar registro" : "Nuevo registro"}</ModalHeader>
130→        <ModalBody>
131→          <CrudForm
132→            fields={formFields}
133→            initialValues={
134→              editing
135→                ? { name: editing.name, code: editing.code, active: editing.active }
136→                : { active: true }
137→            }
138→            onSubmit={handleSubmitForm}
139→            secondaryActionLabel="Cancelar"
140→            onSecondaryAction={() => setIsModalOpen(false)}
141→          />
142→        </ModalBody>
143→      </Modal>
144→    </>
145→  );
146→}
147→```
148→
149→## Personalización
150→
151→- Puedes ajustar estilos mediante clases Tailwind (por ejemplo, variantes de botones, colores de fondo, etc.).
152→- Los slots `chartsSlot` y `navigationSlot` de `CrudLayout` permiten integrar gráficos (ApexCharts, etc.) y enlaces de navegación contextual.
153→- `CrudForm` soporta tipos de campo `text`, `number`, `select`, `multi-select` y `switch`, con validaciones básicas (requerido, rangos, longitudes).
154→- `CrudTable` puede configurarse con filtros dinámicos (`search`, `select`, `multi-select`) y acciones masivas (`CrudActionConfig`) que muestran un resumen de elementos seleccionados.
155→- `CrudConfirmDialog` centraliza los diálogos de confirmación para operaciones sensibles (eliminaciones, cambios de estado, etc.).
156→
157→## Pruebas
158→
159→La plantilla incluye pruebas unitarias basadas en **Vitest** (API muy similar a Jest):
160→
161→- `CrudForm`: `src/features/crudTemplate/components/__tests__/CrudForm.test.tsx`
162→- `CrudTable`: `src/features/crudTemplate/components/__tests__/CrudTable.test.tsx`
163→
164→Puedes ejecutarlas con:
165→
166→```bash
167→npm run test
168→```
169→
170→## Accesibilidad y responsividad
171→
172→- Los componentes usan etiquetas y atributos ARIA básicos (`aria-label`, `aria-sort`, `aria-invalid`, `aria-describedby`) para facilitar la navegación con lectores de pantalla.
173→- La tabla y los formularios están maquetados con **Tailwind CSS** usando utilidades responsivas (`grid`, `md:grid-cols-2`, etc.) para adaptarse a distintos tamaños de pantalla.
174→- Los modales usan el componente `Modal` compartido de TailAdmin, que bloquea el fondo y centra el contenido siguiendo buenas prácticas de accesibilidad.
