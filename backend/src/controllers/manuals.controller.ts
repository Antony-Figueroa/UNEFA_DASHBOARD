import { Request, Response } from 'express';
import * as manualsService from '../services/manuals.service.js';

export const getManuals = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    
    const manuals = await manualsService.getManuals(
      category as string,
      search as string
    );

    res.json({
      success: true,
      data: manuals
    });

  } catch (error) {
    console.error('Get Manuals Error:', error);
    res.status(500).json({ message: 'Error al obtener manuales', error });
  }
};

export const getManualById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const manual = await manualsService.getManualById(parseInt(id));

    if (!manual) {
      res.status(404).json({ message: 'Manual no encontrado' });
      return;
    }

    res.json({
      success: true,
      data: manual
    });

  } catch (error) {
    console.error('Get Manual Error:', error);
    res.status(500).json({ message: 'Error al obtener manual', error });
  }
};

export const createManual = async (req: Request, res: Response) => {
  try {
    const { title, description, category, fileType, fileSize, fileUrl, version } = req.body;

    if (!title || !category) {
      res.status(400).json({ message: 'Título y categoría son requeridos' });
      return;
    }

    const manual = await manualsService.createManual({
      title,
      description: description || '',
      category,
      fileType: fileType || 'PDF',
      fileSize: fileSize || '0 KB',
      fileUrl: fileUrl || '',
      version: version || '1.0'
    });

    if (!manual) {
      res.status(400).json({ message: 'Error al crear manual' });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Manual creado exitosamente',
      data: manual
    });

  } catch (error) {
    console.error('Create Manual Error:', error);
    res.status(500).json({ message: 'Error al crear manual', error });
  }
};

export const updateManual = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const manual = await manualsService.updateManual(parseInt(id), updates);

    if (!manual) {
      res.status(400).json({ message: 'Error al actualizar manual' });
      return;
    }

    res.json({
      success: true,
      message: 'Manual actualizado exitosamente',
      data: manual
    });

  } catch (error) {
    console.error('Update Manual Error:', error);
    res.status(500).json({ message: 'Error al actualizar manual', error });
  }
};

export const deleteManual = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await manualsService.deleteManual(parseInt(id));

    if (!success) {
      res.status(400).json({ message: 'Error al eliminar manual' });
      return;
    }

    res.json({
      success: true,
      message: 'Manual eliminado exitosamente'
    });

  } catch (error) {
    console.error('Delete Manual Error:', error);
    res.status(500).json({ message: 'Error al eliminar manual', error });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await manualsService.getCategories();

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ message: 'Error al obtener categorías', error });
  }
};
