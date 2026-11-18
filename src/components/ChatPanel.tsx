import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat, LIMITE_MENSAGEM, getChatConfig } from '../chat/useChatHook';
import { resolveCategoryId } from '../services/chat';
import { MessageBubble } from './ChatMessageBubble';
import { TypingIndicator } from './ChatTypingIndicator';
import { UserType } from '../chat/type';
import { navigationRef } from '../navigation/navigationRef';

type Props = { onClose: () => void; userType: UserType };

export function ChatPanel({ onClose, userType }: Props) {
  const { mensagens, enviando, enviar, recomecar } = useChat(userType);
  const cfg = getChatConfig(userType);
  const [texto, setTexto] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    );
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [mensagens, enviando, scrollToEnd]);

  const irParaCategoria = async (nome: string) => {
    const categoryId = await resolveCategoryId(nome);
    onClose();
    if (!navigationRef.isReady()) return;
    // Requer que ListaProf aceite { categoryId?: string } em RootStackParamList
    navigationRef.navigate(
      'ListaProf',
      categoryId ? { categoryId: String(categoryId) } : undefined
    );
  };

  const submeter = () => {
    const t = texto;
    setTexto('');
    enviar(t);
  };

  const ultima = mensagens[mensagens.length - 1];
  const conversaIniciada = mensagens.length > 1;
  const semSaida = Boolean(ultima?.semResposta || ultima?.erro);
  const mostrarSugestoes = !enviando && (!conversaIniciada || semSaida);
  const sugestoesAtuais = semSaida ? cfg.sugestoesAlternativas : cfg.sugestoes;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.kav}
    >
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <View style={styles.avatar}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Assistente ConectaPro</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Tire dúvidas ou descubra o profissional certo
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {conversaIniciada && (
              <TouchableOpacity
                onPress={recomecar}
                style={styles.headerBtn}
                accessibilityLabel="Nova conversa"
              >
                <Ionicons name="refresh" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerBtn}
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mensagens */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {mensagens.map((m, i) => (
            <MessageBubble
              key={i}
              message={m}
              userType={userType}
              onCategoriaPress={irParaCategoria}
            />
          ))}

          {mostrarSugestoes && (
            <View style={styles.suggestions}>
              {semSaida && (
                <Text style={styles.suggestionsTitle}>Tente uma destas:</Text>
              )}
              {sugestoesAtuais.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.chip}
                  onPress={() => enviar(s)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {enviando && <TypingIndicator />}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escreva sua dúvida..."
            placeholderTextColor="#94a3b8"
            maxLength={LIMITE_MENSAGEM}
            editable={!enviando}
            onSubmitEditing={submeter}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (enviando || !texto.trim()) && styles.sendBtnDisabled,
            ]}
            disabled={enviando || !texto.trim()}
            onPress={submeter}
            accessibilityLabel="Enviar mensagem"
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Respostas automáticas. Para falar com uma pessoa, use o Fale Conosco.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    height: '90%',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0066ff',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 6, borderRadius: 6 },
  messages: { flex: 1, backgroundColor: '#f8fafc' },
  messagesContent: { padding: 16 },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
  },
  suggestionsTitle: {
    width: '100%',
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  chipText: { color: '#0066ff', fontSize: 12.5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    fontSize: 13.5,
    color: '#1e293b',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0066ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
  footerNote: {
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    fontSize: 10.5,
    color: '#94a3b8',
    backgroundColor: '#fff',
  },
});
