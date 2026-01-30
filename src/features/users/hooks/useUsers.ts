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

/**
 * Hook para gestionar el estado y las acciones de los usuarios.
 * 
 * @returns Objeto con el estado de los usuarios y funciones de gestión.
 */
export const useUsers = (filters: any = {}, activeTab: "Activos" | "Inactivos" = "Activos", page: number = 1, limit: number = 10) => {
    const [users, setUsers] = useState<User[]>([]);
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [loadingAction, setLoadingAction] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const { addToast } = useToast();

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
            
            // Adaptación para la estructura específica de la API de usuarios
            setUsers(response.data.users || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalItems(response.data.totalCount || response.data.totalItems || 0);
            
            setStatus("success");
            setError(null);
        } catch (err: any) {
            console.error("[useUsers] Error al cargar usuarios:", err);
            setStatus("error");
            setError(err instanceof Error ? err : new Error("Error desconocido"));
            addToast({
                variant: "error",
                title: "Error de carga",
                message: "No se pudieron cargar los usuarios del sistema."
            });
        }
    }, [filters.role, filters.name, filters.surname, filters.ci, activeTab, page, limit, addToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    /**
     * Crea un nuevo usuario.
     */
    const addUser = async (payload: CreateUserPayload) => {
        setLoadingAction(true);
        try {
            await userService.create(payload);
            addToast({
                variant: "success",
                title: "Usuario creado",
                message: "El nuevo usuario ha sido registrado y se ha enviado la notificación por correo con sus credenciales."
            });
            await fetchUsers();
        } catch (err) {
            console.error("[useUsers] Error al crear usuario:", err);
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    /**
     * Actualiza un usuario existente.
     */
    const editUser = async (payload: UpdateUserPayload) => {
        setLoadingAction(true);
        try {
            // Adaptación para la API de actualización de usuarios
            const { id, ...data } = payload;
            await apiClient.put(`/users/${id}`, data);
            
            addToast({
                variant: "success",
                title: "Usuario actualizado",
                message: "El usuario ha sido actualizado correctamente."
            });
            await fetchUsers();
        } catch (err) {
            console.error("[useUsers] Error al actualizar usuario:", err);
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    /**
     * Cambia el estado de un usuario.
     */
    const toggleUserStatus = async (user: User) => {
        setLoadingAction(true);
        try {
            const newStatus = user.status === 1 ? 0 : 1;
            await apiClient.put(`/users/${user.id}`, { status: newStatus });
            
            addToast({
                variant: "success",
                title: `Usuario ${newStatus === 1 ? "activado" : "desactivado"}`,
                message: `Se ha cambiado el estado de ${user.name} correctamente.`
            });
            await fetchUsers();
        } catch (err) {
            console.error("[useUsers] Error al cambiar estado de usuario:", err);
            addToast({
                variant: "error",
                title: "Error de estado",
                message: "No se pudo cambiar el estado del usuario."
            });
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    /**
     * Realiza una acción masiva de cambio de estado.
     */
    const bulkToggleStatus = async (ids: number[], newStatus: number) => {
        setLoadingAction(true);
        try {
            await Promise.all(ids.map(id => apiClient.put(`/users/${id}`, { status: newStatus })));
            addToast({
                variant: "success",
                title: "Acción completada",
                message: `Se han ${newStatus === 1 ? "activado" : "desactivado"} los usuarios seleccionados.`
            });
            await fetchUsers();
        } catch (err) {
            console.error("[useUsers] Error en acción masiva:", err);
            addToast({
                variant: "error",
                title: "Error",
                message: "No se pudieron procesar algunos usuarios."
            });
            throw err;
        } finally {
            setLoadingAction(false);
        }
    };

    return {
        users,
        status,
        loadingAction,
        error,
        totalPages,
        totalItems,
        addUser,
        editUser,
        toggleUserStatus,
        bulkToggleStatus,
        refresh: fetchUsers
    };
};
