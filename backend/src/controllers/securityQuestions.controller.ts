import { Request, Response } from 'express';
import { supabase } from "../lib/supabase.js";
import { AuthRequest } from '../middlewares/auth.middleware.js';

interface PresetQuestion {
  PRESET_QUESTION_ID: number;
  DESCRIPTION: string;
}

interface UserQuestion {
  USER_QUESTION_ID: number;
  USER_ID: number;
  QUESTION_TYPE: 'PRESET' | 'CUSTOM';
  PRESET_QUESTION_ID: number | null;
  CUSTOM_QUESTION: string | null;
  ANSWER: string;
  ORDER_NUM: number;
}

export const getPresetQuestions = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('t_preset_questions')
      .select('PRESET_QUESTION_ID, DESCRIPTION')
      .eq('STATUS', 1)
      .order('PRESET_QUESTION_ID');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching preset questions:', error);
    res.status(500).json({ success: false, message: 'Error al obtener preguntas predefinidas' });
  }
};

export const getUserQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const { data: userQuestions, error } = await supabase
      .from('t_user_questions')
      .select(`
        USER_QUESTION_ID,
        USER_ID,
        QUESTION_TYPE,
        PRESET_QUESTION_ID,
        CUSTOM_QUESTION,
        ANSWER,
        ORDER_NUM
      `)
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .order('ORDER_NUM');

    if (error) throw error;

    const { data: presetQuestions } = await supabase
      .from('t_preset_questions')
      .select('PRESET_QUESTION_ID, DESCRIPTION')
      .eq('STATUS', 1);

    const questionsWithDescription = (userQuestions || []).map((q: UserQuestion) => {
      let questionText = '';
      if (q.QUESTION_TYPE === 'PRESET' && q.PRESET_QUESTION_ID) {
        const preset = presetQuestions?.find((p: PresetQuestion) => p.PRESET_QUESTION_ID === q.PRESET_QUESTION_ID);
        questionText = preset?.DESCRIPTION || '';
      } else {
        questionText = q.CUSTOM_QUESTION || '';
      }

      return {
        ...q,
        questionText,
        hasAnswer: !!q.ANSWER
      };
    });

    res.json({ 
      success: true, 
      data: questionsWithDescription,
      hasQuestions: (userQuestions || []).length >= 3
    });
  } catch (error) {
    console.error('Error fetching user questions:', error);
    res.status(500).json({ success: false, message: 'Error al obtener preguntas del usuario' });
  }
};

export const saveUserQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Debe configurar al menos 3 preguntas de seguridad' 
      });
    }

    for (const q of questions) {
      if (!q.answer || q.answer.trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todas las respuestas deben tener al menos 2 caracteres' 
        });
      }
    }

    const { error: deleteError } = await supabase
      .from('t_user_questions')
      .delete()
      .eq('USER_ID', userId);

    if (deleteError) throw deleteError;

    const questionsToInsert = questions.map((q: any, index: number) => ({
      USER_ID: userId,
      QUESTION_TYPE: q.questionType || 'PRESET',
      PRESET_QUESTION_ID: q.questionType === 'PRESET' ? q.presetQuestionId : null,
      CUSTOM_QUESTION: q.questionType === 'CUSTOM' ? q.customQuestion : null,
      ANSWER: q.answer.toLowerCase().trim(),
      ORDER_NUM: index + 1,
      STATUS: 1,
      CREATED_AT: new Date().toISOString(),
      UPDATED_AT: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('t_user_questions')
      .insert(questionsToInsert);

    if (insertError) throw insertError;

    res.json({ success: true, message: 'Preguntas de seguridad guardadas correctamente' });
  } catch (error) {
    console.error('Error saving user questions:', error);
    res.status(500).json({ success: false, message: 'Error al guardar preguntas de seguridad' });
  }
};

export const verifySecurityAnswer = async (req: Request, res: Response) => {
  try {
    const { userId, questionId, answer } = req.body;

    if (!userId || !questionId || !answer) {
      return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    const { data, error } = await supabase
      .from('t_user_questions')
      .select('ANSWER')
      .eq('USER_ID', userId)
      .eq('USER_QUESTION_ID', questionId)
      .eq('STATUS', 1)
      .single();

    if (error || !data) {
      return res.json({ success: false, isCorrect: false });
    }

    const isCorrect = (data as UserQuestion).ANSWER.toLowerCase() === answer.toLowerCase().trim();

    res.json({ success: true, isCorrect });
  } catch (error) {
    console.error('Error verifying answer:', error);
    res.status(500).json({ success: false, message: 'Error al verificar respuesta' });
  }
};

export const checkUserHasQuestions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { count, error } = await supabase
      .from('t_user_questions')
      .select('*', { count: 'exact', head: true })
      .eq('USER_ID', userId)
      .eq('STATUS', 1);

    if (error) throw error;

    res.json({ 
      success: true, 
      hasQuestions: (count || 0) >= 3,
      count: count || 0
    });
  } catch (error) {
    console.error('Error checking user questions:', error);
    res.status(500).json({ success: false, message: 'Error al verificar preguntas' });
  }
};
