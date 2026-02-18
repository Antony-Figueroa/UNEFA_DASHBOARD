import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_KEY || '';
const modelName = process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash';

if (!apiKey) {
  console.warn('[GoogleAI] GOOGLE_AI_KEY no configurada en .env');
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChatParams {
  messages: ChatMessage[];
  systemInstruction: string;
  maxTokens?: number;
  temperature?: number;
}

const formatMessages = (messages: ChatMessage[]): Content[] => {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }] as Part[]
    }));
};

export const streamChat = async (
  params: StreamChatParams,
  onChunk: (text: string) => void
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: params.systemInstruction,
    generationConfig: {
      maxOutputTokens: params.maxTokens || 4096,
      temperature: params.temperature || 0.7,
    }
  });

  const contents = formatMessages(params.messages);
  const result = await model.generateContentStream({ contents });

  let fullText = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
};

export const sendChat = async (params: StreamChatParams): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: params.systemInstruction,
    generationConfig: {
      maxOutputTokens: params.maxTokens || 4096,
      temperature: params.temperature || 0.7,
    }
  });

  const contents = formatMessages(params.messages);
  const result = await model.generateContent({ contents });

  return result.response.text();
};
