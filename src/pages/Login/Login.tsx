import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';
import { setToken, setUserType, setUserId } from '../../services/auth';
import api from '../../services/api';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      const { token, userType, id } = response.data;
      await setToken(token);
      await setUserType(userType);
      await setUserId(id.toString());
      Toast.show({ type: 'success', text1: 'Login realizado com sucesso!' });
      if (userType === 'CLIENT') {
        navigation.reset({ index: 0, routes: [{ name: 'DashboardCliente' }] });
      } else if (userType === 'PROFESSIONAL') {
        navigation.reset({ index: 0, routes: [{ name: 'DashboardProfissional' }] });
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      const mensagem = error.response?.data?.message || 'Erro ao fazer login';
      Toast.show({ type: 'error', text1: mensagem });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Acesse sua conta</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <Controller
              control={control}
              rules={{ required: 'E-mail obrigatório' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="exemplo@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="email"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <Controller
              control={control}
              rules={{ required: 'Senha obrigatória' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Sua senha"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="password"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.btnSubmit, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={styles.btnSubmitText}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginFooter}>
            <Text>Ainda não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.link}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#777', textAlign: 'center', marginBottom: 30 },
  inputGroup: { marginBottom: 22 },
  label: { fontWeight: '600', marginBottom: 8, color: '#444', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: { borderColor: '#dc3545' },
  errorText: { color: '#dc3545', marginTop: 4, fontSize: 12 },
  btnSubmit: {
    backgroundColor: '#0066ff',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  btnSubmitText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    alignItems: 'center',
  },
  link: { color: '#0066ff', fontWeight: 'bold' },
});
