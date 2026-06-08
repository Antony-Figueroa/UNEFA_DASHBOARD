import { dbManager } from '../lib/db-manager.js';
import { hashPassword } from '../utils/auth.utils.js';
import * as personService from './person.service.js';

// ============================================================
// TYPES
// ============================================================

interface UserData {
  userCi: string;
  name: string;
  surname: string;
  email: string;
  role?: number;
  status?: number;
}

interface ServiceError extends Error {
  code?: string;
  status?: number;
}

const USER_COLUMNS = `
  USER_ID,
  person_id,
  USER,
  USER_CI,
  STATUS,
  FORCE_PASSWORD_CHANGE,
  LOGIN,
  CREATION_DATE,
  TERMS_CONDITIONS,
  STATUS_SESSION
`;

const PERSON_JOIN = `
  t_persons!inner(
    person_id,
    ci,
    first_name,
    middle_name,
    last_name,
    second_last_name,
    email,
    phone,
    gender,
    birthdate,
    address
  )
`;

interface DBPersonJoin {
  person_id: number;
  ci: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  birthdate: string | null;
  address: string | null;
}

interface DBUserRow {
  USER_ID: number;
  person_id: number;
  USER: string;
  USER_CI: string;
  STATUS: number;
  CREATION_DATE: string;
  t_persons: DBPersonJoin;
  t_user_roles: { ID_ROLES: number; t_roles?: { NAME: string } }[];
  /** Flat columns for PGlite adapter joins */
  t_user_roles_ID_ROLES?: number;
  t_user_roles_t_roles_NAME?: string;
}

// ============================================================
// HELPERS
// ============================================================

const mapUserToFrontend = (u: DBUserRow) => ({
  id: u.USER_ID,
  userCi: u.USER_CI,
  name: u.t_persons.first_name,
  surname: u.t_persons.last_name,
  email: u.t_persons.email,
  role: u.t_user_roles?.[0]?.ID_ROLES ?? u.t_user_roles_ID_ROLES,
  roleName: u.t_user_roles?.[0]?.t_roles?.NAME ?? u.t_user_roles_t_roles_NAME,
  status: u.STATUS,
  creationDate: u.CREATION_DATE,
  isImported: !!(
    u.t_persons.middle_name ||
    u.t_persons.second_last_name ||
    u.t_persons.phone ||
    u.t_persons.gender ||
    u.t_persons.birthdate ||
    u.t_persons.address
  ),
});

// ============================================================
// GET USERS
// ============================================================

export const getUsers = async (
  filters: { role?: number; status?: number; search?: string; name?: string; surname?: string; userCi?: string },
  page: number,
  limit: number
) => {
  return await dbManager.withRetry(async (supabase) => {
    // Si hay filtro por rol, obtener IDs de usuarios con ese rol
    let userIdsWithRole: number[] | undefined;
    if (filters.role) {
      const { data: roleUsers } = await supabase
        .from('t_user_roles')
        .select('ID_USER')
        .eq('ID_ROLES', filters.role);

      userIdsWithRole = roleUsers?.map(r => r.ID_USER) || [];
    }

    let query = supabase
      .from('t_user')
      .select(`${USER_COLUMNS}, ${PERSON_JOIN}, t_user_roles(ID_ROLES, t_roles(NAME))`, { count: 'exact' });

    // Filtro por rol
    if (userIdsWithRole !== undefined) {
      if (userIdsWithRole.length === 0) {
        return { users: [], totalCount: 0, totalPages: 0, currentPage: page };
      }
      query = query.in('USER_ID', userIdsWithRole);
    }

    if (filters.status !== undefined) {
      query = query.eq('STATUS', filters.status);
    }

    // Búsqueda — buscar en t_persons via person_ids
    if (filters.search) {
      const searchResults = await personService.searchPersons(filters.search);
      const personIds = searchResults.map(p => p.personId);
      if (personIds.length === 0) {
        return { users: [], totalCount: 0, totalPages: 0, currentPage: page };
      }
      query = query.in('person_id', personIds);
    }

    // Filtros individuales — resolver desde t_persons
    if (filters.name) {
      // Buscar personas por nombre y obtener person_ids
      const { data: persons } = await supabase
        .from('t_persons')
        .select('person_id')
        .ilike('first_name', `%${filters.name}%`);

      const personIds = persons?.map(p => p.person_id) || [];
      if (personIds.length === 0) {
        return { users: [], totalCount: 0, totalPages: 0, currentPage: page };
      }
      query = query.in('person_id', personIds);
    }

    if (filters.surname) {
      const { data: persons } = await supabase
        .from('t_persons')
        .select('person_id')
        .ilike('last_name', `%${filters.surname}%`);

      const personIds = persons?.map(p => p.person_id) || [];
      if (personIds.length === 0) {
        return { users: [], totalCount: 0, totalPages: 0, currentPage: page };
      }
      query = query.in('person_id', personIds);
    }

    if (filters.userCi) {
      // USER_CI se queda en t_user porque se usa para login
      query = query.ilike('USER_CI', `%${filters.userCi}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order('USER_ID', { ascending: false });

    if (error) {
      console.error('[UserService] Error fetching users:', error);
      throw error;
    }

    // Marcar isInUse según actividad en t_auth_log
    const userIds = data?.map(u => u.USER_ID) || [];
    let usersWithActivity: Set<number> = new Set();

    if (userIds.length > 0) {
      const { data: logData } = await supabase
        .from('t_auth_log')
        .select('USER_ID')
        .in('USER_ID', userIds);

      if (logData) {
        usersWithActivity = new Set(logData.map(l => l.USER_ID));
      }
    }

    const users = (data as unknown as DBUserRow[]).map((u) => ({
      ...mapUserToFrontend(u),
      isInUse: usersWithActivity.has(u.USER_ID)
    }));

    return {
      users,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    };
  });
};

// ============================================================
// CREATE USER
// ============================================================

export const createUser = async (userData: UserData, tempPass: string) => {
  return await dbManager.withRetry(async (supabase) => {
    // 0a. Verificar si USER_CI ya existe en t_user (login unique)
    const { data: existingCi } = await supabase
      .from('t_user')
      .select('USER_CI')
      .eq('USER_CI', userData.userCi)
      .maybeSingle();

    if (existingCi) {
      const error = new Error('Ya existe un usuario con esta cédula') as ServiceError;
      error.code = 'USER_ALREADY_EXISTS';
      error.status = 409;
      throw error;
    }

    // 0b. Determinar CI completo (formato V/E + guión + número)
    const ciMatch = userData.userCi.match(/^([VE])?(\d+)$/i);
    const prefix = ciMatch?.[1]?.toUpperCase() || 'V';
    const number = ciMatch?.[2] || userData.userCi;
    const fullCi = `${prefix}-${number}`;
    const { data: existingPerson } = await supabase
      .from('t_persons')
      .select('person_id, email')
      .eq('ci', fullCi)
      .maybeSingle();

    let personId: number;

    if (existingPerson) {
      // Persona ya existe (ej: estudiante, tutor) — reutilizar person_id sin modificar sus datos
      personId = existingPerson.person_id;
    } else {
      // Persona nueva — verificar email único global
      const emailCheck = await personService.validateUniqueEmail(userData.email);
      if (!emailCheck.available) {
        const error = new Error('Ya existe un usuario con este correo electrónico') as ServiceError;
        error.code = 'USER_ALREADY_EXISTS';
        error.status = 409;
        throw error;
      }

      const newPerson = await personService.createPerson({
        ci: fullCi,
        firstName: userData.name,
        lastName: userData.surname,
        email: userData.email,
      });

      personId = newPerson.personId;
    }

    // 2. Crear usuario en t_user
    const { data: newUser, error: userError } = await supabase
      .from('t_user')
      .insert({
        person_id: personId,
        USER: userData.userCi,
        USER_CI: userData.userCi,
        STATUS: 1,
        FORCE_PASSWORD_CHANGE: true,
        LOGIN: 0,
        CREATION_DATE: new Date().toISOString(),
        TERMS_CONDITIONS: '0',
        STATUS_SESSION: 2,
      })
      .select(`${USER_COLUMNS}, ${PERSON_JOIN}`)
      .single();

    if (userError) {
      console.error('[UserService] Error inserting into t_user:', userError);
      throw userError;
    }

    // 3. Crear clave temporal
    const hashedPassword = await hashPassword(tempPass);

    const { error: keyError } = await supabase
      .from('t_user_key')
      .insert({
        USER_ID: newUser.USER_ID,
        KEY: hashedPassword,
        STATUS: 1,
        IS_TEMPORARY: true,
        START_DATE: new Date().toISOString(),
        END_DATE: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        MODIF_USER_ID: 1,
        MODIF_USER_DATE: new Date().toISOString(),
        ELIM_USER_ID: 1,
        ELIM_USER_DATE: new Date().toISOString(),
        REST_USER_ID: 1,
        REST_USER_DATE: new Date().toISOString(),
      });

    if (keyError) {
      console.error('[UserService] Error inserting into t_user_key:', keyError);
      throw keyError;
    }

    // 4. Asignar rol
    const { error: roleError } = await supabase
      .from('t_user_roles')
      .insert({
        ID_USER: newUser.USER_ID,
        ID_ROLES: userData.role || 2,
      });

    if (roleError) {
      console.error('[UserService] Error inserting into t_user_roles:', roleError);
      throw roleError;
    }

    // 5. Refrescar datos completos del usuario con joins (incluye t_roles)
    const { data: freshUser, error: fetchError } = await supabase
      .from('t_user')
      .select(`${USER_COLUMNS}, ${PERSON_JOIN}, t_user_roles(ID_ROLES, t_roles(NAME))`)
      .eq('USER_ID', newUser.USER_ID)
      .single();

    if (fetchError) throw fetchError;

    return mapUserToFrontend(freshUser as unknown as DBUserRow);
  });
};

// ============================================================
// UPDATE USER
// ============================================================

export const updateUser = async (userId: number, userData: UserData) => {
  return await dbManager.withRetry(async (supabase) => {
    // 0. Obtener usuario actual con person_id
    const { data: existing } = await supabase
      .from('t_user')
      .select('USER_ID, person_id')
      .eq('USER_ID', userId)
      .single();

    if (!existing) {
      const error = new Error('Usuario no encontrado') as ServiceError;
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const personId = existing.person_id;

    // 1. Actualizar t_persons si hay cambios en nombre/apellido/email
    if (userData.name || userData.surname || userData.email) {
      await personService.updatePerson(personId, {
        firstName: userData.name,
        lastName: userData.surname,
        email: userData.email,
      });
    }

    // 2. Actualizar t_user
    const updateFields: Record<string, unknown> = {};
    if (userData.status !== undefined) updateFields.STATUS = userData.status;

    const { error: userError } = await supabase
      .from('t_user')
      .update(updateFields)
      .eq('USER_ID', userId);

    if (userError) throw userError;

    // 3. Actualizar rol si se proporcionó
    if (userData.role) {
      const { error: roleError } = await supabase
        .from('t_user_roles')
        .update({ ID_ROLES: userData.role })
        .eq('ID_USER', userId);

      if (roleError) throw roleError;
    }

    // 4. Refrescar datos completos del usuario con joins
    const { data: freshUser, error: fetchError } = await supabase
      .from('t_user')
      .select(`${USER_COLUMNS}, ${PERSON_JOIN}, t_user_roles(ID_ROLES, t_roles(NAME))`)
      .eq('USER_ID', userId)
      .single();

    if (fetchError) throw fetchError;

    return mapUserToFrontend(freshUser as unknown as DBUserRow);
  });
};

// ============================================================
// DELETE USER (soft delete)
// ============================================================

export const deleteUser = async (userId: number): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from('t_user')
      .update({ STATUS: 0 })
      .eq('USER_ID', userId);

    if (error) throw error;
  });
};

// ============================================================
// RESET USER PASSWORD
// ============================================================

export const resetUserPassword = async (userId: number): Promise<{ tempPassword: string; email: string; name: string; userCi: string; isFirstLogin: boolean }> => {
  return await dbManager.withRetry(async (supabase) => {
    // 1. Obtener usuario con datos de persona
    const { data: user, error: userError } = await supabase
      .from('t_user')
      .select(`${USER_COLUMNS}, ${PERSON_JOIN}`)
      .eq('USER_ID', userId)
      .single();

    if (userError || !user) {
      const error = new Error('Usuario no encontrado') as ServiceError;
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const person = (user as any).t_persons;
    const email = person?.email;
    const name = `${person?.first_name || ''} ${person?.last_name || ''}`.trim();

    if (!email) {
      const error = new Error('El usuario no tiene un correo electrónico registrado') as ServiceError;
      error.code = 'USER_NO_EMAIL';
      error.status = 400;
      throw error;
    }

    // 2. Desactivar claves activas actuales
    await supabase
      .from('t_user_key')
      .update({ STATUS: 0 })
      .eq('USER_ID', userId)
      .eq('STATUS', 1);

    // 3. Generar clave temporal aleatoria (8 caracteres)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await hashPassword(tempPassword);

    const { error: keyError } = await supabase
      .from('t_user_key')
      .insert({
        USER_ID: userId,
        KEY: hashedPassword,
        STATUS: 1,
        IS_TEMPORARY: true,
        START_DATE: new Date().toISOString(),
        END_DATE: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        MODIF_USER_ID: userId,
        MODIF_USER_DATE: new Date().toISOString(),
        ELIM_USER_ID: userId,
        ELIM_USER_DATE: new Date().toISOString(),
        REST_USER_ID: userId,
        REST_USER_DATE: new Date().toISOString(),
      });

    if (keyError) throw keyError;

    // 4. Forzar cambio de clave en próximo login
    const { error: updateError } = await supabase
      .from('t_user')
      .update({ FORCE_PASSWORD_CHANGE: true })
      .eq('USER_ID', userId);

    if (updateError) throw updateError;

    return { tempPassword, email, name, userCi: user.USER_CI, isFirstLogin: (user.LOGIN ?? 0) === 0 };
  });
};

// ============================================================
// SECURITY QUESTIONS
// ============================================================

export const saveSecurityQuestions = async (userId: number, questions: { questionId: number; answer: string }[]) => {
  return await dbManager.withRetry(async (supabase) => {
    await supabase.from('t_security_questions').delete().eq('USER_ID', userId);

    const questionsToInsert = questions.map(q => ({
      USER_ID: userId,
      PRESET_QUESTION_ID: q.questionId,
      ANSWER: q.answer,
    }));

    const { error } = await supabase.from('t_security_questions').insert(questionsToInsert);
    if (error) throw error;
    return true;
  });
};

// ============================================================
// SEED DATA (unchanged)
// ============================================================

const ROLE_SEED_DATA = [
  { id: 1, name: 'ADMIN', description: 'Administrador con acceso total al sistema', isSystem: true },
  { id: 2, name: 'ASISTENTE', description: 'Asistente con permisos limitados', isSystem: true },
  { id: 3, name: 'TUTOR', description: 'Tutor académico - gestión de seguimiento y notas', isSystem: true },
  { id: 4, name: 'ESTUDIANTE', description: 'Estudiante - visualización y solicitudes', isSystem: true },
];

const PERMISSION_SEED_DATA = [
  { name: 'users:view', module: 'Usuarios', description: 'Ver lista de usuarios' },
  { name: 'users:create', module: 'Usuarios', description: 'Crear nuevos usuarios' },
  { name: 'users:edit', module: 'Usuarios', description: 'Editar usuarios existentes' },
  { name: 'users:delete', module: 'Usuarios', description: 'Eliminar usuarios' },
  { name: 'students:view', module: 'Estudiantes', description: 'Ver lista de estudiantes' },
  { name: 'students:create', module: 'Estudiantes', description: 'Registrar nuevos estudiantes' },
  { name: 'students:edit', module: 'Estudiantes', description: 'Editar información de estudiantes' },
  { name: 'students:delete', module: 'Estudiantes', description: 'Eliminar estudiantes' },
  { name: 'students:export', module: 'Estudiantes', description: 'Exportar datos de estudiantes' },
  { name: 'tutors:view', module: 'Tutores', description: 'Ver lista de tutores' },
  { name: 'tutors:create', module: 'Tutores', description: 'Registrar nuevos tutores' },
  { name: 'tutors:edit', module: 'Tutores', description: 'Editar información de tutores' },
  { name: 'tutors:delete', module: 'Tutores', description: 'Eliminar tutores' },
  { name: 'institutions:view', module: 'Instituciones', description: 'Ver lista de instituciones' },
  { name: 'institutions:create', module: 'Instituciones', description: 'Registrar nuevas instituciones' },
  { name: 'institutions:edit', module: 'Instituciones', description: 'Editar información de instituciones' },
  { name: 'institutions:delete', module: 'Instituciones', description: 'Eliminar instituciones' },
  { name: 'practices:view', module: 'Prácticas', description: 'Ver prácticas profesionales' },
  { name: 'practices:create', module: 'Prácticas', description: 'Registrar nuevas prácticas' },
  { name: 'practices:edit', module: 'Prácticas', description: 'Editar prácticas' },
  { name: 'practices:delete', module: 'Prácticas', description: 'Eliminar prácticas' },
  { name: 'practices:evaluate', module: 'Prácticas', description: 'Evaluar prácticas' },
  { name: 'periods:view', module: 'Periodos', description: 'Ver periodos académicos' },
  { name: 'periods:create', module: 'Periodos', description: 'Crear nuevos periodos' },
  { name: 'periods:edit', module: 'Periodos', description: 'Editar periodos' },
  { name: 'periods:delete', module: 'Periodos', description: 'Eliminar periodos' },
  { name: 'backups:view', module: 'Respaldos', description: 'Ver lista de respaldos' },
  { name: 'backups:create', module: 'Respaldos', description: 'Crear respaldos' },
  { name: 'backups:restore', module: 'Respaldos', description: 'Restaurar respaldos' },
  { name: 'backups:delete', module: 'Respaldos', description: 'Eliminar respaldos' },
  { name: 'reports:view', module: 'Reportes', description: 'Ver reportes' },
  { name: 'reports:export', module: 'Reportes', description: 'Exportar reportes' },
  { name: 'config:view', module: 'Configuración', description: 'Ver configuración del sistema' },
  { name: 'config:edit', module: 'Configuración', description: 'Modificar configuración del sistema' },
  { name: 'careers:view', module: 'Carreras', description: 'Ver carreras' },
  { name: 'careers:create', module: 'Carreras', description: 'Crear carreras' },
  { name: 'careers:edit', module: 'Carreras', description: 'Editar carreras' },
  { name: 'careers:delete', module: 'Carreras', description: 'Eliminar carreras' },
  { name: 'requests:view', module: 'Solicitudes', description: 'Ver solicitudes' },
  { name: 'requests:approve', module: 'Solicitudes', description: 'Aprobar/rechazar solicitudes' },
  { name: 'dashboard:view', module: 'Dashboard', description: 'Ver dashboard y estadísticas' },
  { name: 'enrollments:view', module: 'Inscripciones', description: 'Ver inscripciones' },
  { name: 'enrollments:create', module: 'Inscripciones', description: 'Crear inscripciones' },
  { name: 'enrollments:edit', module: 'Inscripciones', description: 'Editar inscripciones' },
  { name: 'enrollments:delete', module: 'Inscripciones', description: 'Eliminar inscripciones' },
  { name: 'tracking:view', module: 'Seguimiento', description: 'Ver seguimiento de prácticas' },
  { name: 'tracking:create', module: 'Seguimiento', description: 'Registrar seguimiento' },
  { name: 'tracking:edit', module: 'Seguimiento', description: 'Editar seguimiento' },
  { name: 'tracking:delete', module: 'Seguimiento', description: 'Eliminar seguimiento' },
  { name: 'evaluations:view', module: 'Evaluaciones', description: 'Ver evaluaciones' },
  { name: 'evaluations:create', module: 'Evaluaciones', description: 'Crear evaluaciones' },
  { name: 'evaluations:edit', module: 'Evaluaciones', description: 'Editar evaluaciones' },
  { name: 'evaluations:delete', module: 'Evaluaciones', description: 'Eliminar evaluaciones' },
  { name: 'notifications:view', module: 'Notificaciones', description: 'Ver notificaciones' },
  { name: 'notifications:send', module: 'Notificaciones', description: 'Enviar notificaciones' },
  { name: 'lists:view', module: 'Listas', description: 'Ver listas del sistema' },
  { name: 'lists:edit', module: 'Listas', description: 'Editar listas del sistema' },
  { name: 'manuals:view', module: 'Manuales', description: 'Ver manuales' },
  { name: 'manuals:edit', module: 'Manuales', description: 'Crear/editar manuales' },
  { name: 'internship-types:view', module: 'Tipos de Pasantía', description: 'Ver tipos de pasantía' },
  { name: 'internship-types:edit', module: 'Tipos de Pasantía', description: 'Crear/editar tipos de pasantía' },
  { name: 'roles:manage', module: 'Configuración', description: 'Gestionar roles y permisos' },
  { name: 'culmination:approve', module: 'Culminación', description: 'Aprobar culminación de prácticas' },
  { name: 'activity-logs:view', module: 'Bitácora', description: 'Ver bitácora de actividades' },
  { name: 'activity-logs:create', module: 'Bitácora', description: 'Registrar en bitácora' },
];

const ROLE_PERMISSION_MAP: Record<number, string[]> = {
  1: PERMISSION_SEED_DATA.map(p => p.name),
  2: ['users:view', 'students:view', 'students:create', 'students:edit', 'students:export',
      'tutors:view', 'institutions:view', 'practices:view', 'practices:create', 'practices:edit',
      'periods:view', 'periods:create', 'periods:edit', 'reports:view', 'reports:export',
      'careers:view', 'careers:create', 'careers:edit', 'requests:view', 'requests:approve',
      'enrollments:view', 'enrollments:create', 'enrollments:edit',
      'tracking:view', 'tracking:create', 'tracking:edit',
      'evaluations:view', 'evaluations:create', 'evaluations:edit',
      'notifications:view', 'notifications:send',
      'lists:view', 'manuals:view',
      'internship-types:view',
      'activity-logs:view',
      'dashboard:view'],
  3: ['students:view', 'students:export', 'tutors:view', 'practices:view', 'practices:evaluate',
      'reports:view', 'requests:view', 'requests:approve',
      'tracking:view', 'tracking:create', 'tracking:edit',
      'evaluations:view', 'evaluations:create', 'evaluations:edit',
      'notifications:view',
      'activity-logs:view',
      'dashboard:view'],
  4: ['students:view', 'practices:view', 'reports:view', 'requests:view',
      'tracking:view',
      'evaluations:view',
      'notifications:view',
      'activity-logs:view', 'activity-logs:create',
      'dashboard:view'],
};

/**
 * Obtiene el detalle completo de un usuario por su ID.
 * Incluye datos personales, clave activa y roles.
 */
export const getUserDetail = async (userId: number) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_user')
      .select(`
        USER_ID, USER, USER_CI, person_id, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
        EMAIL, PHONE_NUMBER, STATUS, STATUS_SESSION, FAILED_ATTEMPTS, LOCK_DATE,
        FORCE_PASSWORD_CHANGE, LOGIN, TERMS_CONDITIONS, CREATION_DATE,
        t_user_key(
          IS_TEMPORARY, START_DATE, END_DATE, STATUS
        ),
        t_user_roles(
          ID_ROLES,
          t_roles(NAME)
        )
      `)
      .eq('USER_ID', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const err = new Error('Usuario no encontrado') as ServiceError;
      err.code = 'USER_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const user = data as any;
    const key = user.t_user_key?.[0];
    const roleInfo = user.t_user_roles?.[0];

    return {
      id: user.USER_ID,
      user: user.USER,
      userCi: user.USER_CI,
      personId: user.person_id,
      firstName: user.NAME,
      secondName: user.SECOND_NAME,
      lastName: user.SURNAME,
      secondSurname: user.SECOND_SURNAME,
      email: user.EMAIL,
      phoneNumber: user.PHONE_NUMBER,
      status: user.STATUS,
      statusSession: user.STATUS_SESSION,
      failedAttempts: user.FAILED_ATTEMPTS,
      lockDate: user.LOCK_DATE,
      forcePasswordChange: user.FORCE_PASSWORD_CHANGE,
      loginCount: user.LOGIN,
      termsConditions: user.TERMS_CONDITIONS,
      creationDate: user.CREATION_DATE,
      role: roleInfo?.ID_ROLES ?? 0,
      roleName: roleInfo?.t_roles?.NAME ?? '',
      key: key ? {
        isTemporary: key.IS_TEMPORARY,
        startDate: key.START_DATE,
        endDate: key.END_DATE,
        status: key.STATUS
      } : null
    };
  });
};

export const ensureRolesSeeded = async (): Promise<void> => {
  try {
    const supabase = dbManager.getConnection();

    for (const role of ROLE_SEED_DATA) {
      const { error } = await supabase
        .from('t_roles')
        .upsert({
          ID_ROLS: role.id,
          NAME: role.name,
          DESCRIPTION: role.description,
          IS_SYSTEM: role.isSystem,
          STATUS: 1,
          MODIF_USER_ID: 0,
          MODIF_USER_DATE: new Date().toISOString(),
          ELIM_USER_ID: 0,
          ELIM_USER_DATE: new Date().toISOString(),
          REST_USER_ID: 0,
          REST_USER_DATE: new Date().toISOString(),
        }, { onConflict: 'ID_ROLS' });

      if (error && error.code !== 'PGRST116') throw error;
    }

    for (const perm of PERMISSION_SEED_DATA) {
      const { error } = await supabase
        .from('t_permissions')
        .upsert({
          NAME: perm.name,
          MODULE: perm.module,
          DESCRIPTION: perm.description,
          STATUS: 1,
          MODIF_USER_ID: 0,
          MODIF_USER_DATE: new Date().toISOString(),
          ELIM_USER_ID: 0,
          ELIM_USER_DATE: new Date().toISOString(),
          REST_USER_ID: 0,
          REST_USER_DATE: new Date().toISOString(),
        }, { onConflict: 'NAME' });

      if (error && error.code !== 'PGRST116') throw error;
    }

    const { data: allPerms } = await supabase
      .from('t_permissions')
      .select('PERMISSIONS_ID, NAME');

    const permNameToId = new Map<string, number>();
    (allPerms || []).forEach((p: { PERMISSIONS_ID: number; NAME: string }) => {
      permNameToId.set(p.NAME, p.PERMISSIONS_ID);
    });

    for (const [roleId, permNames] of Object.entries(ROLE_PERMISSION_MAP)) {
      const permIds = permNames
        .map(name => permNameToId.get(name))
        .filter((id): id is number => id !== undefined);

      if (permIds.length === 0) continue;

      const { data: existingPerms } = await supabase
        .from('t_roles_permissions')
        .select('PERMISSIONS_ID')
        .eq('ROLES_ID', parseInt(roleId));

      const existingIds = new Set((existingPerms || []).map((p: { PERMISSIONS_ID: number }) => p.PERMISSIONS_ID));

      const newPerms = permIds
        .filter(id => !existingIds.has(id))
        .map(permId => ({
          ROLES_ID: parseInt(roleId),
          PERMISSIONS_ID: permId,
        }));

      if (newPerms.length > 0) {
        const { error } = await supabase
          .from('t_roles_permissions')
          .insert(newPerms);

        if (error && error.code !== 'PGRST116') {
          console.error(`[Users] Error seeding permissions for role ${roleId}:`, error);
        }
      }
    }

    console.log('[Users] Roles and permissions seeded successfully');
  } catch (error) {
    console.error('[Users] Error seeding roles:', error);
  }
};
