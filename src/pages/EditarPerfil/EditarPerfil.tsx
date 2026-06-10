import React, { useState, useEffect, useCallback } from 'react';
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
import { getUserId } from '../../services/auth';

interface EditarPerfilForm {
  name: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  supplement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  password?: string;
}

export default function EditarPerfil() {
  const navigation = useNavigation();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<EditarPerfilForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      number: '',
      supplement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });
  const [carregado, setCarregado] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const userId = await getUserId();
      const res = await api.get(`/api/user/${userId}`);
      const dados = res.data;
      const addr = dados.adresses?.[0] || {};
      reset({
        name: dados.name || '',
        email: dados.email || '',
        phone: dados.phone || '',
        street: addr.street || '',
        number: addr.number || '',
        supplement: addr.supplement || '',
        neighborhood: addr.neighborhood || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zipCode || '',
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados do perfil' });
    } finally {
      setCarregado(true);
    }
  }, [reset]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const onSubmit = async (data: EditarPerfilForm) => {
    try {
      const userId = await getUserId();
      const payload: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        adresses: [{
          street: data.street,
          number: data.number,
          supplement: data.supplement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        }],
      };
      if (data.password) {
        payload.password = data.password;
      }
      await api.put(`/api/user/${userId}`, payload);
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

          {!carregado ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Carregando...</Text>
          ) : (
            <>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                <View style={styles.formGrid}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome</Text>
                    <Controller control={control} rules={{ required: true }} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} />} name="name" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>E-mail</Text>
                    <Controller control={control} rules={{ required: true }} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} keyboardType="email-address" />} name="email" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Telefone</Text>
                    <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} />} name="phone" />
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Endereço</Text>
                <View style={styles.formGrid}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CEP</Text>
                    <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} keyboardType="numeric" />} name="zipCode" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Logradouro</Text>
                    <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} />} name="street" />
                  </View>
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>Número</Text>
                      <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} keyboardType="numeric" />} name="number" />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>Complemento</Text>
                      <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} />} name="supplement" />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bairro</Text>
                    <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} />} name="neighborhood" />
                  </View>
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>Cidade</Text>
                      <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} />} name="city" />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>Estado</Text>
                      <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} maxLength={2} />} name="state" />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: '#b91c1c' }]}>Alterar Senha (opcional)</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nova Senha</Text>
                  <Controller control={control} render={({ field: { onChange, value } }) => <TextInput style={styles.input} onChangeText={onChange} value={value} secureTextEntry />} name="password" />
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
            </>
          )}
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
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancel: { paddingVertical: 14, paddingHorizontal: 25, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  btnSubmit: { backgroundColor: '#0f172a', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 8 },
  btnSubmitText: { color: '#fff', fontWeight: 'bold' },
});
