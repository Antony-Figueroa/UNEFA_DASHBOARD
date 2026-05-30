import { dbManager } from '../lib/db-manager.js';

export interface Permission {
  PERMISSIONS_ID: number;
  NAME: string;
  MODULE: string | null;
  DESCRIPTION: string | null;
}

export interface RolePermission {
  ID_ROLES: number;
  PERMISSIONS_ID: number;
}

class PermissionService {
  
  /**
   * Obtiene todos los permisos de un rol
   */
  async getPermissionsByRole(roleId: number): Promise<string[]> {
    return await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_roles_permissions')
        .select(`
          PERMISSIONS_ID,
          t_permissions ( NAME )
        `)
        .eq('ROLES_ID', roleId);

      if (error) {
        console.error('[PermissionService] Error getting permissions:', error);
        return [];
      }

      return (data || [])
        .map((item: any) => {
          // Supabase: { t_permissions: { NAME: 'students:view' } }
          // PGlite:   { t_permissions_NAME: 'students:view' }
          return item.t_permissions?.NAME ?? item.t_permissions_NAME ?? null;
        })
        .filter(Boolean) as string[];
    });
  }

  /**
   * Verifica si un rol tiene un permiso específico
   */
  async hasPermission(roleId: number, permission: string): Promise<boolean> {
    const permissions = await this.getPermissionsByRole(roleId);
    return permissions.includes(permission);
  }

  /**
   * Verifica múltiples permisos (cualquiera de ellos)
   */
  async hasAnyPermission(roleId: number, permissions: string[]): Promise<boolean> {
    const rolePermissions = await this.getPermissionsByRole(roleId);
    return permissions.some(p => rolePermissions.includes(p));
  }

  /**
   * Verifica múltiples permisos (todos ellos)
   */
  async hasAllPermissions(roleId: number, permissions: string[]): Promise<boolean> {
    const rolePermissions = await this.getPermissionsByRole(roleId);
    return permissions.every(p => rolePermissions.includes(p));
  }

  /**
   * Obtiene todos los permisos del sistema
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_permissions')
        .select('*')
        .eq('STATUS', 1)
        .order('NAME');

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Obtiene todos los permisos agrupados por módulo
   */
  async getPermissionsGrouped(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions();
    
    const grouped: Record<string, Permission[]> = {};
    
    for (const perm of permissions) {
      const module = perm.MODULE || perm.NAME.split(':')[0] || 'General';
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(perm);
    }
    
    return grouped;
  }

  /**
   * Obtiene permisos de un rol
   */
  async getRolePermissions(roleId: number): Promise<number[]> {
    return await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_roles_permissions')
        .select('PERMISSIONS_ID')
        .eq('ROLES_ID', roleId);

      if (error) throw error;
      return (data || []).map((item: any) => item.PERMISSIONS_ID);
    });
  }

  /**
   * Actualiza permisos de un rol
   */
  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await dbManager.withRetry(async (supabase) => {
      // Eliminar permisos actuales
      await supabase
        .from('t_roles_permissions')
        .delete()
        .eq('ROLES_ID', roleId);

      // Insertar nuevos permisos
      if (permissionIds.length > 0) {
        const inserts = permissionIds.map(permId => ({
          ROLES_ID: roleId,
          PERMISSIONS_ID: permId
        }));

        await supabase
          .from('t_roles_permissions')
          .insert(inserts);
      }
    });
  }

  /**
   * Crea un nuevo permiso
   */
  async createPermission(name: string, description: string): Promise<Permission> {
    return await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_permissions')
        .insert({
          NAME: name,
          DESCRIPTION: description,
          MODIF_USER_ID: 1,
          MODIF_USER_DATE: new Date().toISOString(),
          ELIM_USER_ID: 0,
          ELIM_USER_DATE: new Date().toISOString(),
          REST_USER_ID: 0,
          REST_USER_DATE: new Date().toISOString(),
          STATUS: 1
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Elimina un permiso
   */
  async deletePermission(permissionId: number): Promise<void> {
    await dbManager.withRetry(async (supabase) => {
      // Primero eliminar asignaciones
      await supabase
        .from('t_roles_permissions')
        .delete()
        .eq('PERMISSIONS_ID', permissionId);

      // Luego eliminar el permiso
      await supabase
        .from('t_permissions')
        .delete()
        .eq('PERMISSIONS_ID', permissionId);
    });
  }
}

export const permissionService = new PermissionService();
