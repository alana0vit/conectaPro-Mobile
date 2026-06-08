import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { getToken } from '../../services/auth';

type ProfileRouteProp = RouteProp<RootStackParamList, 'PerfilProfissional'>;

interface ProfissionalData {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  descricao?: string;
  especialidade?: string;
  mediaAvaliacao?: number;
  totalAvaliacoes?: number;
  fotoperfil?: string;
  endereco?: { cidade: string; estado: string };
}

export default function PerfilProfissional() {
  const route = useRoute<ProfileRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params;
  const [profissional, setProfissional] = useState<ProfissionalData | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = async () => {
    try {
      const res = await api.get(`/profissionais/${id}`);
      setProfissional(res.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar perfil' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPerfil();
  }, [id]);

  const handleSolicitarServico = async () => {
    const token = await getToken();
    if (!token) {
      Toast.show({ type: 'error', text1: 'Faça login para solicitar um serviço' });
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('SolicServico', { profissionalId: id });
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (!profissional) return <Text>Profissional não encontrado</Text>;

  return (
    <ScrollView style={styles.bg}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{ uri: profissional.fotoperfil || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <View style={styles.identidade}>
            <Text style={styles.nome}>{profissional.nome}</Text>
            <Text style={styles.especialidade}>{profissional.especialidade || 'Geral'}</Text>
            <View style={styles.badgeAzul}>
              <FontAwesome5 name="star" size={14} color="#ffcc00" />
              <Text style={styles.avaliacaoTexto}>
                {profissional.mediaAvaliacao?.toFixed(1) || '0.0'} ({profissional.totalAvaliacoes || 0})
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.coluna}>
            <Text style={styles.tituloSecao}>Apresentação</Text>
            <View style={styles.card}>
              <FontAwesome5 name="user" size={30} color="#007bff" style={{ marginBottom: 10 }} />
              <Text>{profissional.descricao || 'Profissional ainda não adicionou descrição.'}</Text>
            </View>
            <Text style={styles.tituloSecao}>Especialidades</Text>
            <View style={styles.tags}>
              {profissional.especialidade && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{profissional.especialidade}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.coluna}>
            <Text style={styles.tituloSecao}>Contato</Text>
            <View style={styles.card}>
              <Text>{profissional.email}</Text>
              <Text>{profissional.telefone}</Text>
              <Text>
                {profissional.endereco?.cidade}/{profissional.endereco?.estado}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.btnSolicitar} onPress={handleSolicitarServico}>
          <Text style={styles.btnSolicitarText}>Solicitar Serviço</Text>
        </TouchableOpacity>
        <Text style={styles.aviso}>
          Você poderá conversar diretamente com o profissional após a solicitação.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 20 },
  identidade: { flex: 1 },
  nome: { fontSize: 24, fontWeight: 'bold' },
  especialidade: { color: '#888', marginBottom: 8 },
  badgeAzul: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f1ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 5,
  },
  avaliacaoTexto: { color: '#007bff', fontWeight: 'bold' },
  grid: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
  coluna: { flex: 1, minWidth: 200 },
  tituloSecao: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#e7f1ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: '#007bff' },
  btnSolicitar: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
  },
  btnSolicitarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  aviso: { textAlign: 'center', color: '#bbb', marginTop: 15, fontSize: 11 },
});
