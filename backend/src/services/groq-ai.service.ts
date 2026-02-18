import { Groq } from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || '';

if (!apiKey) {
  console.warn('[Groq] GROQ_API_KEY no configurada en .env');
}

export const groq = new Groq({ apiKey, dangerouslyAllowBrowser: false });

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

const formatMessages = (messages: ChatMessage[]) => {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content
    }));
};

export const streamChat = async (
  params: StreamChatParams,
  onChunk: (text: string) => void
): Promise<string> => {
  const model = 'llama-3.3-70b-versatile';

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system' as const, content: params.systemInstruction },
      ...formatMessages(params.messages)
    ],
    max_tokens: params.maxTokens || 4096,
    temperature: params.temperature || 0.7,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullText += content;
      onChunk(content);
    }
  }

  return fullText;
};

export const sendChat = async (params: StreamChatParams): Promise<string> => {
  const model = 'llama-3.3-70b-versatile';

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system' as const, content: params.systemInstruction },
      ...formatMessages(params.messages)
    ],
    max_tokens: params.maxTokens || 4096,
    temperature: params.temperature || 0.7,
  });

  return completion.choices[0]?.message?.content || '';
};
