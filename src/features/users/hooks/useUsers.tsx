/**
 * @file useUsers.ts
 * @description Hook personalizado para la gestión de usuarios.
 * Proporciona acceso a los datos de usuarios y funciones para operaciones CRUD.
 */

import { useState, useCallback, useEffect } from "react";
import { User, CreateUserPayload, UpdateUserPayload } from "../types";
import { userService } from "../services/userService";
import { useToast } from "../../../context/toast";
import apiClient from "../../../api/apiClient";
import { TOAST } from "../../../components/ui/dialog/DialogConfig";
import { useCrud } from "../../../hooks/useCrud";
import { RecordDetails, ChangeComparison } from "../../../components/ui/alert/AlertContextualContent";

/**
 * Labels para las notificaciones de usuario.
 */
const USER_LABELS: Record<string, string> = {
    userCi: "Cédula",
    name: "Nombre",
    surname: "Apellido",
    email: "Correo Electrónico",
    role: "Rol",
    roleName: "Rol",
    status: "Estado"
};

/**
 * Hook para gestionar el estado y las acciones de los usuarios.
 * 
 * @returns Objeto con el estado de los usuarios y funciones de gestión.
 */
export const useUsers = (filters: any = {}, activeTab: "Activos" | "Inactivos" = "Activos", page: number = 1, limit: number = 10) => {
    const [users, setUsers] = useState<User[]>([]);
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const { addToast } = useToast();

    // Utilizamos useCrud para las acciones de mutación
    const {
        loadingAction: crudLoading,
        error: crudError,
        createItem: baseAddUser,
        updateItem: baseEditUser,
        toggleItemStatus: baseToggleStatus
    } = useCrud<User, CreateUserPayload, UpdateUserPayload>(userService as any, {
        resourceName: "Usuario",
        autoLoad: false // No cargamos automáticamente porque usamos fetchUsers personalizado
    });

    /**
     * Carga la lista de usuarios desde la API.
     */
    const fetchUsers = useCallback(async () => {
        setStatus("loading");
        try {
            const params = {
                role: filters.role,
                status: activeTab === "Activos" ? 1 : 0,
                name: filters.name,
                surname: filters.surname,
                userCi: filters.ci,
                page,
                limit
            };
            const response = await apiClient.get("/users", { params });
            
            setUsers(response.data.users || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalItems(response.data.totalCount || response.data.totalItems || 0);
            
            setStatus("success");
        } catch (err: any) {
            console.error("[useUsers] Error al cargar usuarios:", err);
            setStatus("error");
            addToast({ ...TOAST.loadError(), message: "No se pudieron cargar los usuarios del sistema." });
        }
    }, [filters.role, filters.name, filters.surname, filters.ci, activeTab, page, limit, addToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    /**
     * Crea un nuevo usuario.
     */
    const addUser = async (payload: CreateUserPayload) => {
        try {
            const newUser = await baseAddUser(payload, { silent: true });
            if (newUser) {
                addToast({
                    variant: "success",
                    title: "Usuario Registrado",
                    message: (
                        <>
                            <p>El usuario <strong>{newUser.name} {newUser.surname}</strong> ha sido registrado exitosamente.</p>
                                <RecordDetails 
                                    data={newUser as any} 
                                    labels={USER_LABELS} 
                                    fields={['userCi', 'email', 'roleName']} 
                                />
                            <p className="mt-2 text-xs">Se ha enviado una notificación por correo con sus credenciales de acceso.</p>
                        </>
                    )
                });
                await fetchUsers();
            }
        } catch (err) {
            console.error("[useUsers] Error al crear usuario:", err);
            const axiosError = err as any;
            const serverMsg = axiosError.response?.data?.message;
            addToast(serverMsg ? { ...TOAST.createError('Usuario'), message: serverMsg } : TOAST.createError('Usuario'));
            throw err;
        }
    };

    /**
     * Actualiza un usuario existente.
     */
    const editUser = async (payload: UpdateUserPayload) => {
        try {
            const oldUser = users.find(u => u.id === payload.id);
            const updatedUser = await baseEditUser(payload, { silent: true });
            if (updatedUser) {
                addToast({
                    variant: "success",
                    title: "Usuario Actualizado",
                    message: (
                        <>
                            <p>Los datos de <strong>{updatedUser.name} {updatedUser.surname}</strong> han sido actualizados exitosamente.</p>
                            {oldUser && (
                                <ChangeComparison 
                                    oldData={{ ...oldUser, roleName: oldUser.roleName ?? '' }}
                                    newData={{ ...updatedUser, roleName: updatedUser.roleName ?? '' }}
                                    labels={USER_LABELS} 
                                    excludeFields={['role', 'isInUse', 'isImported']}
                                />
                            )}
                        </>
                    )
                });
                await fetchUsers();
            }
        } catch (err) {
            console.error("[useUsers] Error al actualizar usuario:", err);
            const axiosError = err as any;
            const serverMsg = axiosError.response?.data?.message;
            addToast(serverMsg ? { ...TOAST.updateError('Usuario'), message: serverMsg } : TOAST.updateError('Usuario'));
            throw err;
        }
    };

    /**
     * Cambia el estado de un usuario.
     */
    const toggleUserStatus = async (user: User) => {
        try {
            const newStatus = user.status === 1 ? 0 : 1;
            // Adaptamos baseToggleStatus que espera boolean
            await baseToggleStatus(user.id, newStatus === 1, { silent: true });
            
            addToast({
                variant: "success",
                title: "Estado Actualizado",
                message: `El usuario ${user.name} ha sido ${newStatus === 1 ? "activado" : "desactivado"} exitosamente.`
            });
            await fetchUsers();
        } catch (err) {
            console.error("[useUsers] Error al cambiar estado de usuario:", err);
            addToast(TOAST.updateError('Usuario'));
            throw err;
        }
    };

    /**
     * Realiza una acción masiva de cambio de estado.
     */
    const bulkToggleStatus = async (ids: number[], newStatus: number) => {
        setIsBulkLoading(true);
        try {
            // Nota: userService.bulkDelete o similar podría ser usado si la API lo soporta.
            // Por ahora mantenemos la lógica de Promise.all pero con notificaciones estandarizadas.
            await Promise.all(ids.map(id => apiClient.put(`/users/${id}`, { status: newStatus })));
            
            addToast({
                variant: "success",
                title: "Acción Masiva",
                message: `Se han ${newStatus === 1 ? "activado" : "desactivado"} ${ids.length} usuarios exitosamente.`
            });
            await fetchUsers();
        } catch (err) {
            console.error("[useUsers] Error en acción masiva:", err);
            addToast({
                variant: "error",
                title: "Error Masivo",
                message: "No se pudieron procesar algunos usuarios seleccionados."
            });
            throw err;
        } finally {
            setIsBulkLoading(false);
        }
    };

    return {
        users,
        status,
        loadingAction: crudLoading || isBulkLoading,
        error: crudError,
        totalPages,
        totalItems,
        addUser,
        editUser,
        toggleUserStatus,
        bulkToggleStatus,
        refresh: fetchUsers
    };
};
