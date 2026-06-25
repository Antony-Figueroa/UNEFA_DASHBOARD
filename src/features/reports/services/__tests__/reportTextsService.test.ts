/**
 * @file reportTextsService.test.ts
 * @description Tests para reportTextsService — merge FALLBACK_TEXTOS con API data (Task 7.1.1)
 */

import { describe, it, expect } from 'vitest';
import { mergeTextData } from '../reportTextsService';
import { FALLBACK_TEXTOS } from '../../utils/documentTexts';

describe('mergeTextData — merge FALLBACK_TEXTOS con API data', () => {
  const fallback = {
    key_a: { cuerpo: 'fallback cuerpo', firma: 'fallback firma' },
    key_b: { encabezado: 'fallback encabezado' },
  };

  it('debería retornar fallback completo cuando API retorna datos vacíos', () => {
    const result = mergeTextData(fallback, {});
    expect(result).toEqual(fallback);
  });

  it('debería sobrescribir valores del fallback con datos de la API para claves existentes', () => {
    const apiData = {
      key_a: { cuerpo: 'API cuerpo' },
    };
    const result = mergeTextData(fallback, apiData);
    // key_a.cuerpo debe venir de API, key_a.firma debe mantener fallback
    expect(result.key_a.cuerpo).toBe('API cuerpo');
    expect(result.key_a.firma).toBe('fallback firma');
    // key_b debe mantenerse intacto del fallback
    expect(result.key_b.encabezado).toBe('fallback encabezado');
  });

  it('debería incluir claves de API que no existen en fallback', () => {
    const apiData = {
      key_c: { cuerpo: 'solo API' },
    };
    const result = mergeTextData(fallback, apiData);
    expect(result.key_c).toEqual({ cuerpo: 'solo API' });
    expect(result.key_a).toEqual(fallback.key_a);
  });

  it('debería retornar solo datos de API cuando fallback está vacío', () => {
    const apiData = {
      key_x: { cuerpo: 'x' },
    };
    const result = mergeTextData({}, apiData);
    expect(result).toEqual(apiData);
  });

  it('debería mergear correctamente con FALLBACK_TEXTOS real y API data real', () => {
    const apiData = {
      solicitud_institucion: {
        destinatario: 'API Destinatario',
        cuerpo: 'API Cuerpo',
      },
    };
    const result = mergeTextData(FALLBACK_TEXTOS, apiData);
    // API gana para las claves que proporciona
    expect(result.solicitud_institucion.destinatario).toBe('API Destinatario');
    expect(result.solicitud_institucion.cuerpo).toBe('API Cuerpo');
    // Fallback mantiene las claves que API no tocó
    expect(result.solicitud_institucion.cargo).toBe('Decana del Núcleo Portuguesa');
    expect(result.solicitud_institucion.orden).toBe(
      'Según Orden administrativa N° 0005 de fecha 18 de marzo de 2022'
    );
    // Otras claves del fallback no deben modificarse
    expect(result.aceptacion_tutor.encabezado).toContain('por medio de la presente');
    // Claves de API sin fallback deben aparecer
    expect(result.aceptacion_tutor).toBeDefined();
  });

  it('debería retornar objeto vacío cuando ambos argumentos están vacíos', () => {
    const result = mergeTextData({}, {});
    expect(result).toEqual({});
  });
});
