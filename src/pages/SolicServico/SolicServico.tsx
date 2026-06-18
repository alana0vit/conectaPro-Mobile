import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getUserId } from '../../services/auth';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';

type SolicRouteProp = RouteProp<RootStackParamList, 'SolicServico'>;

export default function SolicServico() {
  const route = useRoute<SolicRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profissionalId } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addressId, setAddressId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profName, setProfName] = useState('');

  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<any>(null); // para o FormData

  useEffect(() => {
    (async () => {
      try {
        const userId = await getUserId();
        const [addrRes, catRes, profRes] = await Promise.all([
          api.get(`/api/user/${userId}/addresses`),
          api.get('/api/category'),
          api.get(`/api/user/${profissionalId}`),
        ]);
        setAddresses(addrRes.data);
        if (addrRes.data.length > 0) setAddressId(addrRes.data[0].id.toString());
        setCategorias(catRes.data);
        if (catRes.data.length > 0) setCategoryId(catRes.data[0].id.toString());
        setProfName(profRes.data.name);
      } catch (error) {
        console.error('Erro ao carregar dados', error);
      }
    })();
  }, []);

  const selecionarImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
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

  const onSubmit = async () => {
    if (!title || !description || !addressId || !categoryId) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos' });
      return;
    }
    const userId = await getUserId();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('addressId', addressId);
      formData.append('categoryId', categoryId);
      formData.append('clientId', userId!);
      formData.append('professionalId', profissionalId.toString());
      if (imagemFile) {
        formData.append('imagem', imagemFile);
      }

      await api.post('/api/demand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Toast.show({ type: 'success', text1: 'Solicitação enviada!' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao enviar solicitação';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnVoltarText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Solicitar Serviço</Text>
      {profName ? (
        <Text style={styles.profDestaque}>
          Profissional: <Text style={{ fontWeight: 'bold' }}>{profName}</Text>
        </Text>
      ) : null}

      {/* Título do chamado */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Título do Chamado *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Conserto de torneira"
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
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Endereço (Picker) */}
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

      {/* Categoria (Picker) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={categoryId}
            onValueChange={(value) => setCategoryId(value)}
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

      {/* Imagem (opcional) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Imagem (opcional)</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={selecionarImagem}>
          <FontAwesome5 name="image" size={18} color="#0066ff" />
          <Text style={styles.imagePickerText}>
            {imagemUri ? 'Imagem selecionada' : 'Selecionar imagem'}
          </Text>
        </TouchableOpacity>
        {imagemUri && (
          <Image source={{ uri: imagemUri }} style={styles.previewImage} />
        )}
      </View>

      <TouchableOpacity
        style={[styles.btnEnviar, loading && { opacity: 0.7 }]}
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
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f8f9fa' },
  btnVoltar: { marginBottom: 15 },
  btnVoltarText: { color: '#007bff', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  profDestaque: { textAlign: 'center', marginBottom: 20, fontSize: 16, color: '#333' },
  inputGroup: { marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 6, color: '#444', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  picker: { height: 50 },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  imagePickerText: { color: '#0066ff', fontWeight: '600' },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginTop: 10,
    borderRadius: 8,
  },
  btnEnviar: {
    backgroundColor: '#0066ff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnEnviarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
