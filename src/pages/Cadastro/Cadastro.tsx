import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { MaskedTextInput } from 'react-native-mask-text';
import { TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { setToken, setUserType, setUserId } from '../../services/auth';

interface CadastroFormData {
  tipo: string;
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  birthDate: string;
  telefone: string;
  cpfCnpj: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  categoria?: string;
  descricao?: string;
  aceiteTermos: boolean;
}

export default function Cadastro() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [step, setStep] = useState<'escolha' | 'formulario'>('escolha');
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CadastroFormData>({
    defaultValues: {
      tipo: '',
      aceiteTermos: false,
    },
  });
  const tipoSelecionado = watch('tipo');

  const buscarCategorias = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      const res = await api.get('/api/category');
      setCategorias(res.data);
    } catch (error) {
      console.error('Erro ao carregar categorias', error);
    }
  };

  useEffect(() => {
    buscarCategorias();
  }, []);

  const onSubmit = async (data: CadastroFormData) => {
    if (!data.aceiteTermos) {
      Toast.show({ type: 'error', text1: 'Aceite os termos de uso para continuar.' });
      return;
    }
    const payload: any = {
      name: data.nome,
      email: data.email,
      password: data.senha,
      birthDate: data.birthDate,
      phone: data.telefone,
      userType: data.tipo === 'CLIENTE' ? 'CLIENT' : 'PROFESSIONAL',
      registryId: data.cpfCnpj.replace(/\D/g, ''),
      address: {
        street: data.logradouro,
        number: data.numero,
        neighborhood: data.bairro,
        city: data.cidade,
        state: data.estado,
        zipCode: data.cep,
        supplement: data.complemento,
      },
    };
    if (data.tipo === 'PROFISSIONAL' && data.categoria) {
      payload.categoriesIds = [parseInt(data.categoria)];
    }
    try {
      const response = await api.post('/api/user', payload);
      const { token, userType, id } = response.data;
      await setToken(token);
      await setUserType(userType);
      await setUserId(id.toString());
      Toast.show({ type: 'success', text1: 'Cadastro realizado com sucesso!' });
      if (userType === 'CLIENT') {
        navigation.reset({ index: 0, routes: [{ name: 'DashboardCliente' }] });
      } else if (userType === 'PROFESSIONAL') {
        navigation.reset({ index: 0, routes: [{ name: 'DashboardProfissional' }] });
      }
    } catch (error: any) {
      const mensagem = error.response?.data?.message || 'Erro ao cadastrar';
      Toast.show({ type: 'error', text1: mensagem });
    }
  };

  if (step === 'escolha') {
    return (
      <View style={styles.cadastroContainer}>
        <View style={styles.escolhaPerfilCard}>
          <Text style={styles.escolhaTitle}>Escolha seu perfil</Text>
          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={[styles.perfilCard, styles.clienteCard]}
              onPress={() => { setValue('tipo', 'CLIENTE'); setStep('formulario'); }}
            >
              <Text style={styles.perfilIcon}>👤</Text>
              <Text style={styles.perfilTitle}>Cliente</Text>
              <Text style={styles.perfilDesc}>Contratar serviços</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.perfilCard, styles.profissionalCard]}
              onPress={() => { setValue('tipo', 'PROFISSIONAL'); setStep('formulario'); }}
            >
              <Text style={styles.perfilIcon}>🔧</Text>
              <Text style={styles.perfilTitle}>Profissional</Text>
              <Text style={styles.perfilDesc}>Oferecer serviços</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => setStep('escolha')}>
          <Text style={styles.btnVoltarText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.formHeader}>
          Cadastro de {tipoSelecionado === 'CLIENTE' ? 'Cliente' : 'Profissional'}
        </Text>

        {/* Dados Pessoais */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <Controller
              control={control}
              rules={{ required: 'Nome obrigatório' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} />
              )}
              name="nome"
            />
            {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>E-mail</Text>
              <Controller
                control={control}
                rules={{ required: 'E-mail obrigatório' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
                )}
                name="email"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Telefone</Text>
              <Controller
                control={control}
                rules={{ required: 'Telefone obrigatório' }}
                render={({ field: { onChange, value } }) => (
                  <MaskedTextInput
                    mask="(99) 99999-9999"
                    style={styles.input}
                    value={value || ''}
                    onChangeText={(masked) => onChange(masked)}
                    placeholder="(11) 99999-9999"
                    keyboardType="phone-pad"
                  />
                )}
                name="telefone"
              />
              {errors.telefone && <Text style={styles.errorText}>{errors.telefone.message}</Text>}
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Data de nascimento</Text>
              <Controller
                control={control}
                rules={{ required: 'Data obrigatória' }}
                render={({ field: { onChange, value } }) => (
                  <MaskedTextInput
                    mask="99/99/9999"
                    style={styles.input}
                    value={value || ''}
                    onChangeText={(masked) => onChange(masked)}
                    placeholder="dd/mm/aaaa"
                    keyboardType="numeric"
                  />
                )}
                name="birthDate"
              />
              {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate.message}</Text>}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>CPF/CNPJ</Text>
              <Controller
                control={control}
                rules={{ required: 'CPF/CNPJ obrigatório' }}
                render={({ field: { onChange, value } }) => {
                  const raw = value?.replace(/\D/g, '') || '';
                  const mask = raw.length <= 11 ? '999.999.999-99' : '99.999.999/9999-99';
                  return (
                    <MaskedTextInput
                      mask={mask}
                      style={styles.input}
                      value={value || ''}
                      onChangeText={(masked) => onChange(masked)}
                      keyboardType="numeric"
                    />
                  );
                }}
                name="cpfCnpj"
              />
              {errors.cpfCnpj && <Text style={styles.errorText}>{errors.cpfCnpj.message}</Text>}
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Senha</Text>
              <Controller
                control={control}
                rules={{ required: 'Senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} />
                )}
                name="senha"
              />
              {errors.senha && <Text style={styles.errorText}>{errors.senha.message}</Text>}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <Controller
                control={control}
                rules={{
                  required: 'Confirme sua senha',
                  validate: (val, form) => val === form.senha || 'Senhas não conferem',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} />
                )}
                name="confirmarSenha"
              />
              {errors.confirmarSenha && <Text style={styles.errorText}>{errors.confirmarSenha.message}</Text>}
            </View>
          </View>
        </View>

        {/* Endereço */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          <View style={styles.row}>
            <View style={styles.smallInput}>
              <Text style={styles.label}>CEP</Text>
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <MaskedTextInput
                    mask="99999-999"
                    style={styles.input}
                    value={value || ''}
                    onChangeText={(masked) => onChange(masked)}
                    keyboardType="numeric"
                  />
                )}
                name="cep"
              />
            </View>
            <View style={styles.largeInput}>
              <Text style={styles.label}>Logradouro</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} />
                )}
                name="logradouro"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.smallInput}>
              <Text style={styles.label}>Número</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="numeric" />
                )}
                name="numero"
              />
            </View>
            <View style={styles.largeInput}>
              <Text style={styles.label}>Complemento</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} />
                )}
                name="complemento"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Bairro</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} />
                )}
                name="bairro"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Cidade</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} />
                )}
                name="cidade"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.smallInput}>
              <Text style={styles.label}>Estado</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} maxLength={2} />
                )}
                name="estado"
              />
            </View>
          </View>
        </View>

        {/* Profissional extra */}
        {tipoSelecionado === 'PROFISSIONAL' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Dados Profissionais</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoria</Text>
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerWrapper}>
                    {categorias.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryOption, value == cat.id && styles.categorySelected]}
                        onPress={() => onChange(cat.id.toString())}
                      >
                        <Text style={{ color: value == cat.id ? '#fff' : '#333' }}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                name="categoria"
              />
            </View>
          </View>
        )}

        {/* Termos */}
        <View style={styles.termsContainer}>
          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxGroup}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Text style={{ color: '#fff' }}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  Li e aceito os{' '}
                  <Text style={styles.link} onPress={() => navigation.navigate('TermosDeUso')}>
                    Termos de Uso
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
            name="aceiteTermos"
          />
        </View>

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.btnSubmitText}>Cadastrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  cadastroContainer: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8f9fa' },
  escolhaPerfilCard: { backgroundColor: '#fff', borderRadius: 12, padding: 30, alignItems: 'center' },
  escolhaTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  cardsContainer: { flexDirection: 'row', gap: 20 },
  perfilCard: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e9ecef' },
  clienteCard: { borderColor: '#007bff' },
  profissionalCard: { borderColor: '#28a745' },
  perfilIcon: { fontSize: 40, marginBottom: 10 },
  perfilTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  perfilDesc: { fontSize: 14, color: '#6c757d' },
  formContainer: { padding: 20, backgroundColor: '#fff' },
  btnVoltar: { marginBottom: 15 },
  btnVoltarText: { fontSize: 16, color: '#007bff' },
  formHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  formSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: '#e9ecef', paddingBottom: 8, marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  label: { fontWeight: '500', marginBottom: 6, color: '#444', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  halfInput: { flex: 1 },
  smallInput: { flex: 0.7 },
  largeInput: { flex: 1.3 },
  errorText: { color: '#dc3545', fontSize: 12, marginTop: 4 },
  pickerWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryOption: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 20 },
  categorySelected: { backgroundColor: '#007bff', borderColor: '#007bff' },
  termsContainer: { marginVertical: 20 },
  checkboxGroup: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#007bff', borderRadius: 4, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#007bff' },
  checkboxLabel: { fontSize: 14, color: '#555' },
  link: { color: '#007bff', textDecorationLine: 'underline' },
  btnSubmit: { backgroundColor: '#0066ff', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnSubmitText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
