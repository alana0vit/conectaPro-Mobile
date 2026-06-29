import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

type EditarDemandaRoute = RouteProp<RootStackParamList, 'EditarDemanda'>;

export default function EditarDemanda() {
  const route = useRoute<EditarDemandaRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const buscarDadosDemanda = async () => {
      try {
        setCarregando(true);
        const response = await api.get('/api/demand/user');
        const todasDemandas = Array.isArray(response.data) ? response.data : [];
        const demandaAlvo = todasDemandas.find((d: any) => Number(d.id) === Number(id));

        if (demandaAlvo) {
          setTitle(demandaAlvo.title || '');
          setDescription(demandaAlvo.description || '');
        } else {
          Toast.show({ type: 'error', text1: 'Solicitação não encontrada.' });
          navigation.goBack();
        }
      } catch (error) {
        console.error('Erro ao carregar dados da demanda:', error);
        Toast.show({ type: 'error', text1: 'Falha ao carregar os dados para edição.' });
      } finally {
        setCarregando(false);
      }
    };

    if (id) buscarDadosDemanda();
  }, [id, navigation]);

  const lidarComSubmissao = async () => {
    if (!title.trim() || !description.trim()) {
      Toast.show({ type: 'error', text1: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    try {
      setSalvando(true);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      await api.patch(`/api/demand/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Toast.show({ type: 'success', text1: 'Solicitação atualizada com sucesso!' });
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar demanda:', error);
      Toast.show({ type: 'error', text1: 'Ocorreu um erro ao salvar as alterações.' });
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066ff" />
        <Text style={styles.loadingText}>A carregar dados da solicitação...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.pageTitle}>Editar Solicitação</Text>
        <Text style={styles.pageSubtitle}>
          Altere os detalhes abaixo para atualizar o escopo do seu chamado.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título do Serviço</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Troca de fiação do chuveiro"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição Detalhada do Problema</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva aqui o que precisa ser feito de forma clara..."
            placeholderTextColor="#94a3b8"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.btnCancel}
            onPress={() => navigation.goBack()}
            disabled={salvando}
          >
            <Text style={styles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSave, salvando && styles.btnSaveDisabled]}
            onPress={lidarComSubmissao}
            disabled={salvando}
          >
            {salvando ? (
              <View style={styles.loadingSaveContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.btnSaveText}>A salvar alterações...</Text>
              </View>
            ) : (
              <Text style={styles.btnSaveText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f4f6f9',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#334155',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  btnSave: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#0066ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveDisabled: {
    opacity: 0.8,
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  loadingSaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
