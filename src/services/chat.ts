import { ChatRequestPayload, ChatResponse } from '../chat/type';
import api from './api';

export const sendChatMessage = async (
  payload: ChatRequestPayload
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/api/chat', payload);
  return response.data;
};

// A lista de categorias é estável; resolver uma única vez por sessão
// evita N chamadas quando o usuário encadeia sugestões de categoria.
let categoriasCache: Array<{ id: number; name: string }> | null = null;

export const resolveCategoryId = async (
  nome?: string | null
): Promise<number | null> => {
  if (!nome) return null;
  try {
    if (!categoriasCache) {
      const resposta = await api.get('/api/category');
      categoriasCache = Array.isArray(resposta.data) ? resposta.data : [];
    }
    const alvo = nome.trim().toLowerCase();
    const encontrada = categoriasCache!.find(
      (c) => String(c.name || '').trim().toLowerCase() === alvo
    );
    return encontrada?.id ?? null;
  } catch {
    return null;
  }
};
