import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, UserType } from '../chat/type';

type Props = {
  message: ChatMessage;
  userType: UserType;
  onCategoriaPress: (nome: string) => void;
};

export function MessageBubble({ message, userType, onCategoriaPress }: Props) {
  const isUser = message.autor === 'user';

  const mostrarCtaCategoria =
    Boolean(message.categoria) && !message.erro && userType === 'CLIENT';

  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleBot,
        message.erro && styles.bubbleError,
      ]}
    >
      <Text
        style={[
          styles.text,
          isUser && styles.textUser,
          message.erro && styles.textError,
        ]}
      >
        {message.texto}
      </Text>

      {mostrarCtaCategoria && (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => onCategoriaPress(message.categoria!)}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={14} color="#fff" />
          <Text style={styles.ctaText}>
            Ver {message.categoria!.toLowerCase()}s disponíveis
          </Text>
        </TouchableOpacity>
      )}

      {message.fontes && message.fontes.length > 0 && (
        <Text style={styles.sources}>
          Baseado em: {message.fontes.join(' · ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '86%',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
    marginBottom: 10,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066ff',
    borderBottomRightRadius: 4,
  },
  bubbleError: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },
  text: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#1e293b',
  },
  textUser: { color: '#fff' },
  textError: { color: '#991b1b' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0066ff',
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 12.5 },
  sources: { marginTop: 8, fontSize: 10.5, color: '#94a3b8', lineHeight: 14 },
});
