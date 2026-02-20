import { Response } from 'express';
import { permissionService } from '../services/permission.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getAllPermissions = async (_req: AuthRequest, res: Response) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    const grouped = await permissionService.getPermissionsGrouped();
    
    res.json({ 
      success: true, 
      data: permissions,
      grouped 
    });
  } catch (error: any) {
    console.error('[PermissionController] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener permisos',
      error: error.message 
    });
  }
};

export const getRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId);
    
    if (isNaN(roleId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de rol inválido' 
      });
    }

    const permissionIds = await permissionService.getRolePermissions(roleId);
    const allPermissions = await permissionService.getAllPermissions();
    
    const permissions = allPermissions.filter(p => 
      permissionIds.includes(p.PERMISSIONS_ID)
    );

    res.json({ 
      success: true, 
      data: permissions,
      permissionIds 
    });
  } catch (error: any) {
    console.error('[PermissionController] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener permisos del rol',
      error: error.message 
    });
  }
};

export const updateRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const { permissionIds } = req.body;

    if (isNaN(roleId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de rol inválido' 
      });
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'permissionIds debe ser un array' 
      });
    }

    await permissionService.updateRolePermissions(roleId, permissionIds);

    res.json({ 
      success: true, 
      message: 'Permisos actualizados correctamente' 
    });
  } catch (error: any) {
    console.error('[PermissionController] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar permisos',
      error: error.message 
    });
  }
};

export const checkPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { permission } = req.params;
    const roleId = req.user?.role;

    if (!roleId) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }

    const hasPermission = await permissionService.hasPermission(roleId, permission);

    res.json({ 
      success: true, 
      hasPermission,
      permission,
      roleId 
    });
  } catch (error: any) {
    console.error('[PermissionController] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al verificar permiso',
      error: error.message 
    });
  }
};

export const getMyPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const roleId = req.user?.role;

    if (!roleId) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }

    const permissions = await permissionService.getPermissionsByRole(roleId);

    res.json({ 
      success: true, 
      data: permissions,
      roleId 
    });
  } catch (error: any) {
    console.error('[PermissionController] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener permisos',
      error: error.message 
    });
  }
};
