import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  status: 'active' | 'inactive';
  isSystem: boolean;
}

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'users.view', module: 'Usuarios', action: 'Ver', description: 'Ver listado de usuarios' },
  { id: 'users.create', module: 'Usuarios', action: 'Crear', description: 'Crear nuevos usuarios' },
  { id: 'users.edit', module: 'Usuarios', action: 'Editar', description: 'Editar usuarios existentes' },
  { id: 'users.delete', module: 'Usuarios', action: 'Eliminar', description: 'Eliminar usuarios' },
  { id: 'students.view', module: 'Estudiantes', action: 'Ver', description: 'Ver listado de estudiantes' },
  { id: 'students.create', module: 'Estudiantes', action: 'Crear', description: 'Registrar estudiantes' },
  { id: 'students.edit', module: 'Estudiantes', action: 'Editar', description: 'Editar datos de estudiantes' },
  { id: 'enrollments.view', module: 'Inscripciones', action: 'Ver', description: 'Ver inscripciones' },
  { id: 'enrollments.manage', module: 'Inscripciones', action: 'Gestionar', description: 'Gestionar inscripciones' },
  { id: 'tracking.view', module: 'Seguimiento', action: 'Ver', description: 'Ver seguimientos' },
  { id: 'tracking.manage', module: 'Seguimiento', action: 'Gestionar', description: 'Registrar visitas' },
  { id: 'reports.view', module: 'Reportes', action: 'Ver', description: 'Ver reportes' },
  { id: 'reports.export', module: 'Reportes', action: 'Exportar', description: 'Exportar reportes' },
  { id: 'config.access', module: 'Configuración', action: 'Acceder', description: 'Acceder a configuración' },
];

const ADMIN_PERMISSIONS = DEFAULT_PERMISSIONS.map(p => p.id);
const ASISTENTE_PERMISSIONS = ['students.view', 'students.create', 'students.edit', 'enrollments.view', 'tracking.view', 'reports.view'];

export const getRoles = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const { data: rolesData, error: rolesError } = await supabase
      .from('t_roles')
      .select('ID_ROLS, NAME, DESCRIPTION, STATUS');

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

    const roles: Role[] = (rolesData || [])
      .filter((r: { STATUS: number }) => r.STATUS === 1)
      .map((r: { ID_ROLS: number; NAME: string; DESCRIPTION: string | null; STATUS: number }) => {
        let permissions: string[] = [];
        if (r.ID_ROLS === 1) {
          permissions = ADMIN_PERMISSIONS;
        } else if (r.ID_ROLS === 2) {
          permissions = ASISTENTE_PERMISSIONS;
        }

        return {
          id: r.ID_ROLS,
          name: r.NAME,
          description: r.DESCRIPTION || '',
          userCount: userCountMap.get(r.ID_ROLS) || 0,
          permissions,
          status: r.STATUS === 1 ? 'active' : 'inactive',
          isSystem: r.ID_ROLS === 1 || r.ID_ROLS === 2
        };
      });

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('Get Roles Error:', error);
    res.status(500).json({ message: 'Error al obtener roles', error });
  }
};

export const getPermissions = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: DEFAULT_PERMISSIONS,
      modules: [...new Set(DEFAULT_PERMISSIONS.map(p => p.module))]
    });

  } catch (error) {
    console.error('Get Permissions Error:', error);
    res.status(500).json({ message: 'Error al obtener permisos', error });
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { id } = req.params;

    const { data: roleData, error } = await supabase
      .from('t_roles')
      .select('ID_ROLS, NAME, DESCRIPTION, STATUS')
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

    let permissions: string[] = [];
    if (roleData.ID_ROLS === 1) {
      permissions = ADMIN_PERMISSIONS;
    } else if (roleData.ID_ROLS === 2) {
      permissions = ASISTENTE_PERMISSIONS;
    }

    const role: Role = {
      id: roleData.ID_ROLS,
      name: roleData.NAME,
      description: roleData.DESCRIPTION || '',
      userCount: usersData?.length || 0,
      permissions,
      status: roleData.STATUS === 1 ? 'active' : 'inactive',
      isSystem: roleData.ID_ROLS === 1 || roleData.ID_ROLS === 2
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

export const getRoleStats = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const [
      { count: rolesCount },
      { count: usersCount }
    ] = await Promise.all([
      supabase.from('t_roles').select('*', { count: 'exact', head: true }).eq('STATUS', 1),
      supabase.from('t_user_roles').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      success: true,
      data: {
        rolesCount: rolesCount || 0,
        permissionsCount: DEFAULT_PERMISSIONS.length,
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
  permissionIds?: string[];
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
        MODIF_USER_ID: 1,
        MODIF_USER_DATE: new Date().toISOString()
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
        PERMISSIONS_ID: parseInt(permId)
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
        permissions: permissionIds || [],
        status: 'active',
        isSystem: false
      }
    });

  } catch (error) {
    console.error('Create Role Error:', error);
    res.status(500).json({ message: 'Error al crear rol', error });
  }
};
