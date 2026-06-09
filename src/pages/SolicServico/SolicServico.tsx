import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

type SolicRouteProp = RouteProp<RootStackParamList, 'SolicServico'>;

export default function SolicServico() {
  const route = useRoute<SolicRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profissionalId } = route.params;
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [profNome, setProfNome] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarProf = async () => {
      try {
        const res = await api.get(`/profissionais/${profissionalId}`);
        setProfNome(res.data.nome);
      } catch (error) {
        console.error(error);
      }
    };
    carregarProf();
  }, [profissionalId]);

  const onSubmit = async () => {
    if (!descricao.trim() || !endereco.trim()) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/solicitacoes', {
        profissionalId,
        descricao,
        endereco,
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
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
          <Text style={styles.btnVoltarText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Solicitar Serviço</Text>
        {profNome ? (
          <Text style={styles.profDestaque}>
            Profissional: <Text style={{ fontWeight: 'bold' }}>{profNome}</Text>
          </Text>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição do serviço</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={5}
            placeholder="Descreva detalhadamente o serviço..."
            value={descricao}
            onChangeText={setDescricao}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            placeholder="Informe o endereço onde será realizado"
            value={endereco}
            onChangeText={setEndereco}
          />
        </View>
        <TouchableOpacity
          style={[styles.btnEnviar, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          <Text style={styles.btnEnviarText}>{loading ? 'Enviando...' : 'Enviar Solicitação'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f8f9fa' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  btnVoltar: { marginBottom: 15 },
  btnVoltarText: { color: '#007bff', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  profDestaque: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 6, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top' },
  btnEnviar: { backgroundColor: '#0066ff', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  btnEnviarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
