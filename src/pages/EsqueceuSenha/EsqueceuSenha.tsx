import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

interface FormData {
  email: string;
}

export default function EsqueceuSenha() {
  const navigation = useNavigation();
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/esqueceu-senha', data);
      Toast.show({ type: 'success', text1: 'E-mail enviado!', text2: 'Verifique sua caixa de entrada.' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao enviar e-mail';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
          <Text style={styles.btnVoltarText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Esqueceu a senha?</Text>
        <Text style={styles.subtitle}>
          Informe seu e-mail para receber as instruções de redefinição.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <Controller
            control={control}
            rules={{ required: 'E-mail obrigatório' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
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

        <View style={styles.botoesAcao}>
          <TouchableOpacity style={styles.btnSalvar} onPress={handleSubmit(onSubmit)}>
            <Text style={styles.btnText}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancelar} onPress={() => navigation.goBack()}>
            <Text style={styles.btnCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  btnVoltar: { marginBottom: 15 },
  btnVoltarText: { color: '#007bff', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#777', textAlign: 'center', marginBottom: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 8, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 14, fontSize: 16 },
  inputError: { borderColor: '#dc3545' },
  errorText: { color: '#dc3545', fontSize: 12, marginTop: 4 },
  botoesAcao: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnSalvar: { backgroundColor: '#0066ff', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnCancelar: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8 },
  btnCancelarText: { color: '#666' },
});
