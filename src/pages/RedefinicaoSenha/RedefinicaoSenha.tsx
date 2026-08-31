import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

type RedefinicaoSenhaRouteProp = RouteProp<RootStackParamList, 'RedefinicaoSenha'>;

export default function RedefinicaoSenha() {
  const route = useRoute<RedefinicaoSenhaRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!passwordsMatch) {
      Toast.show({ type: 'error', text1: 'As senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (!token) {
      Toast.show({ type: 'error', text1: 'Token de segurança ausente. Por favor, clique no link do seu e-mail novamente.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/reset-password', {
        token: token,
        newPassword: newPassword,
      });

      Toast.show({ type: 'success', text1: 'Senha redefinida com sucesso! Faça login para continuar.' });
      navigation.navigate('Login');
    } catch (error) {
      console.error('Erro ao redefinir a senha:', error);
      Toast.show({ type: 'error', text1: 'Ocorreu um erro. Seu link pode ter expirado, solicite um novo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Criar Nova Senha</Text>
            <Text style={styles.description}>
              Digite sua nova senha abaixo para recuperar o acesso à sua conta.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nova Senha</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Digite a nova senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity style={styles.toggleBtn} onPress={togglePasswordVisibility}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#a0aec0"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Nova Senha</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  !passwordsMatch && styles.inputError,
                ]}
                placeholder="Repita a nova senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity style={styles.toggleBtn} onPress={togglePasswordVisibility}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#a0aec0"
                />
              </TouchableOpacity>
            </View>
            {!passwordsMatch && (
              <Text style={styles.errorText}>As senhas não coincidem.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (isSubmitting || !passwordsMatch) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || !passwordsMatch}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Salvar Nova Senha</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerText: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#718096',
    marginBottom: 8,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#2d3748',
  },
  passwordInput: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: '#e53e3e',
    backgroundColor: '#fff5f5',
  },
  toggleBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#e53e3e',
    fontWeight: '500',
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#0066ff',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#a0aec0',
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
