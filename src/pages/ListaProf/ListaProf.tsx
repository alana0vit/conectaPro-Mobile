import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

type ListaProfRouteParams = {
  reassignDemandId?: number;
};

export default function ListaProf() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = route.params as ListaProfRouteParams | undefined;
  const reassignDemandId = params?.reassignDemandId ?? null;
  const isReassign = reassignDemandId != null;

  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  const [filtroEstrelas, setFiltroEstrelas] = useState('TODOS');
  const [showCategoriaPicker, setShowCategoriaPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const buscarProfissionais = async (filtros: any = {}) => {
    setLoading(true);
    try {
      const temFiltros = Object.values(filtros).some(v => v !== undefined && v !== '');
      let res;
      if (temFiltros) {
        res = await api.get('/api/user/search', { params: filtros });
      } else {
        res = await api.get('/api/user');
      }
      const apenasProfissionais = res.data.filter((u: any) => u.userType === 'PROFESSIONAL');
      setProfissionais(apenasProfissionais);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar profissionais' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarProfissionais();
    api.get('/api/category')
      .then(res => setCategorias(res.data))
      .catch(() => { });
  }, []);

  const lidarComBusca = () => {
    buscarProfissionais({
      name: searchTerm || undefined,
      categoryId: categoriaSelecionada || undefined,
    });
  };

  const pegarLocalizacao = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permissão de localização negada' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      buscarProfissionais({
        name: searchTerm || undefined,
        categoryId: categoriaSelecionada || undefined,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        radiusKm: 20,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao obter localização' });
    }
  };

  const lidarComSelecaoProfissional = async (professionalId: number) => {
    if (isReassign) {
      try {
        await api.patch(`/api/demand/${reassignDemandId}/reassign`, {
          professionalId: professionalId,
        });
        Toast.show({ type: 'success', text1: 'Demanda reatribuída com sucesso!' });
        navigation.reset({ index: 0, routes: [{ name: 'DashboardCliente' }] });
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'Erro ao reatribuir chamado' });
      }
    } else {
      navigation.navigate('SolicServico', { profissionalId: professionalId });
    }
  };

  const profissionaisFiltrados = profissionais.filter((prof) => {
    const nota = prof.rating != null ? prof.rating : 5.0;
    if (filtroEstrelas === '4PLUS') return nota >= 4.0;
    if (filtroEstrelas === '3PLUS') return nota >= 3.0;
    if (filtroEstrelas === 'NEW') return prof.rating == null;
    return true; 
  });

  const coresTopo = ['#e6f0ff', '#e6ffe6', '#fff0e6', '#f0e6ff'];

  return (
    <ScrollView style={styles.pagina}>
      {isReassign && (
        <View style={styles.bannerReatribuir}>
          <FontAwesome5 name="info-circle" size={16} color="#155724" />
          <Text style={styles.bannerText}>
            Modo de Reatribuição Ativo: Escolha um novo profissional para assumir o chamado recusado.
          </Text>
        </View>
      )}

      <View style={styles.topoBusca}>
        <Text style={styles.tituloPrincipal}>
          Encontre o{'\n'}
          <Text style={styles.sublinhado}>talento certo!</Text>
        </Text>
        <Text style={styles.subtitulo}>
          Explore nossa rede de profissionais qualificados prontos para realizar o seu projeto.
        </Text>

        <View style={styles.blocoBusca}>
          <View style={styles.barraPesquisa}>
            <FontAwesome5 name="search" size={16} color="#999" />
            <TextInput
              style={styles.inputPesquisa}
              placeholder="Ex: Carlos, Eletricista..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <TouchableOpacity style={styles.btnBuscar} onPress={lidarComBusca}>
              <Text style={styles.btnBuscarText}>Buscar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filtrosLinha}>
            <TouchableOpacity
              style={styles.selectFiltro}
              onPress={() => setShowCategoriaPicker(true)}
            >
              <Text style={styles.selectFiltroText} numberOfLines={1}>
                {categoriaSelecionada
                  ? categorias.find(c => c.id == categoriaSelecionada)?.name || 'Categoria'
                  : 'Todas categorias'}
              </Text>
              <FontAwesome5 name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>

            {/* Filtro de estrelas */}
            <View style={styles.selectFiltroWrapper}>
              <FontAwesome5 name="star" size={14} color="#0066ff" style={{ marginRight: 4 }} />
              <TouchableOpacity
                style={styles.selectFiltroSmall}
                onPress={() => {
                  const opcoes = ['TODOS', '4PLUS', '3PLUS', 'NEW'];
                  const idx = opcoes.indexOf(filtroEstrelas);
                  setFiltroEstrelas(opcoes[(idx + 1) % opcoes.length]);
                }}
              >
                <Text style={styles.selectFiltroTextSmall} numberOfLines={1}>
                  {filtroEstrelas === 'TODOS' ? 'Todas as Notas' :
                    filtroEstrelas === '4PLUS' ? '⭐ 4.0+' :
                      filtroEstrelas === '3PLUS' ? '⭐ 3.0+' : '⭐ Novos'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnLocalizacao} onPress={pegarLocalizacao}>
              <FontAwesome5 name="location-arrow" size={14} color="#fff" />
              <Text style={styles.btnLocalizacaoText}>Perto de mim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.conteudoGrade}>
        <Text style={styles.tituloSessao}>Profissionais Disponíveis</Text>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Carregando...</Text>
        ) : profissionaisFiltrados.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhum profissional encontrado.</Text>
        ) : (
          <FlatList
            data={profissionaisFiltrados}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item, index }) => {
              const notaExibida = item.rating != null ? item.rating.toFixed(1) : '5.0';
              return (
                <TouchableOpacity
                  style={styles.cartao}
                  onPress={() => lidarComSelecaoProfissional(item.id)}
                >
                  <View style={[styles.topoColorido, { backgroundColor: coresTopo[index % coresTopo.length] }]} />
                  <View style={styles.corpoCartao}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTexto}>
                        {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <Text style={styles.nome} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.telefone}>{item.phone || 'Telefone não informado'}</Text>
                    <View style={styles.avaliacao}>
                      <FontAwesome5 name="star" size={14} solid color="#ffcc00" />
                      <Text style={styles.avaliacaoNota}>{notaExibida}</Text>
                      <Text style={styles.avaliacaoLabel}>
                        ({item.rating != null ? 'Avaliado' : 'Novo'})
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.btnCard, isReassign && styles.btnReatribuir]}
                      onPress={() => lidarComSelecaoProfissional(item.id)}
                    >
                      <Text style={[styles.btnCardText, isReassign && { color: '#fff' }]}>
                        {isReassign ? 'Reatribuir a Este' : 'Solicitar Serviço'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <Modal visible={showCategoriaPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <TouchableOpacity
              style={[styles.categoriaItem, !categoriaSelecionada && styles.categoriaItemAtiva]}
              onPress={() => { setCategoriaSelecionada(''); setShowCategoriaPicker(false); }}
            >
              <Text style={{ color: !categoriaSelecionada ? '#fff' : '#333' }}>Todas categorias</Text>
            </TouchableOpacity>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoriaItem, categoriaSelecionada == cat.id && styles.categoriaItemAtiva]}
                onPress={() => { setCategoriaSelecionada(cat.id.toString()); setShowCategoriaPicker(false); }}
              >
                <Text style={{ color: categoriaSelecionada == cat.id ? '#fff' : '#333' }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setShowCategoriaPicker(false)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: '#fff' },
  bannerReatribuir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#c3e6cb',
  },
  bannerText: { color: '#155724', fontWeight: '600', flex: 1, fontSize: 13 },
  topoBusca: { padding: 20, alignItems: 'center' },
  tituloPrincipal: { fontSize: 36, fontWeight: '800', textAlign: 'center', lineHeight: 40, marginBottom: 10 },
  sublinhado: { color: '#0066ff', textDecorationLine: 'underline' },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, maxWidth: 300 },
  blocoBusca: { width: '100%', gap: 12 },
  barraPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingLeft: 15,
    elevation: 2,
  },
  inputPesquisa: { flex: 1, fontSize: 14, paddingVertical: 10 },
  btnBuscar: { backgroundColor: '#0066ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50 },
  btnBuscarText: { color: '#fff', fontWeight: '700' },
  filtrosLinha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  selectFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
  selectFiltroSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectFiltroWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0066ff',
    backgroundColor: '#fff',
    paddingLeft: 10,
    overflow: 'hidden',
  },
  selectFiltroText: { fontSize: 13, color: '#333', flexShrink: 1 },
  selectFiltroTextSmall: { fontSize: 13, color: '#333', flexShrink: 1 },
  btnLocalizacao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e66f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  btnLocalizacaoText: { color: '#fff', fontWeight: '500' },
  conteudoGrade: { padding: 20, backgroundColor: '#fcfcfc' },
  tituloSessao: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  cartao: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
  },
  topoColorido: { height: 70 },
  corpoCartao: { alignItems: 'center', padding: 20, marginTop: -35 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 10,
  },
  avatarTexto: { color: '#fff', fontSize: 24, fontWeight: '800' },
  nome: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  telefone: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 2, marginBottom: 10 },
  avaliacao: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 15 },
  avaliacaoNota: { fontWeight: '700' },
  avaliacaoLabel: { color: '#999', fontSize: 12 },
  btnCard: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  btnReatribuir: { backgroundColor: '#28a745', borderColor: '#28a745' },
  btnCardText: { color: '#0066ff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  categoriaItem: { padding: 14, borderRadius: 10, marginBottom: 6, backgroundColor: '#f8f9fa' },
  categoriaItemAtiva: { backgroundColor: '#0066ff' },
  btnFecharModal: { alignItems: 'center', padding: 14, marginTop: 10 },
});
