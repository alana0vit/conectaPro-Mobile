export type UserType = 'CLIENT' | 'PROFESSIONAL';

export type ChatAuthor = 'user' | 'assistant';

export type ChatMessage = {
  autor: ChatAuthor;
  texto: string;
  categoria?: string | null;
  fontes?: string[];
  semResposta?: boolean;
  erro?: boolean;
};

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatRequestPayload = {
  message: string;
  history: ChatHistoryItem[];
};

export type ChatResponse = {
  answer: string;
  suggestedCategory?: string | null;
  sources?: string[];
  found: boolean;
};
