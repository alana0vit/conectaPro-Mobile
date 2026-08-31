import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

type ListaProfRouteParams = {
  reassignDemandId?: number;
};

const INTERVALO_REFRESH = 30_000;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const ESTRELAS_OPCOES = [
  { label: '⭐ Todas as Notas', value: 'TODOS' },
  { label: '⭐ 5 estrelas', value: '5' },
  { label: '⭐ 4.0 ou mais', value: '4PLUS' },
  { label: '⭐ 3.0 ou mais', value: '3PLUS' },
];

const RAIO_OPCOES = [5, 10, 20, 50];

// Função para converter ArrayBuffer para base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
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
  const [raioKm, setRaioKm] = useState(20);
  const [usandoLocalizacao, setUsandoLocalizacao] = useState(false);
  const [coordenadas, setCoordenadas] = useState<{ latitude: number; longitude: number } | null>(null);

  const [showCategoriaPicker, setShowCategoriaPicker] = useState(false);
  const [showEstrelasPicker, setShowEstrelasPicker] = useState(false);
  const [showRaioPicker, setShowRaioPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [modalAvaliacoes, setModalAvaliacoes] = useState<any>(null);
  const [avaliacoesData, setAvaliacoesData] = useState<any[]>([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);

  // Estados para fotos
  const [fotosBase64, setFotosBase64] = useState<Record<number, string | null>>({});
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null);

  const ultimosFiltrosRef = useRef<any>({});
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const buscarProfissionais = async (filtros: any = {}) => {
    ultimosFiltrosRef.current = filtros;
    try {
      setLoading(true);
      const temFiltros = Object.values(filtros).some(
        (v) => v !== undefined && v !== '' && v !== null
      );
      let response;
      if (temFiltros) {
        response = await api.get('/api/user/search', { params: filtros });
      } else {
        response = await api.get('/api/user');
      }
      const apenasProfissionais = (response.data || []).filter(
        (u: any) => u.userType === 'PROFESSIONAL'
      );
      setProfissionais(apenasProfissionais);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    } finally {
      setLoading(false);
    }
  };

  // Busca automática com debounce
  const executarBuscaComFiltros = useCallback(() => {
    const filtros: any = {
      name: searchTerm || undefined,
      categoryId: categoriaSelecionada || undefined,
    };
    // Se localização estiver ativa e tivermos coordenadas, inclui na busca
    if (usandoLocalizacao && coordenadas) {
      filtros.latitude = coordenadas.latitude;
      filtros.longitude = coordenadas.longitude;
      filtros.radiusKm = raioKm;
    }
    buscarProfissionais(filtros);
  }, [searchTerm, categoriaSelecionada, filtroEstrelas, raioKm, usandoLocalizacao, coordenadas]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executarBuscaComFiltros();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [executarBuscaComFiltros]);

  useEffect(() => {
    api.get('/api/category')
      .then(res => setCategorias(res.data || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      buscarProfissionais(ultimosFiltrosRef.current);
    }, INTERVALO_REFRESH);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  // Baixa as fotos dos profissionais sempre que a lista muda
  useEffect(() => {
    const carregarFotos = async () => {
      const novasFotos: Record<number, string | null> = {};
      const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') || '';

      const promessas = profissionais.map(async (prof) => {
        if (!prof.photo) {
          novasFotos[prof.id] = null;
          return;
        }
        try {
          const imageUrl = prof.photo.startsWith('http')
            ? prof.photo
            : `${baseUrl}/api/images/${prof.photo}`;
          const response = await api.get(imageUrl, { responseType: 'arraybuffer' });
          const base64 = arrayBufferToBase64(response.data);
          const mimeType = response.headers['content-type'] || 'image/jpeg';
          novasFotos[prof.id] = `data:${mimeType};base64,${base64}`;
        } catch (error) {
          console.error(`Erro ao baixar foto do profissional ${prof.id}:`, error);
          novasFotos[prof.id] = null;
        }
      });

      await Promise.all(promessas);
      setFotosBase64(novasFotos);
    };

    if (profissionais.length > 0) {
      carregarFotos();
    }
  }, [profissionais]);

  const lidarComBusca = () => {
    executarBuscaComFiltros();
  };

  const alternarLocalizacao = async () => {
    if (usandoLocalizacao) {
      // Desativa a localização
      setUsandoLocalizacao(false);
      setCoordenadas(null);
    } else {
      // Solicita permissão e coordenadas
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permissão de localização negada.' });
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setCoordenadas({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setUsandoLocalizacao(true);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Erro ao obter localização.' });
      }
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
        Toast.show({ type: 'error', text1: 'Erro ao reatribuir chamado.' });
      }
    } else {
      navigation.navigate('SolicServico', { profissionalId: professionalId } as any);
    }
  };

  const abrirModalAvaliacoes = async (profId: number, nome: string) => {
    setModalAvaliacoes({ id: profId, nome });
    setCarregandoAvaliacoes(true);
    try {
      const res = await api.get(`/api/rating/user/${profId}`);
      setAvaliacoesData(res.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar avaliações.' });
      setAvaliacoesData([]);
    } finally {
      setCarregandoAvaliacoes(false);
    }
  };

  const profissionaisFiltrados = profissionais
    .filter((prof) => {
      const nota = prof.rating != null ? prof.rating : -1;
      if (filtroEstrelas === '5') return nota >= 5.0;
      if (filtroEstrelas === '4PLUS') return nota >= 4.0;
      if (filtroEstrelas === '3PLUS') return nota >= 3.0;
      return true; // TODOS
    })
    .sort((a, b) => {
      const notaA = a.rating != null ? a.rating : -1;
      const notaB = b.rating != null ? b.rating : -1;
      return notaB - notaA;
    });

  const coresTopo = ['#e6f0ff', '#e6ffe6', '#fff0e6', '#f0e6ff'];

  return (
    <View style={styles.pagina}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#007bff" />
          <Text style={styles.btnVoltarText}>Voltar</Text>
        </TouchableOpacity>

        {isReassign && (
          <View style={styles.bannerReatribuir}>
            <Ionicons name="information-circle" size={18} color="#155724" />
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
              <Ionicons name="search" size={18} color="#999" />
              <TextInput
                style={styles.inputPesquisa}
                placeholder="Ex: Carlos, Eletricista..."
                placeholderTextColor="#999"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={lidarComBusca}
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
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectFiltro}
                onPress={() => setShowEstrelasPicker(true)}
              >
                <Text style={styles.selectFiltroText} numberOfLines={1}>
                  {ESTRELAS_OPCOES.find(o => o.value === filtroEstrelas)?.label || 'Estrelas'}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>

              <View style={styles.localizacaoContainer}>
                <TouchableOpacity
                  style={styles.selectFiltroSmall}
                  onPress={() => setShowRaioPicker(true)}
                >
                  <Text style={styles.selectFiltroTextSmall}>{raioKm} km</Text>
                  <Ionicons name="chevron-down" size={12} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnLocalizacao, usandoLocalizacao && styles.btnLocalizacaoAtivo]}
                  onPress={alternarLocalizacao}
                >
                  <Ionicons name="navigate" size={14} color="#fff" />
                  <Text style={styles.btnLocalizacaoText}>
                    {usandoLocalizacao ? 'GPS ativo' : 'Perto de mim'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.conteudoGrade}>
          <Text style={styles.tituloSessao}>
            Profissionais Disponíveis ({profissionaisFiltrados.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#0066ff" style={{ marginTop: 30 }} />
          ) : profissionaisFiltrados.length === 0 ? (
            <Text style={styles.vazio}>Nenhum profissional encontrado para os filtros selecionados.</Text>
          ) : (
            <FlatList
              data={profissionaisFiltrados}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => {
                const fotoUri = fotosBase64[item.id];
                const localizacao = item.adresses && item.adresses.length > 0
                  ? `${item.adresses[0].neighborhood}, ${item.adresses[0].city}`
                  : null;

                return (
                  <TouchableOpacity
                    style={[styles.cartao, { width: CARD_WIDTH }]}
                    activeOpacity={0.8}
                    onPress={() => lidarComSelecaoProfissional(item.id)}
                  >
                    <View style={[styles.topoColorido, { backgroundColor: coresTopo[index % coresTopo.length] }]} />
                    <View style={styles.corpoCartao}>
                      <TouchableOpacity
                        onPress={() => fotoUri && setFotoExpandida(fotoUri)}
                        disabled={!fotoUri}
                      >
                        <View style={styles.avatar}>
                          {fotoUri ? (
                            <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.avatarTexto}>
                              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      <Text style={styles.nome} numberOfLines={1}>{item.name}</Text>

                      {localizacao && (
                        <Text style={styles.localizacao} numberOfLines={1}>
                          <Ionicons name="location-outline" size={10} color="#64748b" /> {localizacao}
                        </Text>
                      )}

                      {item.categories && item.categories.length > 0 ? (
                        <Text style={styles.especialidade} numberOfLines={1}>
                          {item.categories.map((c: any) => c.name).join(' • ')}
                        </Text>
                      ) : (
                        <Text style={styles.especialidadeVazia}>Especialidade não informada</Text>
                      )}

                      <View style={styles.avaliacao}>
                        {item.rating != null ? (
                          <>
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text style={styles.avaliacaoNota}>{item.rating.toFixed(1)}</Text>
                          </>
                        ) : (
                          <Text style={styles.avaliacaoSemNota}>Sem avaliação</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.btnVerAvaliacoes}
                        onPress={() => abrirModalAvaliacoes(item.id, item.name)}
                      >
                        <Ionicons name="chatbubbles-outline" size={14} color="#3b82f6" />
                        <Text style={styles.btnVerAvaliacoesText}>Ver avaliações</Text>
                      </TouchableOpacity>

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
      </ScrollView>

      {/* Modal Categoria */}
      <Modal visible={showCategoriaPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <FlatList
              data={[{ id: '', name: 'Todas categorias' }, ...categorias]}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, categoriaSelecionada == item.id.toString() && styles.modalItemAtivo]}
                  onPress={() => {
                    setCategoriaSelecionada(item.id.toString());
                    setShowCategoriaPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, categoriaSelecionada == item.id.toString() && { color: '#fff' }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setShowCategoriaPicker(false)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Estrelas */}
      <Modal visible={showEstrelasPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por Avaliação</Text>
            {ESTRELAS_OPCOES.map((op) => (
              <TouchableOpacity
                key={op.value}
                style={[styles.modalItem, filtroEstrelas === op.value && styles.modalItemAtivo]}
                onPress={() => {
                  setFiltroEstrelas(op.value);
                  setShowEstrelasPicker(false);
                }}
              >
                <Text style={[styles.modalItemText, filtroEstrelas === op.value && { color: '#fff' }]}>
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setShowEstrelasPicker(false)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Raio */}
      <Modal visible={showRaioPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Raio de Busca</Text>
            {RAIO_OPCOES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.modalItem, raioKm === r && styles.modalItemAtivo]}
                onPress={() => {
                  setRaioKm(r);
                  setShowRaioPicker(false);
                }}
              >
                <Text style={[styles.modalItemText, raioKm === r && { color: '#fff' }]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setShowRaioPicker(false)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Avaliações */}
      <Modal visible={!!modalAvaliacoes} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.avaliacoesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliações de {modalAvaliacoes?.nome}</Text>
              <TouchableOpacity onPress={() => setModalAvaliacoes(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {carregandoAvaliacoes ? (
              <ActivityIndicator size="large" color="#0066ff" style={{ marginVertical: 20 }} />
            ) : avaliacoesData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#666', marginVertical: 20 }}>
                Nenhuma avaliação disponível.
              </Text>
            ) : (
              <FlatList
                data={avaliacoesData}
                keyExtractor={(item, idx) => idx.toString()}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <View style={styles.avaliacaoItem}>
                    <View style={styles.avaliacaoItemHeader}>
                      <Ionicons name="person-circle-outline" size={18} color="#333" />
                      <Text style={styles.avaliacaoItemAutor}>
                        {item.anonymous ? 'Anônimo' : item.evaluatingPerson?.name || 'Cliente'}
                      </Text>
                      <View style={styles.avaliacaoItemEstrelas}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons
                            key={s}
                            name="star"
                            size={14}
                            color={s <= item.points ? '#ffcc00' : '#ccc'}
                          />
                        ))}
                      </View>
                    </View>
                    {item.description ? (
                      <Text style={styles.avaliacaoItemDesc}>{item.description}</Text>
                    ) : null}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Foto Expandida */}
      <Modal visible={!!fotoExpandida} transparent={false} animationType="fade" onRequestClose={() => setFotoExpandida(null)}>
        <View style={styles.modalFotoContainer}>
          <TouchableOpacity style={styles.fecharFotoBtn} onPress={() => setFotoExpandida(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {fotoExpandida && (
            <Image source={{ uri: fotoExpandida }} style={styles.fotoExpandidaImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },
  btnVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  btnVoltarText: { fontSize: 16, color: '#007bff', fontWeight: '500' },
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
  topoBusca: { padding: 24, alignItems: 'center', backgroundColor: '#fff' },
  tituloPrincipal: {
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 12,
    color: '#111',
  },
  sublinhado: {
    color: '#0066ff',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(0,102,255,0.3)',
  },
  subtitulo: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
    lineHeight: 22,
  },
  blocoBusca: { width: '100%', gap: 12 },
  barraPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingLeft: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  inputPesquisa: { flex: 1, fontSize: 15, paddingVertical: 12, color: '#333' },
  btnBuscar: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    margin: 4,
  },
  btnBuscarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  filtrosLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    minWidth: 100,
    justifyContent: 'space-between',
  },
  selectFiltroText: { fontSize: 13, color: '#333', flexShrink: 1 },
  selectFiltroSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 4,
  },
  selectFiltroTextSmall: { fontSize: 13, color: '#333' },
  localizacaoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnLocalizacao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e66f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  btnLocalizacaoAtivo: {
    backgroundColor: '#0066ff',
  },
  btnLocalizacaoText: { color: '#fff', fontWeight: '500', fontSize: 13 },
  conteudoGrade: { paddingHorizontal: GRID_PADDING, paddingTop: 10, backgroundColor: '#fcfcfc' },
  tituloSessao: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 20, marginTop: 10 },
  vazio: { textAlign: 'center', color: '#666', marginTop: 30, fontSize: 15 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: GRID_GAP },
  listContent: { paddingBottom: 20 },
  cartao: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  topoColorido: { height: 70 },
  corpoCartao: { alignItems: 'center', padding: 16, marginTop: -35 },
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarTexto: { color: '#fff', fontSize: 24, fontWeight: '800' },
  nome: { fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 2 },
  localizacao: { fontSize: 11, color: '#64748b', textAlign: 'center', marginBottom: 4 },
  especialidade: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 6 },
  especialidadeVazia: { fontSize: 12, color: '#aaa', fontStyle: 'italic', marginBottom: 6 },
  avaliacao: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  avaliacaoNota: { fontWeight: '700', fontSize: 14, color: '#111' },
  avaliacaoSemNota: { fontSize: 12, color: '#888', fontWeight: '600' },
  btnVerAvaliacoes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 10,
    width: '100%',
  },
  btnVerAvaliacoesText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  btnCard: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  btnReatribuir: { backgroundColor: '#28a745', borderColor: '#28a745' },
  btnCardText: { color: '#0066ff', fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalItem: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f8f9fa',
  },
  modalItemAtivo: { backgroundColor: '#0066ff' },
  modalItemText: { fontSize: 15, color: '#333', textAlign: 'center' },
  btnFecharModal: { alignItems: 'center', padding: 14, marginTop: 6 },
  avaliacoesModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avaliacaoItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avaliacaoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avaliacaoItemAutor: { fontWeight: '600', fontSize: 13, color: '#333', flex: 1 },
  avaliacaoItemEstrelas: { flexDirection: 'row', gap: 2 },
  avaliacaoItemDesc: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 18 },
  modalFotoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fecharFotoBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fotoExpandidaImg: {
    width: '100%',
    height: '80%',
  },
});
