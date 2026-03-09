import { Response } from 'express';
import * as landingConfigService from '../services/landing-config.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getLandingConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await landingConfigService.getLandingConfig();
    res.json({
      success: true,
      data: {
        id: 'landing-config',
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      }
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error getting config:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la configuración de la landing page',
      error: error.message
    });
  }
};

export const updateLandingConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString() || '0';
    const updates = req.body;
    
    const config = await landingConfigService.updateLandingConfig('full', updates, userId);
    
    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: config
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración',
      error: error.message
    });
  }
};

export const updateHeroConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString() || '0';
    const hero = req.body;
    
    const config = await landingConfigService.updateHeroConfig(hero, userId);
    
    res.json({
      success: true,
      message: 'Configuración del hero actualizada exitosamente',
      data: config
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error updating hero:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración del hero',
      error: error.message
    });
  }
};

export const updateMissionVisionConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString() || '0';
    const missionVision = req.body;
    
    const config = await landingConfigService.updateMissionVisionConfig(missionVision, userId);
    
    res.json({
      success: true,
      message: 'Configuración de misión/visión actualizada exitosamente',
      data: config
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error updating mission/vision:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración de misión/visión',
      error: error.message
    });
  }
};

export const updateCareersConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString() || '0';
    const { careers } = req.body;
    
    const config = await landingConfigService.updateCareersConfig(careers, userId);
    
    res.json({
      success: true,
      message: 'Carreras actualizadas exitosamente',
      data: config
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error updating careers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar las carreras',
      error: error.message
    });
  }
};

export const updateFAQsConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString() || '0';
    const { faqs } = req.body;
    
    const config = await landingConfigService.updateFAQsConfig(faqs, userId);
    
    res.json({
      success: true,
      message: 'FAQs actualizadas exitosamente',
      data: config
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error updating FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar las FAQs',
      error: error.message
    });
  }
};

export const updateProcessStepsConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString() || '0';
    const { processSteps } = req.body;
    
    const config = await landingConfigService.updateProcessStepsConfig(processSteps, userId);
    
    res.json({
      success: true,
      message: 'Pasos del proceso actualizados exitosamente',
      data: config
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error updating process steps:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar los pasos del proceso',
      error: error.message
    });
  }
};

export const updateGraduateStatsConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId?.toString() || '0';
    const stats = req.body;
    
    const config = await landingConfigService.updateGraduateStatsConfig(stats, userId);
    
    res.json({
      success: true,
      message: 'Estadísticas de graduados actualizadas exitosamente',
      data: config
    });
  } catch (error: any) {
    console.error('[LandingConfigController] Error updating graduate stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar las estadísticas de graduados',
      error: error.message
    });
  }
};