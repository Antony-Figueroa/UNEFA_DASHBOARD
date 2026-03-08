/**
 * @file RecordAutocompleteGuide.md
 * @description Guía de implementación para autocompletado de registros existentes.
 * 
 * Esta guía muestra cómo implementar la funcionalidad de autocompletado
 * en cualquier modal del proyecto usando los hooks proporcionados.
 * 
 * ## Pasos de Implementación
 * 
 * ### 1. Agregar función de lookup al servicio
 * 
 * En el archivo de servicio del módulo (ej: institutionsService.tsx):
 * 
 * ```typescript
 * // Ya existe en institutionsService.tsx
 * export const getInstitutionByRif = async (rif: string): Promise<Institution | null> => {
 *   try {
 *     const response = await apiClient.get(`${API_URL}/by-rif/${rif}`);
 *     return response.data?.data || null;
 *   } catch (error) {
 *     console.error("[institutionsService] Error:", error);
 *     return null;
 *   }
 * };
 * ```
 * 
 * ### 2. Importar hook y componente de alerta
 * 
 * ```tsx
 * import { useRecordAutocomplete } from "../../../hooks/useRecordAutocomplete";
 * import ExistingRecordAlert from "../../../components/common/ExistingRecordAlert";
 * ```
 * 
 * ### 3. Usar el hook en el modal
 * 
 * ```tsx
 * // Dentro del componente del modal
 * const { 
 *   record: existingInstitution, 
 *   isSearching: isCheckingRif,
 *   isReadOnly: viewOnlyMode,
 *   search: searchByRif,
 *   enableEdit: enableEditMode,
 *   reset: clearExistingRecord 
 * } = useRecordAutocomplete<Institution>({
 *   resourceName: 'Institución',
 *   lookupFn: getInstitutionByRif,
 *   minKeyLength: 10, // RIF mínimo
 * });
 * ```
 * 
 * ### 4. Agregar estado de formateo de RIF
 * 
 * ```tsx
 * const [displayRif, setDisplayRif] = useState("");
 * 
 * const handleRifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const input = e.target.value.toUpperCase().replace(/[^JEVG0-9-]/g, '');
 *   setDisplayRif(formatRifDisplay(input));
 *   setValue("rif", input.replace(/-/g, ''), { shouldValidate: true });
 * };
 * ```
 * 
 * ### 5. Implementar búsqueda en onBlur del campo RIF
 * 
 * ```tsx
 * onBlur={async (e) => {
 *   if (!existingInstitution && !editingInstitution) {
 *     const value = e.target.value.replace(/[^0-9]/g, '');
 *     if (value.length >= 10) {
 *       await searchByRif(value);
 *     }
 *   }
 *   register("rif").onBlur(e);
 * }}
 * ```
 * 
 * ### 6. Mostrar alerta de registro existente
 * 
 * ```tsx
 * {existingInstitution && (
 *   <ExistingRecordAlert
 *     resourceName="Institución"
 *     isLoading={isCheckingRif}
 *     isViewOnlyMode={viewOnlyMode}
 *     onEnableEdit={enableEditMode}
 *     onClear={clearExistingRecord}
 *   />
 * )}
 * ```
 * 
 * ### 7. Aplicar disabled a campos según modo
 * 
 * ```tsx
 * <Input
 *   {...register("name")}
 *   disabled={!!existingInstitution}
 *   // ...demas props
 * />
 * ```
 * 
 * ### 8. Mostrar botón de edición según estado
 * 
 * ```tsx
 * {existingInstitution ? (
 *   viewOnlyMode ? (
 *     <AsyncButton onClick={enableEditMode}>
 *       Habilitar Edición
 *     </AsyncButton>
 *   ) : (
 *     <AsyncButton type="submit" form="institution-form">
 *       Guardar Cambios
 *     </AsyncButton>
 *   )
 * ) : (
 *   <AsyncButton type="submit" form="institution-form">
 *     Registrar Institución
 *   </AsyncButton>
 * )}
 * ```
 * 
 * ### 9. Limpiar al cerrar modal
 * 
 * ```tsx
 * const handleClose = () => {
 *   clearExistingRecord();
 *   onClose();
 * };
 * ```
 * 
 * ## Ejemplo Completo
 * 
 * Ver archivo: `src/features/institutions/components/InstitutionModal.tsx`
 * 
 * ## Hooks Disponibles
 * 
 * | Hook | Uso |
 * |------|-----|
 * | `useRecordAutocomplete` | Hook simplificado para autocomplete |
 * | `useExistingRecordLookup` | Hook más configurable con más opciones |
 * 
 * ## Componentes Disponibles
 * 
 * | Componente | Descripción |
 * |------------|-------------|
 * | `ExistingRecordAlert` | Alerta reutilizable con botón de edición |
 * 
 * ## Patrones por Módulo
 * 
 * | Módulo | Campo PK | Longitud Mínima |
 * |--------|----------|-----------------|
 * | Estudiantes | Cédula (V-12345678) | 6 |
 * | Tutores | Cédula (V-12345678) | 6 |
 * | Instituciones | RIF (J-12345678-9) | 10 |
 * | Carreras | Código (SIS) | 2 |
 * | Usuarios | Email | 5 |
 */
