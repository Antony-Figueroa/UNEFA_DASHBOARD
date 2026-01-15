import { dbManager } from '../lib/db-manager.js';
import { hashPassword } from '../utils/auth.utils.js';
import { encrypt } from '../utils/security.utils.js';

interface UserData {
  userCi: string;
  name: string;
  surname: string;
  email: string;
  role?: number;
  status?: number;
}

interface SupabaseUser {
  USER_ID: number;
  USER_CI: string;
  NAME: string;
  SURNAME: string;
  EMAIL: string;
  STATUS: number;
  CREATION_DATE: string;
  t_user_roles: { ID_ROLES: number }[];
}

export const getUsers = async (filters: { role?: number, status?: number, search?: string }, page: number, limit: number) => {
  return await dbManager.withRetry(async (supabase) => {
    let query = supabase
      .from('t_user')
      .select('USER_ID, USER_CI, NAME, SURNAME, EMAIL, STATUS, CREATION_DATE, t_user_roles(ID_ROLES)', { count: 'exact' });

    if (filters.role) {
      query = query.eq('t_user_roles.ID_ROLES', filters.role);
    }
    if (filters.status !== undefined) {
      query = query.eq('STATUS', filters.status);
    }
    if (filters.search) {
      query = query.or(`NAME.ilike.%${filters.search}%,SURNAME.ilike.%${filters.search}%,USER_CI.ilike.%${filters.search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order('USER_ID', { ascending: false });

    if (error) throw error;

    return {
      users: (data as unknown as SupabaseUser[]).map((u) => ({
        id: u.USER_ID,
        userCi: u.USER_CI,
        name: u.NAME,
        surname: u.SURNAME,
        email: u.EMAIL,
        role: u.t_user_roles?.[0]?.ID_ROLES,
        status: u.STATUS,
        creationDate: u.CREATION_DATE
      })),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    };
  });
};

interface ServiceError extends Error {
  code?: string;
  status?: number;
}

export const createUser = async (userData: UserData, tempPass: string) => {
  return await dbManager.withRetry(async (supabase) => {
    // 0. Verificar si el usuario ya existe (CI o Email)
    const { data: existingUser, error: checkError } = await supabase
      .from('t_user')
      .select('USER_CI, EMAIL')
      .or(`USER_CI.eq.${userData.userCi},EMAIL.eq.${userData.email}`)
      .maybeSingle();

    if (checkError) {
      console.error('[UserService] Error checking for existing user:', checkError);
      throw checkError;
    }

    if (existingUser) {
      const conflict = existingUser.USER_CI === userData.userCi ? 'cédula' : 'correo electrónico';
      const error = new Error(`Ya existe un usuario con este ${conflict}`) as ServiceError;
      error.code = 'USER_ALREADY_EXISTS';
      error.status = 409;
      throw error;
    }

    // 1. Crear usuario
    const { data: newUser, error: userError } = await supabase
      .from('t_user')
      .insert({
        USER: userData.userCi, // Usar CI como nombre de usuario por defecto
        USER_CI: userData.userCi,
        NAME: userData.name,
        SURNAME: userData.surname,
        EMAIL: userData.email,
        STATUS: 1,
        FORCE_PASSWORD_CHANGE: true,
        LOGIN: 0,
        CREATION_DATE: new Date().toISOString(),
        TERMS_CONDITIONS: '0',
        STATUS_SESSION: 2 // Inactivo por defecto hasta primer login
      })
      .select()
      .single();

    if (userError) {
      console.error('[UserService] Error inserting into t_user:', userError);
      throw userError;
    }

    // 2. Crear clave temporal
    const hashedPassword = await hashPassword(tempPass);
    const encryptedPassword = encrypt(tempPass); // Encriptación reversible para Admin Maestro

    const { error: keyError } = await supabase
      .from('t_user_key')
      .insert({
        USER_ID: newUser.USER_ID,
        KEY: hashedPassword,
        ENCRYPTED_KEY: encryptedPassword, // Nuevo campo para visualización segura
        STATUS: 1,
        IS_TEMPORARY: true,
        START_DATE: new Date().toISOString(),
        END_DATE: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
        MODIF_USER_ID: 1, // Sistema
        MODIF_USER_DATE: new Date().toISOString(),
        ELIM_USER_ID: 1,
        ELIM_USER_DATE: new Date().toISOString(),
        REST_USER_ID: 1,
        REST_USER_DATE: new Date().toISOString()
      });

    if (keyError) {
      console.error('[UserService] Error inserting into t_user_key:', keyError);
      throw keyError;
    }

    // 3. Asignar rol
    const { error: roleError } = await supabase
      .from('t_user_roles')
      .insert({
        ID_USER: newUser.USER_ID,
        ID_ROLES: userData.role || 2 // Por defecto Asistente
      });

    if (roleError) {
      console.error('[UserService] Error inserting into t_user_roles:', roleError);
      throw roleError;
    }

    return newUser;
  });
};

export const updateUser = async (userId: number, userData: UserData) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data: updatedUser, error: userError } = await supabase
      .from('t_user')
      .update({
        NAME: userData.name,
        SURNAME: userData.surname,
        EMAIL: userData.email,
        STATUS: userData.status
      })
      .eq('USER_ID', userId)
      .select()
      .single();

    if (userError) throw userError;

    // Actualizar rol si se proporcionó
    if (userData.role) {
      const { error: roleError } = await supabase
        .from('t_user_roles')
        .update({ ID_ROLES: userData.role })
        .eq('USER_ID', userId);

      if (roleError) throw roleError;
    }

    return updatedUser;
  });
}

export const saveSecurityQuestions = async (userId: number, questions: { questionId: number, answer: string }[]) => {
  return await dbManager.withRetry(async (supabase) => {
    // Eliminar anteriores
    await supabase.from('t_security_questions').delete().eq('USER_ID', userId);

    const questionsToInsert = questions.map(q => ({
      USER_ID: userId,
      PRESET_QUESTION_ID: q.questionId,
      ANSWER: q.answer
    }));

    const { error } = await supabase.from('t_security_questions').insert(questionsToInsert);
    if (error) throw error;
    
    return true;
  });
};
