import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { getToken } from '../../services/auth';

interface EditarPerfilForm {
  nome: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  senha?: string;
  confirmarSenha?: string;
}

export default function EditarPerfil() {
  const navigation = useNavigation();
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<EditarPerfilForm>();

  const carregarDados = async () => {
    try {
      const res = await api.get('/perfil');
      const dados = res.data;
      reset({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cep: dados.cep || '',
        logradouro: dados.logradouro || '',
        numero: dados.numero || '',
        complemento: dados.complemento || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        estado: dados.estado || '',
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados do perfil' });
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const onSubmit = async (data: EditarPerfilForm) => {
    try {
      await api.put('/perfil', data);
      Toast.show({ type: 'success', text1: 'Perfil atualizado com sucesso!' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao atualizar';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltar}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.title}>Editar Perfil</Text>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            <View style={styles.formGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome</Text>
                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => <TextInput style={styles.input} {...field} />}
                  name="nome"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => <TextInput style={styles.input} {...field} keyboardType="email-address" />}
                  name="email"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} />}
                  name="telefone"
                />
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Endereço</Text>
            <View style={styles.formGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CEP</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} keyboardType="numeric" />}
                  name="cep"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Logradouro</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} />}
                  name="logradouro"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Número</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} keyboardType="numeric" />}
                  name="numero"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Complemento</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} />}
                  name="complemento"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bairro</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} />}
                  name="bairro"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cidade</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} />}
                  name="cidade"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estado</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} maxLength={2} />}
                  name="estado"
                />
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: '#b91c1c' }]}>Alterar Senha (opcional)</Text>
            <View style={styles.formGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova Senha</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} secureTextEntry />}
                  name="senha"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Nova Senha</Text>
                <Controller
                  control={control}
                  render={({ field }) => <TextInput style={styles.input} {...field} secureTextEntry />}
                  name="confirmarSenha"
                />
              </View>
            </View>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.goBack()}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit(onSubmit)}>
              <Text style={styles.btnSubmitText}>Salvar Alterações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#f0f2f5', flexGrow: 1 },
  wrapper: { padding: 20 },
  voltar: { color: '#007bff', marginBottom: 15, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 25 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  formSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  formGrid: { gap: 10 },
  inputGroup: { marginBottom: 10 },
  label: { fontWeight: '500', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancel: { paddingVertical: 14, paddingHorizontal: 25, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  btnSubmit: { backgroundColor: '#0f172a', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 8 },
  btnSubmitText: { color: '#fff', fontWeight: 'bold' },
});
