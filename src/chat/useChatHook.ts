import { useCallback, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { sendChatMessage } from '../services/chat';
import { ChatMessage, UserType } from './type';

const MAX_HISTORICO = 6;
const MAX_CONTEUDO = 1000;
export const LIMITE_MENSAGEM = 500;

type ChatConfig = {
  inicial: string;
  sugestoes: string[];
  sugestoesAlternativas: string[];
};

const CONFIG: Record<UserType, ChatConfig> = {
  CLIENT: {
    inicial:
      'Oi! Sou o assistente do ConectaPro. Posso explicar como a plataforma funciona ou indicar o tipo de profissional certo para o seu problema.',
    sugestoes: [
      'Meu chuveiro queimou',
      'Quanto custa assinar um plano?',
      'O que é o selo verificado?',
    ],
    sugestoesAlternativas: [
      'Tenho um vazamento na pia',
      'Quanto é a taxa da plataforma?',
      'Quando recebo o contato do profissional?',
    ],
  },
  PROFESSIONAL: {
    inicial:
      'Oi! Sou o assistente do ConectaPro. Posso te ajudar com planos, selo verificado, pagamentos e gestão das suas demandas.',
    sugestoes: [
      'Como recebo o pagamento dos serviços?',
      'Como funciona o selo verificado?',
      'Como aumento minha reputação?',
    ],
    sugestoesAlternativas: [
      'Como gerenciar minhas demandas?',
      'Quais são os planos disponíveis?',
      'Por que não apareço nas buscas?',
    ],
  },
};

export const getChatConfig = (userType: UserType) => CONFIG[userType];

const montarHistorico = (lista: ChatMessage[]) =>
  lista
    .filter((m) => m.texto && !m.erro)
    .slice(-MAX_HISTORICO)
    .map((m) => ({
      role: m.autor === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.texto.slice(0, MAX_CONTEUDO),
    }));

export function useChat(userType: UserType) {
  const mensagemInicial: ChatMessage = {
    autor: 'assistant',
    texto: CONFIG[userType].inicial,
  };

  const [mensagens, setMensagens] = useState<ChatMessage[]>([mensagemInicial]);
  const [enviando, setEnviando] = useState(false);

  const mensagensRef = useRef<ChatMessage[]>([mensagemInicial]);
  const enviandoRef = useRef(false);
  const userTypeRef = useRef(userType);
  userTypeRef.current = userType;

  const recomecar = useCallback(() => {
    const nova = [{ autor: 'assistant' as const, texto: CONFIG[userTypeRef.current].inicial }];
    mensagensRef.current = nova;
    setMensagens(nova);
  }, []);

  const enviar = useCallback(async (perguntaBruta: string) => {
    const pergunta = String(perguntaBruta || '').trim();
    if (!pergunta || enviandoRef.current) return;

    const historicoParaEnviar = montarHistorico(mensagensRef.current);

    enviandoRef.current = true;
    setEnviando(true);

    const userMsg: ChatMessage = { autor: 'user', texto: pergunta };
    mensagensRef.current = [...mensagensRef.current, userMsg];
    setMensagens((prev) => [...prev, userMsg]);

    try {
      const resposta = await sendChatMessage({
        message: pergunta.slice(0, LIMITE_MENSAGEM),
        history: historicoParaEnviar,
      });

      const { answer, suggestedCategory, sources, found } = resposta;
      const assistantMsg: ChatMessage = {
        autor: 'assistant',
        texto: answer || 'Não consegui formular uma resposta agora.',
        categoria: found ? suggestedCategory || null : null,
        fontes: found && Array.isArray(sources) ? sources : [],
        semResposta: !found,
      };
      mensagensRef.current = [...mensagensRef.current, assistantMsg];
      setMensagens((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const status = (error as AxiosError<any>)?.response?.status;
      const textoErro =
        status === 429
          ? (error as AxiosError<any>)?.response?.data?.message ||
          'Muitas perguntas em pouco tempo. Tente novamente mais tarde.'
          : 'Não consegui falar com o assistente agora. Verifique sua conexão e tente de novo.';
      const erroMsg: ChatMessage = {
        autor: 'assistant',
        texto: textoErro,
        erro: true,
      };
      mensagensRef.current = [...mensagensRef.current, erroMsg];
      setMensagens((prev) => [...prev, erroMsg]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, []);

  return { mensagens, enviando, enviar, recomecar };
}
