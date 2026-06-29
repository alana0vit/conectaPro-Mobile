import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import MaskInput from 'react-native-mask-input';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { getUserId } from '../../services/auth';

interface EditarPerfilForm {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  categoryId?: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  password: string;
}

const TELEFONE_MASK = [
  '(', /\d/, /\d/, ')', ' ',
  /\d/, /\d/, /\d/, /\d/, /\d/,
  '-',
  /\d/, /\d/, /\d/, /\d/,
];

const CEP_MASK = [/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/];

const EditarPerfil: React.FC = () => {
  const navigation = useNavigation();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditarPerfilForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      categoryId: '',
      zipCode: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      password: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [categoriasBanco, setCategoriasBanco] = useState<any[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [registryId, setRegistryId] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Busca endereço pelo CEP (igual ao web)
  const buscarEnderecoPorCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await res.json();
      if (dados.erro) {
        Toast.show({ type: 'error', text1: 'CEP não encontrado.' });
        return;
      }
      setValue('street', dados.logradouro || '');
      setValue('neighborhood', dados.bairro || '');
      setValue('city', dados.localidade || '');
      setValue('state', dados.uf || '');
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao buscar CEP.' });
    }
  };

  const carregarDados = useCallback(async () => {
    try {
      let userId: number | undefined;

      const storedUser = await AsyncStorage.getItem('@ConectaPro:user');
      if (storedUser && storedUser !== 'undefined') {
        const parsed = JSON.parse(storedUser);
        userId = Number(parsed.id);
      }

      if (!userId) {
        const uid = await getUserId();
        userId = uid ? Number(uid) : undefined;
      }

      if (!userId) {
        Toast.show({ type: 'error', text1: 'Usuário não autenticado' });
        navigation.goBack();
        return;
      }

      const resUser = await api.get(`/api/user/${userId}`);
      const userData = resUser.data;
      setUserType(userData.userType);
      setRegistryId(userData.registryId);

      let addressData: any = {};
      try {
        const resAddress = await api.get(`/api/user/${userId}/addresses`);
        if (resAddress.data.length > 0) {
          addressData = resAddress.data[0];
        }
      } catch (e) {
        console.warn('Endereço não encontrado');
      }

      if (userData.userType === 'PROFESSIONAL') {
        const resCat = await api.get('/api/category');
        setCategoriasBanco(resCat.data);
      }

      let birthFormatted = '';
      if (userData.birthDate) {
        const parts = userData.birthDate.split(/[/-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            birthFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
          } else {
            birthFormatted = userData.birthDate;
          }
        }
      }

      reset({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        birthDate: birthFormatted,
        categoryId:
          userData.categories?.length > 0
            ? String(userData.categories[0].id)
            : '',
        zipCode: addressData.zipCode || '',
        street: addressData.street || '',
        number: addressData.number || '',
        neighborhood: addressData.neighborhood || '',
        city: addressData.city || '',
        state: addressData.state || '',
        password: '',
      });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados do perfil' });
    } finally {
      setLoading(false);
    }
  }, [reset, navigation]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const onSubmit = async (data: EditarPerfilForm) => {
    if (!data.password) {
      Toast.show({ type: 'error', text1: 'A senha atual é obrigatória.' });
      return;
    }

    try {
      let userId: number | undefined;

      const storedUser = await AsyncStorage.getItem('@ConectaPro:user');
      if (storedUser && storedUser !== 'undefined') {
        userId = Number(JSON.parse(storedUser).id);
      }
      if (!userId) {
        const uid = await getUserId();
        userId = uid ? Number(uid) : undefined;
      }
      if (!userId) {
        Toast.show({ type: 'error', text1: 'Não foi possível identificar o usuário' });
        return;
      }

      const usuarioPayload: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        birthDate: data.birthDate,
        phone: data.phone.replace(/\D/g, ''),
        userType: userType,
        registryId: registryId,
        categoriesIds:
          userType === 'PROFESSIONAL' && data.categoryId
            ? [Number(data.categoryId)]
            : [],
        address: {
          street: data.street,
          number: data.number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode.replace(/\D/g, ''),
        },
      };

      await api.put(`/api/user/${userId}`, usuarioPayload);

      if (storedUser && storedUser !== 'undefined') {
        const parsed = JSON.parse(storedUser);
        if (data.name !== parsed.name) {
          const newStorage = { ...parsed, name: data.name };
          await AsyncStorage.setItem('@ConectaPro:user', JSON.stringify(newStorage));
        }
      }

      Toast.show({ type: 'success', text1: 'Perfil atualizado com sucesso!' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao atualizar';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const ano = selectedDate.getFullYear();
      setValue('birthDate', `${dia}/${mes}/${ano}`);
    }
  };

  const renderCategoryPicker = () => (
    <Modal visible={showCategoryModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecione a especialidade</Text>
          <FlatList
            data={categoriasBanco}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => {
                  setValue('categoryId', String(item.id));
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.categoryText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={{ color: '#007bff' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Carregando seus dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltar}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Editar Perfil</Text>

          {/* Dados Pessoais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <Controller
                control={control}
                rules={{ required: true }}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Nome completo"
                  />
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <Controller
                control={control}
                rules={{ required: true }}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="email@exemplo.com"
                  />
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone / WhatsApp</Text>
              <Controller
                control={control}
                rules={{ required: true }}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <MaskInput
                    style={styles.input}
                    value={value}
                    onChangeText={(masked, unmasked) => onChange(masked)}
                    mask={TELEFONE_MASK}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                  />
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Controller
                  control={control}
                  rules={{ required: true }}
                  name="birthDate"
                  render={({ field: { value } }) => (
                    <View style={styles.dateInput}>
                      <Text style={{ color: value ? '#334155' : '#94a3b8', fontSize: 15 }}>
                        {value || 'dd/mm/aaaa'}
                      </Text>
                      <Ionicons name="calendar" size={18} color="#64748b" />
                    </View>
                  )}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={
                    watch('birthDate')
                      ? (() => {
                        const parts = watch('birthDate').split('/');
                        if (parts.length === 3) {
                          return new Date(
                            Number(parts[2]),
                            Number(parts[1]) - 1,
                            Number(parts[0])
                          );
                        }
                        return new Date();
                      })()
                      : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {userType === 'PROFESSIONAL' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Especialidade</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field: { value } }) => (
                      <Text style={{ color: value ? '#334155' : '#94a3b8', fontSize: 15 }}>
                        {value
                          ? categoriasBanco.find((c) => String(c.id) === value)?.name ||
                          'Selecione...'
                          : 'Selecione...'}
                      </Text>
                    )}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP</Text>
              <Controller
                control={control}
                name="zipCode"
                render={({ field: { onChange, value } }) => (
                  <MaskInput
                    style={styles.input}
                    value={value}
                    onChangeText={(masked, unmasked) => onChange(masked)}
                    mask={CEP_MASK}
                    placeholder="00000-000"
                    keyboardType="numeric"
                    onBlur={() => buscarEnderecoPorCep(value)}
                  />
                )}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 3 }]}>
                <Text style={styles.label}>Rua</Text>
                <Controller
                  control={control}
                  rules={{ required: true }}
                  name="street"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Rua"
                    />
                  )}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Número</Text>
                <Controller
                  control={control}
                  name="number"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Nº"
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bairro</Text>
              <Controller
                control={control}
                rules={{ required: true }}
                name="neighborhood"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Bairro"
                  />
                )}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 3 }]}>
                <Text style={styles.label}>Cidade</Text>
                <Controller
                  control={control}
                  rules={{ required: true }}
                  name="city"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Cidade"
                    />
                  )}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Estado (UF)</Text>
                <Controller
                  control={control}
                  rules={{ required: true, maxLength: 2 }}
                  name="state"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      onChangeText={onChange}
                      value={value}
                      placeholder="UF"
                      maxLength={2}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* Confirmação de senha */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>
              Confirme sua senha para salvar
            </Text>
            <View style={styles.inputGroup}>
              <View style={styles.passwordWrapper}>
                <Controller
                  control={control}
                  rules={{ required: 'Senha é obrigatória', minLength: 6 }}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="••••••"
                      secureTextEntry={!mostrarSenha}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setMostrarSenha((prev) => !prev)}
                >
                  <Ionicons
                    name={mostrarSenha ? 'eye-off' : 'eye'}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message as string}</Text>
              )}
            </View>
          </View>

          {/* Botões */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSubmit}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.btnSubmitText}>Salvar Alterações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderCategoryPicker()}
      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  wrapper: {
    padding: 20,
  },
  voltar: {
    color: '#007bff',
    marginBottom: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: '#334155',
    backgroundColor: '#ffffff',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSubmit: {
    flex: 1,
    backgroundColor: '#0066ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSubmitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryText: {
    fontSize: 15,
    color: '#334155',
  },
  closeModalBtn: {
    marginTop: 16,
    alignSelf: 'center',
  },
});

export default EditarPerfil;
