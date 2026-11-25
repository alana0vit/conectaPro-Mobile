import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatPanel } from './ChatPanel';
import { UserType } from '../chat/type';

type Props = { userType: UserType };
export function ChatWidget({ userType }: Props) {
  const [aberto, setAberto] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      {!aberto && (
        <Pressable
          style={[styles.bubble, { bottom: 24 + insets.bottom, right: 20 }]}
          onPress={() => setAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir assistente"
        >
          <Ionicons name="chatbubbles" size={26} color="#fff" />
        </Pressable>
      )}

      <Modal
        visible={aberto}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setAberto(false)}
      >
        <View style={styles.modalRoot}>
          <ChatPanel onClose={() => setAberto(false)} userType={userType} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066ff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    elevation: 8,
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
});
