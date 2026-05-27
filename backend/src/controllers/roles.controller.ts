import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { permissionService } from '../services/permission.service.js';

export interface RoleResponse {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  status: 'active' | 'inactive';
  isSystem: boolean;
}

/**
 * Obtiene los nombres de permisos de un rol desde la DB
 */
const getRolePermissionNames = async (roleId: number): Promise<string[]> => {
  return await permissionService.getPermissionsByRole(roleId);
};

/**
 * Obtiene todos los roles con sus permisos reales desde la DB
 */
export const getRoles = async (_req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const { data: rolesData, error: rolesError } = await supabase
      .from('t_roles')
      .select('ID_ROLS, NAME, DESCRIPTION, STATUS, IS_SYSTEM');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      res.status(500).json({ message: 'Error al obtener roles' });
      return;
    }

    const { data: usersData } = await supabase
      .from('t_user_roles')
      .select('ID_ROLES');

    const userCountMap = new Map<number, number>();
    (usersData || []).forEach((u: { ID_ROLES: number }) => {
      userCountMap.set(u.ID_ROLES, (userCountMap.get(u.ID_ROLES) || 0) + 1);
    });

    // Obtener permisos de cada rol desde DB
    const roles: RoleResponse[] = await Promise.all(
      (rolesData || [])
        .filter((r: { STATUS: number }) => r.STATUS === 1)
        .map(async (r: { ID_ROLS: number; NAME: string; DESCRIPTION: string | null; STATUS: number; IS_SYSTEM: boolean | null }) => {
          const permissions = await getRolePermissionNames(r.ID_ROLS);
          return {
            id: r.ID_ROLS,
            name: r.NAME,
            description: r.DESCRIPTION || '',
            userCount: userCountMap.get(r.ID_ROLS) || 0,
            permissions,
            status: r.STATUS === 1 ? 'active' : 'inactive',
            isSystem: r.IS_SYSTEM === true
          };
        })
    );

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Get Roles Error:', error);
    res.status(500).json({ message: 'Error al obtener roles', error });
  }
};

/**
 * Obtiene el catálogo de permisos desde la DB
 */
export const getPermissions = async (_req: Request, res: Response) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    const grouped = await permissionService.getPermissionsGrouped();
    const modules = Object.keys(grouped);

    res.json({
      success: true,
      data: permissions,
      modules
    });

  } catch (error) {
    console.error('Get Permissions Error:', error);
    res.status(500).json({ message: 'Error al obtener permisos', error });
  }
};

/**
 * Obtiene un rol por ID con sus permisos reales desde la DB
 */
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { id } = req.params;

    const { data: roleData, error } = await supabase
      .from('t_roles')
      .select('ID_ROLS, NAME, DESCRIPTION, STATUS, IS_SYSTEM')
      .eq('ID_ROLS', id)
      .single();

    if (error || !roleData) {
      res.status(404).json({ message: 'Rol no encontrado' });
      return;
    }

    const { data: usersData } = await supabase
      .from('t_user_roles')
      .select('ID_USER')
      .eq('ID_ROLES', id);

    const permissions = await getRolePermissionNames(roleData.ID_ROLS);

    const role: RoleResponse = {
      id: roleData.ID_ROLS,
      name: roleData.NAME,
      description: roleData.DESCRIPTION || '',
      userCount: usersData?.length || 0,
      permissions,
      status: roleData.STATUS === 1 ? 'active' : 'inactive',
      isSystem: roleData.IS_SYSTEM === true
    };

    res.json({
      success: true,
      data: role
    });

  } catch (error) {
    console.error('Get Role Error:', error);
    res.status(500).json({ message: 'Error al obtener rol', error });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { id } = req.params;
    const { name, description } = req.body;

    const roleId = parseInt(id);
    
    if (roleId === 1 && name && name !== 'ADMIN') {
      res.status(400).json({ message: 'No se puede modificar el nombre del rol ADMIN' });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.NAME = name;
    if (description !== undefined) updates.DESCRIPTION = description;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('t_roles')
        .update(updates)
        .eq('ID_ROLS', roleId);

      if (error) {
        console.error('Error updating role:', error);
        res.status(400).json({ message: 'Error al actualizar rol' });
        return;
      }
    }

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente'
    });

  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ message: 'Error al actualizar rol', error });
  }
};

export const getRoleStats = async (_req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const [
      { count: rolesCount },
      { count: usersCount }
    ] = await Promise.all([
      supabase.from('t_roles').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_user_roles').select('*', { count: 'exact', head: true })
    ]);

    const allPermissions = await permissionService.getAllPermissions();

    res.json({
      success: true,
      data: {
        rolesCount: rolesCount || 0,
        permissionsCount: allPermissions.length,
        usersWithRoles: usersCount || 0
      }
    });

  } catch (error) {
    console.error('Get Role Stats Error:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error });
  }
};

interface CreateRoleBody {
  name: string;
  description?: string;
  permissionIds?: (number | string)[];
}

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissionIds } = req.body as CreateRoleBody;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'El nombre del rol es requerido' });
      return;
    }

    const supabase = dbManager.getConnection();

    // Get the next available ID
    const { data: maxRole } = await supabase
      .from('t_roles')
      .select('ID_ROLS')
      .order('ID_ROLS', { ascending: false })
      .limit(1)
      .single();

    const newRoleId = (maxRole?.ID_ROLS || 0) + 1;

    // Create the role
    const { data: roleData, error: roleError } = await supabase
      .from('t_roles')
      .insert({
        ID_ROLS: newRoleId,
        NAME: name.trim().toUpperCase(),
        DESCRIPTION: description?.trim() || null,
        STATUS: 1,
        IS_SYSTEM: false,
        MODIF_USER_ID: 1,
        MODIF_USER_DATE: new Date().toISOString(),
        ELIM_USER_ID: 0,
        ELIM_USER_DATE: new Date().toISOString(),
        REST_USER_ID: 0,
        REST_USER_DATE: new Date().toISOString()
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error creating role:', roleError);
      res.status(400).json({ message: 'Error al crear rol' });
      return;
    }

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const permissionInserts = permissionIds.map(permId => ({
        ROLES_ID: newRoleId,
        PERMISSIONS_ID: Number(permId)
      }));

      const { error: permError } = await supabase
        .from('t_roles_permissions')
        .insert(permissionInserts);

      if (permError) {
        console.error('Error assigning permissions:', permError);
      }
    }

    res.json({
      success: true,
      message: 'Rol creado exitosamente',
      data: {
        id: newRoleId,
        name: name.trim().toUpperCase(),
        description: description?.trim() || '',
        userCount: 0,
        permissions: (permissionIds || []).map(String),
        status: 'active' as const,
        isSystem: false
      }
    });

  } catch (error) {
    console.error('Create Role Error:', error);
    res.status(500).json({ message: 'Error al crear rol', error });
  }
};
