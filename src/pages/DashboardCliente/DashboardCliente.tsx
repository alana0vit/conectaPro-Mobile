import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { getUserId } from '../../services/auth';
import DetalhesSolicitacao from '../DetalhesSolicitacao/DetalhesSolicitacao';

const INTERVALO_REFRESH = 30_000;

export default function DashboardCliente() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('PENDENTE');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [pedidoDetalhado, setPedidoDetalhado] = useState<any>(null);
  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState<any>(null);
  const [estrelas, setEstrelas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [anonimo, setAnonimo] = useState(false);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<Record<number, number>>({});
  const [userName, setUserName] = useState('Cliente');

  const userIdRef = useRef<number | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const buscarMeusPedidos = async (silencioso = false) => {
    if (!userIdRef.current) return;
    try {
      if (!silencioso) setLoading(true);
      const response = await api.get('/api/demand/user');
      const dados = Array.isArray(response.data) ? response.data : [];
      const meus = dados
        .filter((d: any) => {
          const idCli = d.clientId?.id || d.clientId;
          return Number(idCli) === Number(userIdRef.current);
        })
        .sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      setPedidos(meus);
    } catch (err) {
      console.error("Erro ao carregar demandas:", err);
      if (!silencioso) Toast.show({ type: 'error', text1: 'Erro ao carregar os seus serviços.' });
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const buscarAvaliacoes = async () => {
    if (!userIdRef.current) return;
    try {
      const res = await api.get(`/api/rating/user/${userIdRef.current}/evaluator`);
      const ratings = Array.isArray(res.data) ? res.data : [];
      const mapa: Record<number, number> = {};
      ratings.forEach((r: any) => {
        if (r.service && r.service.id && r.points != null) {
          mapa[r.service.id] = r.points;
        }
      });
      setAvaliacoes(mapa);
    } catch (err) {
      console.error("Erro ao carregar avaliações:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await buscarMeusPedidos(true);
    await buscarAvaliacoes();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const userId = await getUserId();
        userIdRef.current = Number(userId);
        try {
          const res = await api.get(`/api/user/${userId}`);
          setUserName(res.data.name);
        } catch (e) {
          setUserName('Cliente');
        }
        buscarMeusPedidos();
        buscarAvaliacoes();
      })();
      return () => { };
    }, [])
  );

  useEffect(() => {
    if (!userIdRef.current) return;
    refreshIntervalRef.current = setInterval(() => {
      buscarMeusPedidos(true);
      buscarAvaliacoes();
    }, INTERVALO_REFRESH);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  const enviarAvaliacaoSistema = async () => {
    if (!pedidoParaAvaliar) return;
    const professionalId = pedidoParaAvaliar.professionalId?.id || pedidoParaAvaliar.professionalId;
    if (!professionalId) {
      Toast.show({ type: 'error', text1: 'Não foi possível identificar o profissional associado.' });
      return;
    }
    setEnviandoAvaliacao(true);
    try {
      const userId = userIdRef.current;
      const resRating = await api.post('/api/rating', {
        service: Number(pedidoParaAvaliar.id),
        evaluatingPerson: Number(userId),
        personEvaluated: Number(professionalId),
      });
      const ratingId = resRating.data.id;
      await api.put(`/api/rating/${ratingId}`, {
        approved: true,
        points: Number(estrelas),
        description: comentario.trim(),
        anonymous: Boolean(anonimo),
      });
      setAvaliacoes(prev => ({ ...prev, [pedidoParaAvaliar.id]: Number(estrelas) }));
      Toast.show({ type: 'success', text1: 'Avaliação enviada com sucesso!' });
      setPedidoParaAvaliar(null);
      setComentario('');
      setEstrelas(5);
      setAnonimo(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao enviar avaliação';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const status = String(p.demandStatus || '').toUpperCase();
    const matchesTexto = p.title?.toLowerCase().includes(buscaTexto.toLowerCase());
    if (!matchesTexto) return false;
    if (abaAtiva === 'PENDENTE') return status === 'ABERTO';
    if (abaAtiva === 'ANDAMENTO') return status === 'AGUARDANDO';
    if (abaAtiva === 'FINALIZADO') return status === 'FECHADO' || status === 'REJEITADO';
    return true;
  });

  const pendentes = pedidos.filter(p => String(p.demandStatus || '').toUpperCase() === 'ABERTO').length;
  const emAndamento = pedidos.filter(p => String(p.demandStatus || '').toUpperCase() === 'AGUARDANDO').length;
  const finalizados = pedidos.filter(p => {
    const s = String(p.demandStatus || '').toUpperCase();
    return s === 'FECHADO' || s === 'REJEITADO';
  }).length;

  const getStatusPill = (status: string) => {
    const s = String(status).toUpperCase();
    if (s === 'ABERTO') return { text: 'Aguardando Resposta', style: styles.pillAberto };
    if (s === 'AGUARDANDO') return { text: 'Em Andamento', style: styles.pillAguardando };
    if (s === 'FECHADO') return { text: 'Concluída', style: styles.pillFechado };
    if (s === 'REJEITADO') return { text: 'Recusada', style: styles.pillRejeitado };
    return { text: s, style: {} };
  };

  const DemandInfoBadges = ({ demanda }: { demanda: any }) => (
    <View style={styles.badgesRow}>
      {demanda.categoryId?.name && (
        <View style={styles.badge}>
          <Ionicons name="pricetag-outline" size={12} color="#0066ff" />
          <Text style={styles.badgeText}>{demanda.categoryId.name}</Text>
        </View>
      )}
      {demanda.suggestedValue != null && (
        <View style={styles.badge}>
          <Ionicons name="cash-outline" size={12} color="#0066ff" />
          <Text style={styles.badgeText}>
            {Number(demanda.suggestedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        </View>
      )}
      {demanda.suggestedDate && (
        <View style={styles.badge}>
          <Ionicons name="calendar-outline" size={12} color="#0066ff" />
          <Text style={styles.badgeText}>{demanda.suggestedDate}</Text>
        </View>
      )}
    </View>
  );

  const renderStars = (nota: number, size = 14) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons
          key={star}
          name={star <= nota ? 'star' : 'star-outline'}
          size={size}
          color={star <= nota ? '#f59f00' : '#ced4da'}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066ff']} tintColor="#0066ff" />
        }
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.welcome}>
              Olá, <Text style={styles.name}>{userName || 'Cliente'}</Text>
            </Text>
            <Text style={styles.sub}>Acompanhe o status e a execução dos seus serviços em tempo real.</Text>
          </View>
          <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('EditarPerfil')}>
            <Ionicons name="person-circle-outline" size={18} color="#0066ff" />
            <Text style={styles.btnEditText}>Editar Meu Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Botão Novo Serviço */}
        <TouchableOpacity style={styles.btnNewService} onPress={() => navigation.navigate('ListaProf')}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.btnNewServiceText}>Solicitar Novo Serviço</Text>
        </TouchableOpacity>

        {/* Status Cards - Compactos */}
        <View style={styles.statusCards}>
          <TouchableOpacity
            style={[styles.statusCard, abaAtiva === 'PENDENTE' && styles.statusCardActive]}
            onPress={() => setAbaAtiva('PENDENTE')}
          >
            <View style={styles.statusCardContent}>
              <Ionicons name="time-outline" size={18} color="#f59f00" />
              <Text style={styles.statusNumber}>{pendentes}</Text>
              <Text style={styles.statusLabel}>Aguardando</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusCard, abaAtiva === 'ANDAMENTO' && styles.statusCardActive]}
            onPress={() => setAbaAtiva('ANDAMENTO')}
          >
            <View style={styles.statusCardContent}>
              <Ionicons name="play-circle-outline" size={18} color="#0066ff" />
              <Text style={styles.statusNumber}>{emAndamento}</Text>
              <Text style={styles.statusLabel}>Em Andamento</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusCard, abaAtiva === 'FINALIZADO' && styles.statusCardActive]}
            onPress={() => setAbaAtiva('FINALIZADO')}
          >
            <View style={styles.statusCardContent}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#37b24d" />
              <Text style={styles.statusNumber}>{finalizados}</Text>
              <Text style={styles.statusLabel}>Finalizados</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Abas */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'PENDENTE' && styles.tabActive]}
            onPress={() => setAbaAtiva('PENDENTE')}
          >
            <Text style={abaAtiva === 'PENDENTE' ? styles.tabTextActive : styles.tabText}>
              Pendentes ({pendentes})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'ANDAMENTO' && styles.tabActive]}
            onPress={() => setAbaAtiva('ANDAMENTO')}
          >
            <Text style={abaAtiva === 'ANDAMENTO' ? styles.tabTextActive : styles.tabText}>
              Em Andamento ({emAndamento})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'FINALIZADO' && styles.tabActive]}
            onPress={() => setAbaAtiva('FINALIZADO')}
          >
            <Text style={abaAtiva === 'FINALIZADO' ? styles.tabTextActive : styles.tabText}>
              Finalizados ({finalizados})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Busca e Refresh */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={16} color="#a0aec0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filtrar por título..."
              placeholderTextColor="#a0aec0"
              value={buscaTexto}
              onChangeText={setBuscaTexto}
            />
          </View>
          <TouchableOpacity
            style={styles.btnRefresh}
            onPress={() => { buscarMeusPedidos(); buscarAvaliacoes(); }}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={loading ? '#a0aec0' : '#0066ff'} />
          </TouchableOpacity>
        </View>

        {/* Lista de pedidos */}
        {loading ? (
          <ActivityIndicator size="large" color="#0066ff" style={{ marginTop: 30 }} />
        ) : pedidosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={50} color="#cbd5e0" />
            <Text style={styles.emptyTitle}>Nenhum chamado encontrado</Text>
            <Text style={styles.emptySub}>Não há registros correspondentes para exibir nesta aba no momento.</Text>
          </View>
        ) : (
          pedidosFiltrados.map((item: any) => {
            const statusInfo = getStatusPill(item.demandStatus);
            const notaAvaliacao = avaliacoes[item.id];
            return (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.orderRow}
                onPress={() => setPedidoDetalhado(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.orderTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.pillBase, statusInfo.style]}>
                    <Text style={styles.pillText}>{statusInfo.text}</Text>
                  </View>
                </View>
                {item.professionalId?.name && (
                  <Text style={styles.orderMeta}>
                    <Ionicons name="person-outline" size={12} color="#666" /> {item.professionalId.name}
                    {item.professionalId.phone && `  •  ${item.professionalId.phone}`}
                  </Text>
                )}
                <Text style={styles.orderDesc} numberOfLines={2}>{item.description}</Text>
                <DemandInfoBadges demanda={item} />
                <View style={styles.rowFooter}>
                  <Text style={styles.viewMore}>Ver mais detalhes</Text>
                  {String(item.demandStatus).toUpperCase() === 'FECHADO' && (
                    notaAvaliacao != null ? (
                      <View style={styles.avaliadoContainer}>
                        {renderStars(notaAvaliacao, 12)}
                        <Text style={styles.avaliadoText}>Avaliado</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.btnAvaliar}
                        onPress={() => setPedidoParaAvaliar(item)}
                      >
                        <Ionicons name="star" size={14} color="#f59f00" />
                        <Text style={styles.btnAvaliarText}>Avaliar Serviço</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal Detalhes */}
      <Modal visible={!!pedidoDetalhado} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPedidoDetalhado(null)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Solicitação</Text>
              <TouchableOpacity onPress={() => setPedidoDetalhado(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.detailLabel}>Título</Text>
              <Text style={styles.detailValue}>{pedidoDetalhado?.title}</Text>
              <DemandInfoBadges demanda={pedidoDetalhado} />

              {pedidoDetalhado?.categoryId?.name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoria</Text>
                  <Text style={styles.detailText}>{pedidoDetalhado.categoryId.name}</Text>
                </View>
              )}
              {pedidoDetalhado?.suggestedValue != null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valor Sugerido</Text>
                  <Text style={styles.detailText}>
                    {Number(pedidoDetalhado.suggestedValue).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Text>
                </View>
              )}
              {pedidoDetalhado?.suggestedDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data Sugerida</Text>
                  <Text style={styles.detailText}>{pedidoDetalhado.suggestedDate}</Text>
                </View>
              )}

              <Text style={styles.detailLabel}>Status</Text>
              <View style={[styles.pillBase, getStatusPill(pedidoDetalhado?.demandStatus).style]}>
                <Text style={styles.pillText}>{getStatusPill(pedidoDetalhado?.demandStatus).text}</Text>
              </View>

              {pedidoDetalhado?.professionalId?.name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Profissional Designado</Text>
                  <Text style={styles.detailText}>
                    {pedidoDetalhado.professionalId.name}
                    {pedidoDetalhado.professionalId.phone && ` • ${pedidoDetalhado.professionalId.phone}`}
                  </Text>
                  {pedidoDetalhado.professionalId.email && (
                    <Text style={styles.detailSubText}>{pedidoDetalhado.professionalId.email}</Text>
                  )}
                </View>
              )}

              {pedidoDetalhado?.addressId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Local do Serviço</Text>
                  <Text style={styles.detailText}>
                    {pedidoDetalhado.addressId.street || 'Rua não informada'}, {pedidoDetalhado.addressId.number || 'S/N'}
                    {pedidoDetalhado.addressId.neighborhood ? ` - ${pedidoDetalhado.addressId.neighborhood}` : ''}
                    {pedidoDetalhado.addressId.city ? ` - ${pedidoDetalhado.addressId.city}` : ''}
                  </Text>
                </View>
              )}

              <Text style={styles.detailLabel}>Descrição</Text>
              <Text style={styles.detailDesc}>{pedidoDetalhado?.description}</Text>

              {String(pedidoDetalhado?.demandStatus).toUpperCase() === 'AGUARDANDO' && (
                <DetalhesSolicitacao demanda={pedidoDetalhado} modo="CLIENTE" />
              )}

              {String(pedidoDetalhado?.demandStatus).toUpperCase() === 'ABERTO' && (
                <TouchableOpacity
                  style={styles.btnModalPrimary}
                  onPress={() => {
                    setPedidoDetalhado(null);
                    navigation.navigate('EditarDemanda', { id: pedidoDetalhado.id });
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.btnModalText}>Editar Esta Solicitação</Text>
                </TouchableOpacity>
              )}
              {String(pedidoDetalhado?.demandStatus).toUpperCase() === 'REJEITADO' && (
                <TouchableOpacity
                  style={styles.btnModalSuccess}
                  onPress={() => {
                    setPedidoDetalhado(null);
                    navigation.navigate('ListaProf', { reassignDemandId: pedidoDetalhado.id });
                  }}
                >
                  <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                  <Text style={styles.btnModalText}>Solicitar a Outro Profissional</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Avaliação */}
      <Modal visible={!!pedidoParaAvaliar} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPedidoParaAvaliar(null)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliar Prestador de Serviço</Text>
              <TouchableOpacity onPress={() => setPedidoParaAvaliar(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.introText}>
                Conte-nos como foi a sua experiência com o profissional{' '}
                <Text style={{ fontWeight: '600' }}>{pedidoParaAvaliar?.professionalId?.name || 'parceiro'}</Text>{' '}
                no serviço <Text style={{ fontStyle: 'italic' }}>"{pedidoParaAvaliar?.title}"</Text>.
              </Text>
              <Text style={styles.detailLabel}>SUA NOTA</Text>
              <View style={styles.starsRowLarge}>
                {[1, 2, 3, 4, 5].map(num => (
                  <TouchableOpacity key={num} onPress={() => setEstrelas(num)}>
                    <Ionicons
                      name={num <= estrelas ? 'star' : 'star-outline'}
                      size={32}
                      color={num <= estrelas ? '#f59f00' : '#ced4da'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingQualifier}>
                {estrelas === 5 ? 'Excelente!' : estrelas === 4 ? 'Muito Bom' : estrelas === 3 ? 'Regular' : estrelas === 2 ? 'Ruim' : 'Muito Ruim'}
              </Text>
              <Text style={styles.detailLabel}>COMENTÁRIO / CRÍTICA</Text>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Deixe o seu feedback detalhado aqui..."
                value={comentario}
                onChangeText={setComentario}
                textAlignVertical="top"
              />
              <TouchableOpacity style={styles.checkboxRow} onPress={() => setAnonimo(!anonimo)}>
                <View style={[styles.checkbox, anonimo && styles.checkboxChecked]}>
                  {anonimo && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Enviar esta avaliação de forma anônima</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSubmitRating, enviandoAvaliacao && styles.btnDisabled]}
                onPress={enviarAvaliacaoSistema}
                disabled={enviandoAvaliacao}
              >
                {enviandoAvaliacao ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnSubmitText}>Submeter Avaliação</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 30 },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 15,
    flexWrap: 'wrap',
  },
  bannerTextContainer: { flex: 1 },
  welcome: { fontSize: 18, color: '#1a202c' },
  name: { fontWeight: '800', color: '#0066ff' },
  sub: { fontSize: 13, color: '#718096', marginTop: 4 },
  btnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
  },
  btnEditText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  btnNewService: {
    flexDirection: 'row',
    backgroundColor: '#0066ff',
    marginHorizontal: 15,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    elevation: 3,
  },
  btnNewServiceText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  statusCards: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statusCardActive: {
    borderColor: '#0066ff',
    backgroundColor: '#fafdff',
  },
  statusCardContent: {
    alignItems: 'center',
    gap: 2,
  },
  statusNumber: { fontSize: 18, fontWeight: '800', color: '#1a202c' },
  statusLabel: { fontSize: 11, fontWeight: '600', color: '#2d3748', marginTop: 0 },
  tabs: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#edf2f7',
    paddingBottom: 8,
    marginBottom: 15,
  },
  tab: { paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0066ff', marginBottom: -10 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#718096' },
  tabTextActive: { color: '#0066ff', fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 50,
    paddingHorizontal: 12,
    height: 38,
    backgroundColor: '#fff',
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#334155' },
  btnRefresh: {
    width: 38,
    height: 38,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderRow: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  orderTitle: { fontSize: 15, fontWeight: '700', color: '#1a202c', flex: 1 },
  pillBase: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  pillAberto: { backgroundColor: '#e6f0ff' },
  pillAguardando: { backgroundColor: '#fff9db' },
  pillFechado: { backgroundColor: '#ebfbee' },
  pillRejeitado: { backgroundColor: '#fff5f5' },
  pillText: { fontSize: 11, fontWeight: '600', color: '#333' },
  orderMeta: { fontSize: 12, color: '#4a5568', marginBottom: 4 },
  orderDesc: { fontSize: 13, color: '#4a5568', lineHeight: 18, marginBottom: 6 },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, color: '#334155' },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  viewMore: { fontSize: 12, color: '#0066ff', fontWeight: '600' },
  avaliadoContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starsRow: { flexDirection: 'row', gap: 2 },
  avaliadoText: { fontSize: 12, fontWeight: '700', color: '#2b8a3e' },
  btnAvaliar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9db',
    borderWidth: 1,
    borderColor: '#ffe3e3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    gap: 4,
  },
  btnAvaliarText: { fontSize: 12, color: '#f59f00', fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: 15,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2d3748', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#718096', marginTop: 6, textAlign: 'center' },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,32,44,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  modalBody: { padding: 20 },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 12,
  },
  detailValue: { fontSize: 14, color: '#2d3748' },
  detailRow: { marginBottom: 12 },
  detailText: { fontSize: 14, color: '#2d3748', fontWeight: '500' },
  detailSubText: { fontSize: 13, color: '#718096', marginTop: 2 },
  detailDesc: {
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 10,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnModalPrimary: {
    backgroundColor: '#0066ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  btnModalSuccess: {
    backgroundColor: '#2b8a3e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  btnModalText: { color: '#fff', fontWeight: '600' },

  // Avaliação
  introText: { fontSize: 14, color: '#4a5568', marginBottom: 15, lineHeight: 20 },
  starsRowLarge: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 10 },
  ratingQualifier: { textAlign: 'center', fontWeight: '700', color: '#2d3748', marginBottom: 15 },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#007bff' },
  checkboxLabel: { fontSize: 13, color: '#4a5568' },
  btnSubmitRating: {
    backgroundColor: '#f59f00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  btnDisabled: { opacity: 0.7 },
  btnSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
