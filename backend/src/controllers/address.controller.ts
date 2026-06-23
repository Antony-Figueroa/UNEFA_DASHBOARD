import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';

const CACHE_TTL = 86400000; // 24h — datos geográficos estáticos

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('[Address] DB Error:', error);
  const dbError = error as AppError;
  res.status(500).json({
    message: 'Error en la base de datos',
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code,
  });
};

// ─── Person Addresses ───

export const getPersonAddresses = async (req: Request, res: Response) => {
  try {
    const { personId } = req.params;
    const supabase = dbManager.getClient();

    const { data, error } = await supabase
      .from('t_person_address')
      .select(`
        person_address_id,
        is_primary,
        created_at,
        address_type:address_type_id ( address_type_id, code, name ),
        address:address_id (
          address_id, street_address, reference, created_at,
          parroquia:parroquia_id (
            parroquia_id, name,
            municipio:municipio_id (
              municipio_id, name,
              estado:estado_id ( estado_id, name )
            )
          )
        )
      `)
      .eq('person_id', personId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getInstitutionAddresses = async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;
    const supabase = dbManager.getClient();

    const { data, error } = await supabase
      .from('t_institution_address')
      .select(`
        institution_address_id,
        is_primary,
        created_at,
        address_type:address_type_id ( address_type_id, code, name ),
        address:address_id (
          address_id, street_address, reference, created_at,
          parroquia:parroquia_id (
            parroquia_id, name,
            municipio:municipio_id (
              municipio_id, name,
              estado:estado_id ( estado_id, name )
            )
          )
        )
      `)
      .eq('institution_id', institutionId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    handleDbError(res, error);
  }
};

// ─── Address CRUD ───

export const createAddress = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getClient();
    const {
      entity_type, // 'person' or 'institution'
      entity_id,
      address_type_id,
      parroquia_id,
      street_address,
      reference,
      is_primary,
    } = req.body;

    if (!entity_type || entity_id == null || address_type_id == null || parroquia_id == null || !street_address) {
      res.status(400).json({ message: 'Faltan campos requeridos: entity_type, entity_id, address_type_id, parroquia_id, street_address' });
      return;
    }

    const { data: addressData, error: addressError } = await supabase
      .from('t_address')
      .insert({ parroquia_id, street_address, reference })
      .select('address_id')
      .single();

    if (addressError) throw addressError;

    const bridgePayload: Record<string, any> = {
      address_id: addressData.address_id,
      address_type_id,
      is_primary: is_primary ?? false,
    };

    if (entity_type === 'person') {
      bridgePayload.person_id = entity_id;
    } else if (entity_type === 'institution') {
      bridgePayload.institution_id = entity_id;
    } else {
      res.status(400).json({ message: 'entity_type debe ser "person" o "institution"' });
      return;
    }

    const bridgeTable = entity_type === 'person' ? 't_person_address' : 't_institution_address';

    if (is_primary) {
      const { error: resetError } = await supabase
        .from(bridgeTable)
        .update({ is_primary: false })
        .eq(entity_type === 'person' ? 'person_id' : 'institution_id', entity_id)
        .eq('address_type_id', address_type_id)
        .eq('is_primary', true);

      if (resetError) throw resetError;
    }

    const { error: bridgeError } = await supabase
      .from(bridgeTable)
      .insert(bridgePayload);

    if (bridgeError) throw bridgeError;

    res.status(201).json({ address_id: addressData.address_id, message: 'Dirección creada exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // person_address_id o institution_address_id
    const supabase = dbManager.getClient();
    const { parroquia_id, street_address, reference, address_type_id, entity_type, entity_id } = req.body;

    // Resolver el address_id real desde la tabla puente
    const bridgeTable = entity_type === 'person' ? 't_person_address' : 't_institution_address';
    const bridgeKey = entity_type === 'person' ? 'person_address_id' : 'institution_address_id';
    const { data: bridgeRow, error: bridgeFindError } = await supabase
      .from(bridgeTable)
      .select('address_id')
      .eq(bridgeKey, id)
      .single();

    if (bridgeFindError || !bridgeRow) {
      res.status(404).json({ message: 'Dirección no encontrada' });
      return;
    }

    const { error } = await supabase
      .from('t_address')
      .update({ parroquia_id, street_address, reference })
      .eq('address_id', bridgeRow.address_id);

    if (error) throw error;

    if (address_type_id && entity_type && entity_id) {
      const entityKey = entity_type === 'person' ? 'person_id' : 'institution_id';
      const { error: bridgeError } = await supabase
        .from(bridgeTable)
        .update({ address_type_id })
        .eq('address_id', bridgeRow.address_id)
        .eq(entityKey, entity_id);

      if (bridgeError) throw bridgeError;
    }

    res.json({ message: 'Dirección actualizada exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // person_address_id o institution_address_id
    const { entity_type, entity_id } = req.query;
    const supabase = dbManager.getClient();

    const bridgeTable = entity_type === 'person' ? 't_person_address' : 't_institution_address';
    const bridgeKey = entity_type === 'person' ? 'person_address_id' : 'institution_address_id';

    // Resolver el address_id real antes de borrar
    const { data: bridgeRow, error: findError } = await supabase
      .from(bridgeTable)
      .select('address_id')
      .eq(bridgeKey, id)
      .single();

    if (findError || !bridgeRow) {
      res.status(404).json({ message: 'Dirección no encontrada' });
      return;
    }

    const addressId = bridgeRow.address_id;

    // Borrar la fila puente por su PK
    const { error: bridgeError } = await supabase
      .from(bridgeTable)
      .delete()
      .eq(bridgeKey, id);

    if (bridgeError) throw bridgeError;

    // Cleanup orphaned t_address row if no bridges reference it
    const { count: personCount } = await supabase
      .from('t_person_address')
      .select('*', { count: 'exact', head: true })
      .eq('address_id', addressId);

    const { count: instCount } = await supabase
      .from('t_institution_address')
      .select('*', { count: 'exact', head: true })
      .eq('address_id', addressId);

    if ((personCount ?? 0) === 0 && (instCount ?? 0) === 0) {
      await supabase.from('t_address').delete().eq('address_id', addressId);
    }

    res.json({ message: 'Dirección eliminada exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

// ─── Primary Toggle ───

export const setPrimaryAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { entity_type, entity_id, address_type_id } = req.body;
    const supabase = dbManager.getClient();

    if (!entity_type || !entity_id || !address_type_id) {
      res.status(400).json({ message: 'Faltan campos requeridos' });
      return;
    }

    const bridgeTable = entity_type === 'person' ? 't_person_address' : 't_institution_address';
    const entityKey = entity_type === 'person' ? 'person_id' : 'institution_id';

    const { error: resetError } = await supabase
      .from(bridgeTable)
      .update({ is_primary: false })
      .eq(entityKey, entity_id)
      .eq('address_type_id', address_type_id)
      .eq('is_primary', true);

    if (resetError) throw resetError;

    const { error: setError } = await supabase
      .from(bridgeTable)
      .update({ is_primary: true })
      .eq(entityKey, entity_id)
      .eq('address_id', id)
      .eq('address_type_id', address_type_id);

    if (setError) throw setError;

    res.json({ message: 'Dirección principal actualizada' });
  } catch (error) {
    handleDbError(res, error);
  }
};

// ─── Coincidence ───

export const getAddressCoincidence = async (req: Request, res: Response) => {
  try {
    const { person_id, institution_id } = req.query;
    const supabase = dbManager.getClient();

    if (!person_id || !institution_id) {
      res.status(400).json({ message: 'person_id y institution_id son requeridos' });
      return;
    }

    const { data: personAddr, error: personError } = await supabase
      .rpc('get_primary_address', { p_entity_type: 'person', p_entity_id: parseInt(person_id as string) });

    if (personError) throw personError;

    const { data: instAddr, error: instError } = await supabase
      .rpc('get_primary_address', { p_entity_type: 'institution', p_entity_id: parseInt(institution_id as string) });

    if (instError) throw instError;

    if (!personAddr || !instAddr) {
      res.json({
        coincidence: null,
        message: 'Una o ambas entidades no tienen dirección principal',
      });
      return;
    }

    const s = personAddr[0];
    const i = instAddr[0];

    const coincidence = {
      level: s.parroquia_id === i.parroquia_id ? 'SAME_PARROQUIA'
        : s.municipio_id === i.municipio_id ? 'SAME_MUNICIPIO'
        : s.estado_id === i.estado_id ? 'SAME_STATE'
        : 'DIFFERENT_STATE',
      state_match: s.estado_id === i.estado_id,
      municipality_match: s.municipio_id === i.municipio_id,
      parish_match: s.parroquia_id === i.parroquia_id,
      proximity_score:
        s.parroquia_id === i.parroquia_id ? 10
        : s.municipio_id === i.municipio_id ? 5
        : s.estado_id === i.estado_id ? 3
        : 0,
    };

    res.json({
      student_address: {
        estado_id: s.estado_id,
        estado: s.estado_name,
        municipio: s.municipio_name,
        parroquia: s.parroquia_name,
        street_address: s.street_address,
      },
      institution_address: {
        estado_id: i.estado_id,
        estado: i.estado_name,
        municipio: i.municipio_name,
        parroquia: i.parroquia_name,
        street_address: i.street_address,
      },
      coincidence,
    });
  } catch (error) {
    handleDbError(res, error);
  }
};

// ─── Stats ───

export const getAddressStats = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getClient();

    const { data: enrollmentGeo, error: geoError } = await supabase
      .from('t_professional_practices')
      .select(`
        STUDENTS_ID,
        INSTITUTION_ID,
        t_students!inner ( person_id ),
        t_institution!inner ( INSTITUTION_ID )
      `);

    if (geoError) throw geoError;

    const { data: coincidenceByState, error: stateError } = await supabase
      .rpc('get_coincidence_stats');

    if (stateError) throw stateError;

    res.json({
      coincidence_distribution: coincidenceByState || [],
      enrollment_geo: {
        total: enrollmentGeo?.length || 0,
      },
    });
  } catch (error) {
    handleDbError(res, error);
  }
};

// ─── Geographic Options (for cascading selects) ───

export const getGeoOptions = async (_req: Request, res: Response) => {
  const cacheKey = 'address:geoOptions';
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return res.json(cached);

  try {
    const supabase = dbManager.getClient();

    const { data: estados, error: eError } = await supabase
      .from('t_estado')
      .select(`
        estado_id,
        name,
        t_municipio (
          municipio_id,
          name,
          t_parroquia (
            parroquia_id,
            name
          )
        )
      `)
      .order('estado_id', { ascending: true });

    if (eError) throw eError;

    cacheManager.set(cacheKey, estados || [], CACHE_TTL);
    res.json(estados || []);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getAddressTypes = async (_req: Request, res: Response) => {
  const cacheKey = 'address:types';
  const cached = cacheManager.get<any[]>(cacheKey);
  if (cached) return res.json(cached);

  try {
    const supabase = dbManager.getClient();
    const { data, error } = await supabase
      .from('t_address_type')
      .select('*')
      .order('address_type_id', { ascending: true });

    if (error) throw error;
    cacheManager.set(cacheKey, data || [], CACHE_TTL);
    res.json(data || []);
  } catch (error) {
    handleDbError(res, error);
  }
};

// ─── Suggestions for Enrollment ───

export const getInstitutionSuggestions = async (req: Request, res: Response) => {
  try {
    const { person_id, career_id, internship_type_id } = req.query;
    const supabase = dbManager.getClient();

    if (!person_id || !career_id) {
      res.status(400).json({ message: 'person_id y career_id son requeridos' });
      return;
    }

    const { data, error } = await supabase
      .rpc('get_institution_suggestions', {
        p_person_id: parseInt(person_id as string),
        p_career_id: parseInt(career_id as string),
        p_internship_type_id: internship_type_id ? parseInt(internship_type_id as string) : null,
      });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    handleDbError(res, error);
  }
};
