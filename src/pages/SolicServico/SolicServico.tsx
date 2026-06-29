import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getUserId } from '../../services/auth';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type SolicRouteProp = RouteProp<RootStackParamList, 'SolicServico'>;

export default function SolicServico() {
  const route = useRoute<SolicRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profissionalId } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addressId, setAddressId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profName, setProfName] = useState('');

  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const maxDate = new Date(hoje);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  useEffect(() => {
    (async () => {
      try {
        const userId = await getUserId();
        const [addrRes, catRes, profRes] = await Promise.all([
          api.get(`/api/user/${userId}/addresses`),
          api.get('/api/category'),
          api.get(`/api/user/${profissionalId}`),
        ]);
        setAddresses(addrRes.data || []);
        if (addrRes.data && addrRes.data.length > 0) {
          setAddressId(addrRes.data[0].id.toString());
        }
        setCategorias(catRes.data || []);
        setProfName(profRes.data.name || '');

        // Categoria definida automaticamente pela especialidade do profissional
        const primeiraCategoria = profRes.data.categories?.[0];
        if (primeiraCategoria) {
          setCategoryId(primeiraCategoria.id.toString());
        } else if (catRes.data && catRes.data.length > 0) {
          setCategoryId(catRes.data[0].id.toString());
        }
      } catch (error) {
        console.error('Erro ao carregar dados', error);
        Toast.show({ type: 'error', text1: 'Erro ao carregar dados do formulário.' });
      }
    })();
  }, [profissionalId]);

  const selecionarImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setImagemUri(asset.uri);
      setImagemFile({
        uri: asset.uri,
        name: asset.fileName || 'foto.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Valida se a data é futura (maior que hoje)
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);

      if (selectedDate <= hojeInicio) {
        Toast.show({ type: 'error', text1: 'A data sugerida deve ser futura.' });
        return;
      }
      if (selectedDate > maxDate) {
        Toast.show({ type: 'error', text1: 'A data sugerida não pode ultrapassar 1 ano a partir de hoje.' });
        return;
      }
      setSuggestedDate(formatDate(selectedDate));
    }
  };

  const onSubmit = async () => {
    if (!title.trim() || !description.trim() || !addressId || !categoryId) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    if (suggestedDate) {
      const dataSelecionada = new Date(suggestedDate + 'T00:00:00');
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);

      if (dataSelecionada <= hojeInicio) {
        Toast.show({ type: 'error', text1: 'A data sugerida deve ser futura.' });
        return;
      }
      if (dataSelecionada > maxDate) {
        Toast.show({ type: 'error', text1: 'A data sugerida não pode ultrapassar 1 ano a partir de hoje.' });
        return;
      }
    }

    const userId = await getUserId();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('addressId', addressId);
      formData.append('categoryId', categoryId);
      formData.append('clientId', userId!);
      formData.append('professionalId', profissionalId.toString());
      if (suggestedValue) formData.append('suggestedValue', suggestedValue);
      if (suggestedDate) formData.append('suggestedDate', suggestedDate);
      if (imagemFile) {
        formData.append('imagem', imagemFile as any);
      }

      await api.post('/api/demand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Toast.show({ type: 'success', text1: 'Solicitação enviada com sucesso!' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao enviar solicitação.';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!profissionalId) {
    return (
      <View style={styles.containerVazio}>
        <Text style={styles.textoVazio}>Nenhum profissional selecionado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Botão Voltar */}
      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color="#0066ff" />
        <Text style={styles.btnVoltarText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Solicitar Serviço</Text>

      {profName ? (
        <View style={styles.profDestaque}>
          <Text style={styles.profDestaqueTexto}>
            Profissional: <Text style={styles.profDestaqueNome}>{profName}</Text>
          </Text>
        </View>
      ) : null}

      {/* Título */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Título da demanda *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Conserto de torneira"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Descrição */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descrição *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          placeholder="Descreva o serviço detalhadamente..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Endereço */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Endereço *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={addressId}
            onValueChange={(value) => setAddressId(value)}
            style={styles.picker}
          >
            {addresses.map((a) => (
              <Picker.Item
                key={a.id}
                label={`${a.street}, ${a.number} - ${a.neighborhood}`}
                value={a.id.toString()}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Categoria (definida pelo profissional - desabilitada) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoria (definida pelo profissional)</Text>
        <View style={[styles.pickerWrapper, styles.pickerDisabled]}>
          <Picker
            selectedValue={categoryId}
            enabled={false}
            style={styles.picker}
          >
            {categorias.map((c) => (
              <Picker.Item
                key={c.id}
                label={c.name}
                value={c.id.toString()}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Valor máximo */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Valor máximo (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Opcional"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={suggestedValue}
          onChangeText={setSuggestedValue}
        />
      </View>

      {/* Data sugerida */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Data sugerida</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={suggestedDate ? styles.dateText : styles.datePlaceholder}>
            {suggestedDate
              ? suggestedDate.split('-').reverse().join('/')
              : 'Selecionar data'}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#666" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={suggestedDate ? new Date(suggestedDate + 'T00:00:00') : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={hoje}
            maximumDate={maxDate}
            onChange={handleDateChange}
            locale="pt-BR"
          />
        )}
      </View>

      {/* Imagem */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Imagem (opcional)</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={selecionarImagem}>
          <Ionicons name="image-outline" size={20} color="#0066ff" />
          <Text style={styles.imagePickerText}>
            {imagemUri ? 'Imagem selecionada' : 'Selecionar imagem'}
          </Text>
        </TouchableOpacity>
        {imagemUri && (
          <Image source={{ uri: imagemUri }} style={styles.previewImage} />
        )}
      </View>

      {/* Botão Enviar */}
      <TouchableOpacity
        style={[styles.btnEnviar, loading && styles.btnEnviarDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={styles.btnEnviarText}>
          {loading ? 'Enviando...' : 'Enviar Solicitação'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    paddingBottom: 40,
  },
  containerVazio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  textoVazio: {
    fontSize: 16,
    color: '#666',
  },
  btnVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  btnVoltarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  profDestaque: {
    backgroundColor: '#e3efff',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0066ff',
    marginBottom: 24,
  },
  profDestaqueTexto: {
    fontSize: 15,
    color: '#555',
  },
  profDestaqueNome: {
    color: '#0052cc',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#111',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pickerDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.8,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 15,
    color: '#111',
  },
  datePlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  imagePickerText: {
    color: '#0066ff',
    fontWeight: '600',
    fontSize: 15,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  btnEnviar: {
    backgroundColor: '#0066ff',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnEnviarDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnEnviarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
