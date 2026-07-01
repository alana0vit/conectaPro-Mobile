import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput as RNTextInput,
  FlatList,
  SafeAreaView,
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { MaskedTextInput } from 'react-native-mask-text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface CadastroFormData {
  nome: string;
  companyName?: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  birthDate: string;
  telefone: string;
  cpfCnpj: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  categoria?: string;
  aceiteTermos: boolean;
}

type TipoPerfil = 'CLIENTE' | 'PROFISSIONAL' | null;

export default function Cadastro() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [step, setStep] = useState<'escolha' | 'formulario'>('escolha');
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoPerfil>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSucessoVisible, setModalSucessoVisible] = useState(false);

  const [modalEstadoVisible, setModalEstadoVisible] = useState(false);
  const [modalCategoriaVisible, setModalCategoriaVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [fotoFile, setFotoFile] = useState<any>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CadastroFormData>({
    defaultValues: {
      aceiteTermos: false,
    },
  });

  const senhaAtual = watch('senha');

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 100);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (str: string): Date => {
    if (!str) return new Date();
    const parts = str.split('/');
    if (parts.length !== 3) return new Date();
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValue('birthDate', formatDate(selectedDate), { shouldValidate: true });
    }
    setShowDatePicker(false);
  };

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
      setValue('logradouro', dados.logradouro || '');
      setValue('bairro', dados.bairro || '');
      setValue('cidade', dados.localidade || '');
      setValue('estado', dados.uf || '');
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao buscar CEP.' });
    }
  };

  useEffect(() => {
    const buscarCategorias = async () => {
      try {
        const res = await api.get('/api/category');
        setCategorias(res.data);
      } catch (error) {
        console.error('Erro ao carregar categorias', error);
      }
    };
    buscarCategorias();
  }, []);

  const selecionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permissão para acessar a galeria negada.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setFotoPreview(asset.uri);
      setFotoFile({
        uri: asset.uri,
        name: asset.fileName || 'foto.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const onSubmit = async (data: CadastroFormData) => {
    if (!data.aceiteTermos) {
      Toast.show({ type: 'error', text1: 'Aceite os termos de uso para continuar.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const documentoLimpo = data.cpfCnpj.replace(/\D/g, '');
      const telefoneLimpo = data.telefone.replace(/\D/g, '');
      const cepLimpo = data.cep.replace(/\D/g, '');

      const dataFormatada = data.birthDate;

      const payload: any = {
        name: data.nome,
        email: data.email,
        password: data.senha,
        birthDate: dataFormatada,
        phone: telefoneLimpo,
        userType: tipoSelecionado === 'CLIENTE' ? 'CLIENT' : 'PROFESSIONAL',
        registryId: documentoLimpo,
        companyName: tipoSelecionado === 'PROFISSIONAL' ? data.companyName?.trim() || null : null,
        categoriesIds:
          tipoSelecionado === 'PROFISSIONAL' && data.categoria
            ? [parseInt(data.categoria)]
            : [],
        address: {
          street: data.logradouro,
          number: data.numero,
          neighborhood: data.bairro,
          city: data.cidade,
          state: data.estado,
          zipCode: cepLimpo,
        },
      };

      const response = await api.post('/api/user', payload);

      if (fotoFile && response.data?.id) {
        try {
          const loginRes = await api.post('/auth/login', {
            email: data.email,
            password: data.senha,
          });

          if (loginRes.data?.token) {
            const formData = new FormData();
            formData.append('foto', fotoFile as any);

            await api.post(`/api/user/${response.data.id}/photo`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${loginRes.data.token}`,
              },
            });
          }
        } catch (fotoErr) {
          console.error('Erro ao enviar foto:', fotoErr);
        }
      }

      setModalSucessoVisible(true);
      setTimeout(() => {
        setModalSucessoVisible(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 3000);
    } catch (error: any) {
      setIsSubmitting(false);
      const mensagem = error.response?.data?.message || 'Erro ao cadastrar. Verifique os dados.';
      Toast.show({ type: 'error', text1: mensagem });
    }
  };

  const escolherPerfil = (perfil: TipoPerfil) => {
    setTipoSelecionado(perfil);
    setStep('formulario');
  };

  const renderItem = (
    item: string,
    value: string | undefined,
    onChange: (val: string) => void,
    closeModal: () => void
  ) => (
    <TouchableOpacity
      style={[styles.itemLista, value === item && styles.itemListaSelecionado]}
      onPress={() => {
        onChange(item);
        closeModal();
      }}
    >
      <Text style={[styles.itemListaTexto, value === item && styles.itemListaTextoSelecionado]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderDatePicker = () => (
    <Controller
      control={control}
      rules={{ required: 'Data de nascimento obrigatória' }}
      render={({ field: { value } }) => (
        <View style={styles.halfInput}>
          <Text style={styles.label}>Data de Nascimento</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={value ? styles.inputText : styles.placeholderText}>
              {value || 'dd/mm/aaaa'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={parseDate(value)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={minDate}
              maximumDate={today}
              onChange={onDateChange}
              locale="pt-BR"
            />
          )}
          {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate.message}</Text>}
        </View>
      )}
      name="birthDate"
    />
  );

  if (step === 'escolha') {
    return (
      <View style={styles.container}>
        <View style={styles.cardEscolha}>
          <Text style={styles.titleSerif}>Como deseja usar o ConectaPro?</Text>
          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={styles.perfilCard}
              onPress={() => escolherPerfil('CLIENTE')}
            >
              <Ionicons name="person-outline" size={40} color="#007bff" />
              <Text style={styles.perfilTitle}>Quero Contratar</Text>
              <Text style={styles.perfilDesc}>Procuro profissionais para serviços</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.perfilCard, styles.perfilProfissional]}
              onPress={() => escolherPerfil('PROFISSIONAL')}
            >
              <Ionicons name="construct-outline" size={40} color="#28a745" />
              <Text style={styles.perfilTitle}>Quero Trabalhar</Text>
              <Text style={styles.perfilDesc}>Quero oferecer os meus serviços</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.btnVoltar} onPress={() => setStep('escolha')}>
          <Ionicons name="arrow-back" size={18} color="#007bff" />
          <Text style={styles.btnVoltarText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={selecionarFoto} style={styles.avatarTouchable}>
            {fotoPreview ? (
              <Image source={{ uri: fotoPreview }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={28} color="#94a3b8" />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.titleSerif}>
          {tipoSelecionado === 'CLIENTE' ? 'Cadastro de Cliente' : 'Cadastro de Profissional'}
        </Text>
        <Text style={styles.subtitle}>
          {tipoSelecionado === 'CLIENTE'
            ? 'Crie sua conta para encontrar e contratar os melhores profissionais.'
            : 'Junte-se à nossa rede e conecte-se com clientes que precisam do seu talento.'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <Controller
              control={control}
              rules={{ required: 'Nome obrigatório' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <RNTextInput
                  style={styles.input}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#94a3b8"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="nome"
            />
            {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
          </View>

          {tipoSelecionado === 'PROFISSIONAL' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Empresa (opcional)</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <RNTextInput
                    style={styles.input}
                    placeholder="Ex: Conecta Reparos LTDA"
                    placeholderTextColor="#94a3b8"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="companyName"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <Controller
              control={control}
              rules={{ required: 'E-mail obrigatório' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <RNTextInput
                  style={styles.input}
                  placeholder="maria@gmail.com"
                  placeholderTextColor="#94a3b8"
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

          {tipoSelecionado === 'CLIENTE' ? (
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>CPF</Text>
                <Controller
                  control={control}
                  rules={{ required: 'CPF obrigatório' }}
                  render={({ field: { onChange, value } }) => (
                    <MaskedTextInput
                      mask="999.999.999-99"
                      style={styles.input}
                      placeholder="000.000.000-00"
                      placeholderTextColor="#94a3b8"
                      value={value || ''}
                      onChangeText={(masked) => onChange(masked)}
                      keyboardType="numeric"
                    />
                  )}
                  name="cpfCnpj"
                />
                {errors.cpfCnpj && <Text style={styles.errorText}>{errors.cpfCnpj.message}</Text>}
              </View>
              {renderDatePicker()}
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CNPJ</Text>
              <Controller
                control={control}
                rules={{ required: 'CNPJ obrigatório' }}
                render={({ field: { onChange, value } }) => (
                  <MaskedTextInput
                    mask="99.999.999/9999-99"
                    style={styles.input}
                    placeholder="00.000.000/0000-00"
                    placeholderTextColor="#94a3b8"
                    value={value || ''}
                    onChangeText={(masked) => onChange(masked)}
                    keyboardType="numeric"
                  />
                )}
                name="cpfCnpj"
              />
              {errors.cpfCnpj && <Text style={styles.errorText}>{errors.cpfCnpj.message}</Text>}
            </View>
          )}

          {tipoSelecionado === 'PROFISSIONAL' ? (
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Telefone / WhatsApp</Text>
                <Controller
                  control={control}
                  rules={{ required: 'Telefone obrigatório' }}
                  render={({ field: { onChange, value } }) => (
                    <MaskedTextInput
                      mask="(99) 99999-9999"
                      style={styles.input}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#94a3b8"
                      value={value || ''}
                      onChangeText={(masked) => onChange(masked)}
                      keyboardType="phone-pad"
                    />
                  )}
                  name="telefone"
                />
                {errors.telefone && <Text style={styles.errorText}>{errors.telefone.message}</Text>}
              </View>
              {renderDatePicker()}
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <Controller
                control={control}
                rules={{ required: 'Telefone obrigatório' }}
                render={({ field: { onChange, value } }) => (
                  <MaskedTextInput
                    mask="(99) 99999-9999"
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor="#94a3b8"
                    value={value || ''}
                    onChangeText={(masked) => onChange(masked)}
                    keyboardType="phone-pad"
                  />
                )}
                name="telefone"
              />
              {errors.telefone && <Text style={styles.errorText}>{errors.telefone.message}</Text>}
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordWrapper}>
                <Controller
                  control={control}
                  rules={{
                    required: 'Senha obrigatória',
                    minLength: { value: 6, message: 'Mínimo 6 dígitos' },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <RNTextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="••••••"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!mostrarSenha}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="senha"
                />
                <TouchableOpacity
                  style={styles.passwordIcon}
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                >
                  <Ionicons
                    name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {errors.senha && <Text style={styles.errorText}>{errors.senha.message}</Text>}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.passwordWrapper}>
                <Controller
                  control={control}
                  rules={{
                    required: 'Confirme sua senha',
                    validate: (val) => val === senhaAtual || 'As senhas não conferem',
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <RNTextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="••••••"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!mostrarConfirmarSenha}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="confirmarSenha"
                />
                <TouchableOpacity
                  style={styles.passwordIcon}
                  onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                >
                  <Ionicons
                    name={mostrarConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmarSenha && (
                <Text style={styles.errorText}>{errors.confirmarSenha.message}</Text>
              )}
            </View>
          </View>
        </View>

        {tipoSelecionado === 'PROFISSIONAL' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Profissionais</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Especialidade</Text>
              <Controller
                control={control}
                rules={{ required: 'Selecione uma especialidade' }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setModalCategoriaVisible(true)}
                    >
                      <Text style={value ? styles.inputText : styles.placeholderText}>
                        {value
                          ? categorias.find((c) => c.id.toString() === value)?.name || 'Selecione...'
                          : 'Selecione a sua área...'}
                      </Text>
                    </TouchableOpacity>

                    <Modal
                      visible={modalCategoriaVisible}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setModalCategoriaVisible(false)}
                    >
                      <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Especialidade</Text>
                            <TouchableOpacity onPress={() => setModalCategoriaVisible(false)}>
                              <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                          </View>
                          <FlatList
                            data={categorias}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) =>
                              renderItem(
                                item.name,
                                value,
                                (val) => onChange(item.id.toString()),
                                () => setModalCategoriaVisible(false)
                              )
                            }
                          />
                        </View>
                      </SafeAreaView>
                    </Modal>
                  </>
                )}
                name="categoria"
              />
              {errors.categoria && <Text style={styles.errorText}>{errors.categoria.message}</Text>}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CEP</Text>
            <Controller
              control={control}
              rules={{ required: 'CEP obrigatório' }}
              render={({ field: { onChange, value } }) => (
                <MaskedTextInput
                  mask="99999-999"
                  style={styles.input}
                  placeholder="00000-000"
                  placeholderTextColor="#94a3b8"
                  value={value || ''}
                  onChangeText={(masked) => {
                    onChange(masked);
                    if (masked.replace(/\D/g, '').length === 8) {
                      buscarEnderecoPorCep(masked);
                    }
                  }}
                  keyboardType="numeric"
                />
              )}
              name="cep"
            />
            {errors.cep && <Text style={styles.errorText}>{errors.cep.message}</Text>}
          </View>

          <View style={styles.row}>
            <View style={styles.largeInput}>
              <Text style={styles.label}>Rua</Text>
              <Controller
                control={control}
                rules={{ required: 'Rua obrigatória' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <RNTextInput
                    style={styles.input}
                    placeholder="Ex: Rua Jardim Veneza"
                    placeholderTextColor="#94a3b8"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="logradouro"
              />
              {errors.logradouro && <Text style={styles.errorText}>{errors.logradouro.message}</Text>}
            </View>
            <View style={styles.smallInput}>
              <Text style={styles.label}>Número</Text>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <RNTextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="numero"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bairro</Text>
            <Controller
              control={control}
              rules={{ required: 'Bairro obrigatório' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <RNTextInput
                  style={styles.input}
                  placeholder="Ex: Boa Viagem"
                  placeholderTextColor="#94a3b8"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="bairro"
            />
            {errors.bairro && <Text style={styles.errorText}>{errors.bairro.message}</Text>}
          </View>

          <View style={styles.row}>
            <View style={styles.largeInput}>
              <Text style={styles.label}>Cidade</Text>
              <Controller
                control={control}
                rules={{ required: 'Cidade obrigatória' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <RNTextInput
                    style={styles.input}
                    placeholder="Ex: Recife"
                    placeholderTextColor="#94a3b8"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="cidade"
              />
              {errors.cidade && <Text style={styles.errorText}>{errors.cidade.message}</Text>}
            </View>
            <View style={styles.smallInput}>
              <Text style={styles.label}>Estado (UF)</Text>
              <Controller
                control={control}
                rules={{ required: 'Estado obrigatório' }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setModalEstadoVisible(true)}
                    >
                      <Text style={value ? styles.inputText : styles.placeholderText}>
                        {value || 'UF'}
                      </Text>
                    </TouchableOpacity>

                    <Modal
                      visible={modalEstadoVisible}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setModalEstadoVisible(false)}
                    >
                      <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Estado (UF)</Text>
                            <TouchableOpacity onPress={() => setModalEstadoVisible(false)}>
                              <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                          </View>
                          <FlatList
                            data={ESTADOS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) =>
                              renderItem(
                                item,
                                value,
                                onChange,
                                () => setModalEstadoVisible(false)
                              )
                            }
                          />
                        </View>
                      </SafeAreaView>
                    </Modal>
                  </>
                )}
                name="estado"
              />
              {errors.estado && <Text style={styles.errorText}>{errors.estado.message}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.termsContainer}>
          <Controller
            control={control}
            rules={{ required: 'Você precisa aceitar os termos de uso' }}
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxGroup}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Eu li e aceito os{' '}
                  <Text
                    style={styles.link}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('TermosDeUso');
                    }}
                  >
                    Termos de Uso
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
            name="aceiteTermos"
          />
          {errors.aceiteTermos && (
            <Text style={styles.errorText}>
              <Ionicons name="alert-circle" size={12} color="#ef4444" />{' '}
              {errors.aceiteTermos.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnSubmit, isSubmitting && styles.btnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.btnSubmitText}>Cadastrando...</Text>
            </View>
          ) : (
            <Text style={styles.btnSubmitText}>Finalizar Cadastro</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalSucessoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSucesso}>
            <Ionicons name="checkmark-circle" size={55} color="#10b981" />
            <Text style={styles.titleSerif}>Cadastro Realizado!</Text>
            <Text style={styles.modalText}>
              Usuário cadastrado com sucesso.{'\n'}
              Você será direcionado para o login em instantes...
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' },
  cardEscolha: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  titleSerif: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  cardsContainer: { flexDirection: 'row', gap: 20, marginTop: 30 },
  perfilCard: {
    flex: 1,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  perfilProfissional: {},
  perfilTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  perfilDesc: { fontSize: 14, color: '#6c757d', textAlign: 'center' },

  formContainer: { padding: 20, backgroundColor: '#fff', paddingBottom: 60 },
  btnVoltar: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  btnVoltarText: { fontSize: 16, color: '#007bff', marginLeft: 4 },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTouchable: {
    position: 'relative',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 8,
    marginBottom: 15,
  },

  inputGroup: { marginBottom: 12 },
  label: { fontWeight: '600', fontSize: 11, color: '#64748b', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    backgroundColor: '#fff',
    color: '#334155',
    height: 42,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 13,
    color: '#334155',
  },
  placeholderText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  halfInput: { flex: 1 },
  smallInput: { flex: 3 },
  largeInput: { flex: 7 },

  errorText: { color: '#ef4444', fontSize: 11, marginTop: 2 },

  termsContainer: { marginVertical: 15 },
  checkboxGroup: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#007bff' },
  checkboxLabel: { fontSize: 12, color: '#475569', flex: 1 },
  link: { color: '#007bff', fontWeight: '600', textDecorationLine: 'underline' },

  btnSubmit: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginTop: 10,
  },
  btnDisabled: { backgroundColor: '#94a3b8', opacity: 0.8 },
  btnSubmitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loadingContent: { flexDirection: 'row', alignItems: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSucesso: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 320,
    width: '90%',
  },
  modalText: { color: '#64748b', fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    maxHeight: 400,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  itemLista: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  itemListaSelecionado: { backgroundColor: '#eff6ff' },
  itemListaTexto: { fontSize: 15, color: '#334155' },
  itemListaTextoSelecionado: { fontWeight: '600', color: '#007bff' },
});
