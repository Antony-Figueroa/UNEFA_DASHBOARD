import { dbManager } from '../lib/db-manager.js';
import { hashPassword } from '../utils/auth.utils.js';
import { personService } from './person.service.js';

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
  PERSON_ID: number | null;
  t_user_roles: { ID_ROLES: number }[];
}

export const getUsers = async (filters: { role?: number, status?: number, search?: string, name?: string, surname?: string, userCi?: string }, page: number, limit: number) => {
  return await dbManager.withRetry(async (supabase) => {
    // Si hay filtro por rol, primero obtener los IDs de usuarios con ese rol
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
      .select('USER_ID, USER_CI, NAME, SURNAME, EMAIL, STATUS, CREATION_DATE, PERSON_ID, t_user_roles(ID_ROLES)', { count: 'exact' });

    // Aplicar filtro por IDs de usuarios con el rol especificado
    if (userIdsWithRole !== undefined) {
      if (userIdsWithRole.length === 0) {
        // No hay usuarios con ese rol, retornar vacío
        return {
          users: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page
        };
      }
      query = query.in('USER_ID', userIdsWithRole);
    }

    if (filters.status !== undefined) {
      query = query.eq('STATUS', filters.status);
    }
    if (filters.search) {
      query = query.or(`NAME.ilike.%${filters.search}%,SURNAME.ilike.%${filters.search}%,USER_CI.ilike.%${filters.search}%`);
    }
    if (filters.name) {
      query = query.ilike('NAME', `%${filters.name}%`);
    }
    if (filters.surname) {
      query = query.ilike('SURNAME', `%${filters.surname}%`);
    }
    if (filters.userCi) {
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

    // Obtener IDs de usuarios con actividad en t_auth_log para marcar isInUse
    // Hacemos una consulta separada para evitar problemas de joins sin foreign keys
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

    return {
      users: (data as unknown as SupabaseUser[]).map((u) => ({
        id: u.USER_ID,
        userCi: u.USER_CI,
        name: u.NAME,
        surname: u.SURNAME,
        email: u.EMAIL,
        role: u.t_user_roles?.[0]?.ID_ROLES,
        status: u.STATUS,
        creationDate: u.CREATION_DATE,
        isInUse: usersWithActivity.has(u.USER_ID),
        personId: u.PERSON_ID ?? undefined,
      })),
      totalCount: count || 0,
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

    // 1. Crear persona en t_persons
    let personId: number;
    try {
      const person = await personService.createPerson({
        ci: userData.userCi,
        firstName: userData.name,
        lastName: userData.surname,
        email: userData.email,
      });
      personId = person.personId;
    } catch (personError: unknown) {
      const pErr = personError as { code?: string; status?: number };
      if (pErr.code === 'PERSON_ALREADY_EXISTS') {
        // La persona ya existe por CI — usar la existente
        const existingPerson = await personService.getPersonByCi(userData.userCi);
        personId = existingPerson!.personId;
        // Actualizar datos de la persona existente
        await personService.updatePerson(personId, {
          firstName: userData.name,
          lastName: userData.surname,
          email: userData.email,
        });
      } else {
        throw personError;
      }
    }

    // 2. Crear usuario
    const { data: newUser, error: userError } = await supabase
      .from('t_user')
      .insert({
        PERSON_ID: personId,
        USER: userData.userCi,
        USER_CI: userData.userCi,
        NAME: userData.name,
        SURNAME: userData.surname,
        EMAIL: userData.email,
        STATUS: 1,
        FORCE_PASSWORD_CHANGE: true,
        LOGIN: 0,
        CREATION_DATE: new Date().toISOString(),
        TERMS_CONDITIONS: '0',
        STATUS_SESSION: 2
      })
      .select()
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

    // 4. Asignar rol
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

    // Retornar el usuario con los campos transformados (igual que en getUsers)
    return {
      id: newUser.USER_ID,
      userCi: newUser.USER_CI,
      name: newUser.NAME,
      surname: newUser.SURNAME,
      email: newUser.EMAIL,
      role: userData.role || 2,
      status: newUser.STATUS,
      creationDate: newUser.CREATION_DATE,
      personId: newUser.PERSON_ID ?? undefined,
    };
  });
};

export const updateUser = async (userId: number, userData: UserData) => {
  return await dbManager.withRetry(async (supabase) => {
    // 1. Obtener el usuario actual para conocer su PERSON_ID
    const { data: currentUser, error: fetchError } = await supabase
      .from('t_user')
      .select('PERSON_ID')
      .eq('USER_ID', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!currentUser) {
      const error = new Error('Usuario no encontrado') as ServiceError;
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    // 2. Actualizar persona en t_persons
    if (currentUser.PERSON_ID) {
      await personService.updatePerson(currentUser.PERSON_ID, {
        firstName: userData.name,
        lastName: userData.surname,
        email: userData.email,
      });
    }

    // 3. Actualizar usuario
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
        .eq('ID_USER', userId);

      if (roleError) throw roleError;
    }

    return updatedUser;
  });
};

export const deleteUser = async (userId: number): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from('t_user')
      .update({ STATUS: 0 })
      .eq('USER_ID', userId);

    if (error) throw error;
  });
};

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

export const ensureRolesSeeded = async (): Promise<void> => {
  try {
    const rolesToSeed = [
      { id: 1, name: 'ADMIN', description: 'Administrador con acceso total al sistema' },
      { id: 2, name: 'ASISTENTE', description: 'Asistente con permisos de solo lectura' },
    ];

    for (const role of rolesToSeed) {
      await dbManager.withRetry(async (supabase) => {
        const { error } = await supabase
          .from('t_roles')
          .upsert({
            ID_ROLS: role.id,
            NAME: role.name,
            DESCRIPTION: role.description,
            STATUS: 1,
            MODIF_USER_ID: 0,
            MODIF_USER_DATE: new Date().toISOString(),
            ELIM_USER_ID: 0,
            ELIM_USER_DATE: new Date().toISOString(),
            REST_USER_ID: 0,
            REST_USER_DATE: new Date().toISOString(),
          }, { onConflict: 'ID_ROLS' });
        
        if (error && error.code !== 'PGRST116') throw error;
      });
    }
    console.log('[Users] Roles seeded successfully');
  } catch (error) {
    console.error('[Users] Error seeding roles:', error);
  }
};
