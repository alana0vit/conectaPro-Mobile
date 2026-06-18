import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { getUserId, getUserType } from '../../services/auth';
import Header from '../../components/Header';

export default function DashboardCliente() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('ATIVAS');
  const [cardSelecionado, setCardSelecionado] = useState('ANDAMENTO');
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState<string | null>(null);

  const [pedidoDetalhado, setPedidoDetalhado] = useState<any>(null);

  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState<any>(null);
  const [estrelas, setEstrelas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [anonimo, setAnonimo] = useState(false);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  const [avaliacoes, setAvaliacoes] = useState<Record<number, number>>({});

  const buscarPedidos = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const res = await api.get('/api/demand/user');
      const minhas = res.data
        .filter((d: any) => {
          const idCli = d.clientId?.id || d.clientId;
          return Number(idCli) === Number(userId);
        })
        .sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      setPedidos(minhas);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar solicitações' });
    } finally {
      setLoading(false);
    }
  };

  const buscarAvaliacoes = async () => {
    try {
      const userId = await getUserId();
      const res = await api.get(`/api/rating/user/${userId}/evaluator`);
      const ratings = Array.isArray(res.data) ? res.data : [];
      const mapa: Record<number, number> = {};
      ratings.forEach((r: any) => {
        if (r.service && r.service.id && r.points != null) {
          mapa[r.service.id] = r.points;
        }
      });
      setAvaliacoes(mapa);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarPedidos();
      buscarAvaliacoes();
      (async () => {
        try {
          const userId = await getUserId();
          const tipo = await getUserType();
          setUserType(tipo);
          const res = await api.get(`/api/user/${userId}`);
          setUserName(res.data.name);
        } catch (e) { }
      })();
    }, [])
  );

  const pedidosFiltrados = pedidos.filter(p => {
    const status = String(p.demandStatus || '').toUpperCase();
    const matchesTexto = p.title?.toLowerCase().includes(search.toLowerCase());
    if (!matchesTexto) return false;
    if (abaAtiva === 'ATIVAS') {
      return status === 'ABERTO' || status === 'AGUARDANDO';
    }
    if (abaAtiva === 'HISTORICO') {
      return status === 'FECHADO' || status === 'REJEITADO';
    }
    return true;
  });

  const emAndamento = pedidos.filter(p => String(p.demandStatus).toUpperCase() === 'AGUARDANDO').length;
  const aguardando = pedidos.filter(p => String(p.demandStatus).toUpperCase() === 'ABERTO').length;
  const concluidos = pedidos.filter(p => String(p.demandStatus).toUpperCase() === 'FECHADO').length;

  const traduzirStatus = (status: string) => {
    const s = String(status).toUpperCase();
    if (s === 'ABERTO') return 'Aguardando Resposta';
    if (s === 'AGUARDANDO') return 'Em Andamento';
    if (s === 'FECHADO') return 'Concluída';
    if (s === 'REJEITADO') return 'Recusada';
    return s;
  };

  const enviarAvaliacao = async () => {
    if (!pedidoParaAvaliar) return;
    const professionalId = pedidoParaAvaliar.professionalId?.id || pedidoParaAvaliar.professionalId;
    if (!professionalId) {
      Toast.show({ type: 'error', text1: 'Profissional não identificado' });
      return;
    }
    setEnviandoAvaliacao(true);
    try {
      const userId = await getUserId();
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

  const renderStars = (nota: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <FontAwesome5
            key={star}
            name="star"
            size={12}
            solid={star <= nota}
            color={star <= nota ? '#f59f00' : '#ced4da'}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Header user={userName ? { nome: userName, tipo: userType || undefined } : null} />

      <View style={styles.banner}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.welcome}>Olá, <Text style={styles.name}>{userName || 'Cliente'}</Text></Text>
          <Text style={styles.sub}>Acompanhe cada etapa com segurança e transparência.</Text>
        </View>
        <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('EditarPerfil')}>
          <FontAwesome5 name="user-edit" size={14} color="#0066ff" />
          <Text style={styles.btnEditText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnNewSolic} onPress={() => navigation.navigate('ListaProf')}>
        <FontAwesome5 name="plus-circle" size={18} color="#fff" />
        <Text style={styles.btnNewSolicText}>Solicitar Novo Serviço</Text>
      </TouchableOpacity>

      <View style={styles.statusCards}>
        <TouchableOpacity
          style={[styles.statusCard, abaAtiva === 'ATIVAS' && cardSelecionado === 'ANDAMENTO' && styles.statusCardActive]}
          onPress={() => { setAbaAtiva('ATIVAS'); setCardSelecionado('ANDAMENTO'); }}
        >
          <Text style={styles.statusNumber}>{emAndamento}</Text>
          <Text style={styles.statusLabel}>Em Andamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusCard, abaAtiva === 'ATIVAS' && cardSelecionado === 'AGUARDANDO' && styles.statusCardActive]}
          onPress={() => { setAbaAtiva('ATIVAS'); setCardSelecionado('AGUARDANDO'); }}
        >
          <Text style={styles.statusNumber}>{aguardando}</Text>
          <Text style={styles.statusLabel}>Aguardando</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusCard, abaAtiva === 'HISTORICO' && styles.statusCardActive]}
          onPress={() => { setAbaAtiva('HISTORICO'); setCardSelecionado('FINALIZADOS'); }}
        >
          <Text style={styles.statusNumber}>{concluidos}</Text>
          <Text style={styles.statusLabel}>Finalizados</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.board}>
        <View style={styles.boardHeader}>
          <Text style={styles.boardTitle}>Listagem de Pedidos</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Filtrar por título..."
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity onPress={() => { buscarPedidos(); buscarAvaliacoes(); }}>
              <FontAwesome5 name="sync-alt" size={16} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'ATIVAS' && styles.tabActive]}
            onPress={() => setAbaAtiva('ATIVAS')}
          >
            <Text style={abaAtiva === 'ATIVAS' ? styles.tabTextActive : styles.tabText}>Chamados Ativos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'HISTORICO' && styles.tabActive]}
            onPress={() => setAbaAtiva('HISTORICO')}
          >
            <Text style={abaAtiva === 'HISTORICO' ? styles.tabTextActive : styles.tabText}>Histórico</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={pedidosFiltrados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const status = String(item.demandStatus).toUpperCase();
              const notaAvaliacao = avaliacoes[item.id]; // undefined ou número

              return (
                <TouchableOpacity
                  style={styles.orderRow}
                  onPress={() => setPedidoDetalhado(item)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.orderTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={[
                        styles.pill,
                        status === 'ABERTO' && styles.pillAberto,
                        status === 'AGUARDANDO' && styles.pillAguardando,
                        status === 'FECHADO' && styles.pillFechado,
                        status === 'REJEITADO' && styles.pillRejeitado,
                      ]}>
                        <Text style={styles.pillText}>{traduzirStatus(item.demandStatus)}</Text>
                      </View>
                    </View>
                    {item.professionalId?.name && (
                      <Text style={styles.orderMeta}>
                        <FontAwesome5 name="user" size={12} color="#666" /> {item.professionalId.name}
                      </Text>
                    )}
                    <Text style={styles.orderDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.rowFooter}>
                      <Text style={styles.viewMore}>Ver mais detalhes</Text>
                      {(status === 'FECHADO') && (
                        notaAvaliacao != null ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            {renderStars(notaAvaliacao)}
                            <Text style={styles.badgeAvaliado}>Avaliado</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.btnAvaliar}
                            onPress={() => setPedidoParaAvaliar(item)}
                          >
                            <FontAwesome5 name="star" size={12} color="#f59f00" />
                            <Text style={styles.btnAvaliarText}>Avaliar</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {pedidoDetalhado && (
        <Modal visible transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPedidoDetalhado(null)}>
            <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalhes da Solicitação</Text>
                <TouchableOpacity onPress={() => setPedidoDetalhado(null)}>
                  <FontAwesome5 name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.detailLabel}>Título</Text>
                <Text style={styles.detailValue}>{pedidoDetalhado.title}</Text>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{traduzirStatus(pedidoDetalhado.demandStatus)}</Text>
                {pedidoDetalhado.professionalId?.name && (
                  <>
                    <Text style={styles.detailLabel}>Profissional</Text>
                    <Text style={styles.detailValue}>
                      {pedidoDetalhado.professionalId.name} - {pedidoDetalhado.professionalId.phone || 'Sem telefone'}
                    </Text>
                  </>
                )}
                <Text style={styles.detailLabel}>Descrição</Text>
                <Text style={styles.detailDesc}>{pedidoDetalhado.description}</Text>
                {String(pedidoDetalhado.demandStatus).toUpperCase() === 'ABERTO' && (
                  <TouchableOpacity
                    style={styles.btnModalPrimary}
                    onPress={() => {
                      setPedidoDetalhado(null);
                      navigation.navigate('EditarDemanda', { id: pedidoDetalhado.id });
                    }}
                  >
                    <Text style={styles.btnModalText}>Editar Esta Solicitação</Text>
                  </TouchableOpacity>
                )}
                {String(pedidoDetalhado.demandStatus).toUpperCase() === 'REJEITADO' && (
                  <TouchableOpacity
                    style={styles.btnModalSuccess}
                    onPress={() => {
                      setPedidoDetalhado(null);
                      navigation.navigate('ListaProf', { reassignDemandId: pedidoDetalhado.id });
                    }}
                  >
                    <Text style={styles.btnModalText}>Solicitar a Outro Profissional</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {pedidoParaAvaliar && (
        <Modal visible transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPedidoParaAvaliar(null)}>
            <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Avaliar Prestador</Text>
                <TouchableOpacity onPress={() => setPedidoParaAvaliar(null)}>
                  <FontAwesome5 name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.detailLabel}>SUA NOTA</Text>
                <View style={styles.starsRowLarge}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <TouchableOpacity key={num} onPress={() => setEstrelas(num)}>
                      <FontAwesome5
                        name="star"
                        size={30}
                        solid={num <= estrelas}
                        color={num <= estrelas ? '#f59f00' : '#ced4da'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingQualifier}>
                  {estrelas === 5 ? 'Excelente!' : estrelas === 4 ? 'Muito Bom' : estrelas === 3 ? 'Regular' : estrelas === 2 ? 'Ruim' : 'Muito Ruim'}
                </Text>
                <Text style={styles.detailLabel}>COMENTÁRIO</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Deixe seu feedback..."
                  value={comentario}
                  onChangeText={setComentario}
                />
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAnonimo(!anonimo)}
                >
                  <View style={[styles.checkbox, anonimo && styles.checkboxChecked]}>
                    {anonimo && <Text style={{ color: '#fff' }}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Enviar anonimamente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSubmit, enviandoAvaliacao && { opacity: 0.7 }]}
                  onPress={enviarAvaliacao}
                  disabled={enviandoAvaliacao}
                >
                  <Text style={styles.btnSubmitText}>
                    {enviandoAvaliacao ? 'Enviando...' : 'Submeter Avaliação'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f4f6f9' },
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
    flexWrap: 'wrap',
    gap: 10,
  },
  bannerTextContainer: { flex: 1, minWidth: 150 },
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
  btnNewSolic: {
    flexDirection: 'row',
    backgroundColor: '#0066ff',
    marginHorizontal: 15,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
    elevation: 3,
  },
  btnNewSolicText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  statusCards: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, marginBottom: 15 },
  statusCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  statusCardActive: { borderColor: '#0066ff', backgroundColor: '#fafdff' },
  statusNumber: { fontSize: 24, fontWeight: '800', color: '#1a202c' },
  statusLabel: { fontSize: 12, color: '#718096', marginTop: 4 },
  board: { flex: 1, backgroundColor: '#fff', margin: 15, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  boardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 },
  boardTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8, width: 180, fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 12, marginBottom: 15, borderBottomWidth: 2, borderBottomColor: '#edf2f7', paddingBottom: 8 },
  tab: { paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0066ff', marginBottom: -10 },
  tabText: { fontSize: 14, color: '#718096', fontWeight: '600' },
  tabTextActive: { color: '#0066ff', fontWeight: '700' },
  orderRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  orderTitle: { fontSize: 15, fontWeight: '700', color: '#1a202c', flex: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  pillAberto: { backgroundColor: '#e6f0ff' },
  pillAguardando: { backgroundColor: '#fff9db' },
  pillFechado: { backgroundColor: '#ebfbee' },
  pillRejeitado: { backgroundColor: '#fff5f5' },
  pillText: { fontSize: 11, fontWeight: '600', color: '#333' },
  orderMeta: { fontSize: 12, color: '#4a5568', marginTop: 2 },
  orderDesc: { fontSize: 13, color: '#4a5568', lineHeight: 18, marginTop: 4 },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f7fafc', paddingTop: 10 },
  viewMore: { fontSize: 12, color: '#0066ff', fontWeight: '600' },
  badgeAvaliado: { fontSize: 12, color: '#2b8a3e', fontWeight: '700', marginLeft: 4 },
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
  starsRow: { flexDirection: 'row', gap: 2 },
  starsRowLarge: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 10 },
  ratingQualifier: { textAlign: 'center', color: '#2d3748', fontWeight: '700', marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,32,44,0.4)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  modalBody: { padding: 20 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4, marginTop: 12 },
  detailValue: { fontSize: 14, color: '#2d3748' },
  detailDesc: { fontSize: 14, color: '#2d3748', backgroundColor: '#f7fafc', padding: 12, borderRadius: 10, lineHeight: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  btnModalPrimary: { backgroundColor: '#0066ff', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnModalSuccess: { backgroundColor: '#2b8a3e', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnModalText: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 12, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#007bff', borderRadius: 4, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#007bff' },
  checkboxLabel: { fontSize: 13, color: '#4a5568' },
  btnSubmit: { backgroundColor: '#f59f00', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
