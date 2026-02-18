// ============================================
// Message Types
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: MessageAction[];
  status?: MessageStatus;
  metadata?: MessageMetadata;
}

export type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming';

export interface MessageAction {
  type: 'navigate' | 'download' | 'copy' | 'execute' | 'openModal';
  label: string;
  icon?: string;
  payload: any;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface MessageMetadata {
  model?: string;
  tokensUsed?: number;
  processingTime?: number;
  sources?: string[];
}

// ============================================
// Chat Session Types
// ============================================

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  context?: ChatContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContext {
  feature?: 'students' | 'periods' | 'careers' | 'tracking' | 'general';
  entityId?: string;
  entityType?: string;
  userRole?: number;
  metadata?: Record<string, any>;
}

// ============================================
// AI Provider Types
// ============================================

export interface AIProvider {
  name: string;
  type: 'google-ai-studio' | 'openrouter' | 'custom';
  apiKey: string;
  baseURL: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing?: ModelPricing;
}

export interface ModelPricing {
  inputPerMToken: number;  // Price per million tokens
  outputPerMToken: number;
}

// ============================================
// Request/Response Types
// ============================================

export interface ChatRequest {
  messages: Message[];
  systemInstruction?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  context?: ChatContext;
}

export interface ChatResponse {
  id: string;
  message: Message;
  usage?: TokenUsage;
  model: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ============================================
// Hook Return Types
// ============================================

export interface UseAIChatReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  retryLastMessage: () => Promise<void>;
  currentSession: ChatSession | null;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  suggestions: string[];
}

// ============================================
// Configuration Types
// ============================================

export interface AIConfig {
  primaryProvider: AIProvider;
  fallbackProvider?: AIProvider;
  defaultModel: string;
  systemPrompt: string;
  maxHistoryLength: number;
  enableStreaming: boolean;
  enableSuggestions: boolean;
}

// ============================================
// Component Props Types
// ============================================

export interface FloatingChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: ChatContext;
}

export interface MessageBubbleProps {
  message: Message;
  isAI: boolean;
  onActionClick?: (action: MessageAction) => void;
}

export interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
  allowAttachments?: boolean;
}

export interface AISuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  maxVisible?: number;
}

export interface TypingIndicatorProps {
  isVisible?: boolean;
}

export interface ChatHeaderProps {
  model?: string;
  onBackClick?: () => void;
  onClearChat?: () => void;
  onSettingsClick?: () => void;
  onHistoryToggle?: () => void;
}

export interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming?: boolean;
  onActionClick?: (action: MessageAction) => void;
}

export interface ChatWindowProps {
  initialContext?: ChatContext;
}

