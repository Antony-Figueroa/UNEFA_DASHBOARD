/**
 * @file cedula-api.service.ts
 * @description Servicio para consultar datos personales desde la API externa cedula.com.ve.
 * Permite autocompletar nombres y apellidos de estudiantes al registrar su cédula.
 *
 * @module services/cedula-api
 */

import axios from 'axios';

const CEDULA_API_URL = 'https://api.cedula.com.ve/api/v1';
const APP_ID = process.env.CEDULA_APP_ID;
const TOKEN = process.env.CEDULA_TOKEN;

interface CedulaApiResponseData {
  nacionalidad: string;
  cedula: number;
  rif: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  cne: {
    estado: string;
    municipio: string;
    parroquia: string;
    centro_electoral: string;
  };
  request_date: string;
}

interface CedulaApiResponse {
  error: boolean;
  error_str: string | false;
  data: CedulaApiResponseData | null;
}

export interface CedulaLookupResult {
  nacionalidad: string;
  cedula: string;
  rif: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
}

/**
 * Consulta la API externa de cédula.com.ve para obtener datos personales
 * a partir del número de cédula venezolana.
 *
 * @param nacionalidad - Prefijo de nacionalidad: "V" (venezolano) o "E" (extranjero)
 * @param cedula - Número de cédula (solo dígitos)
 * @returns Datos de la persona consultada o null si no se encuentra / hay error
 */
export const lookupCedula = async (
  nacionalidad: string,
  cedula: string
): Promise<CedulaLookupResult | null> => {
  if (!APP_ID || !TOKEN) {
    console.warn('[CedulaApi] CEDULA_APP_ID o CEDULA_TOKEN no están configurados en .env');
    return null;
  }

  try {
    const { data } = await axios.get<CedulaApiResponse>(CEDULA_API_URL, {
      params: {
        app_id: APP_ID,
        token: TOKEN,
        nacionalidad,
        cedula,
      },
      timeout: 10000,
    });

    if (!data.error && data.data) {
      const d = data.data;
      return {
        nacionalidad: d.nacionalidad,
        cedula: String(d.cedula),
        rif: d.rif,
        primerNombre: d.primer_nombre,
        segundoNombre: d.segundo_nombre,
        primerApellido: d.primer_apellido,
        segundoApellido: d.segundo_apellido,
      };
    }

    return null;
  } catch (error) {
    console.error('[CedulaApi] Error al consultar API externa:', error);
    return null;
  }
};
