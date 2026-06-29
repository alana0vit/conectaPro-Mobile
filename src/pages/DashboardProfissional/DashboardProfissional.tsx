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

export default function DashboardProfissional() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('NOVO');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [pedidoDetalhado, setPedidoDetalhado] = useState<any>(null);
  const [dadosPerfil, setDadosPerfil] = useState<any>(null);
  const [userName, setUserName] = useState('Profissional');

  const [confirmacao, setConfirmacao] = useState({
    visivel: false,
    pedidoId: null as number | null,
    novoStatus: null as string | null,
    tituloAcao: '',
  });

  const userIdRef = useRef<number | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const buscarPedidos = async (silencioso = false) => {
    if (!userIdRef.current) return null;
    try {
      if (!silencioso) setLoading(true);
      const response = await api.get('/api/demand/user');
      const meusPedidos = (response.data || [])
        .filter((d: any) => {
          const idProf = d.professionalId?.id || d.professionalId;
          return Number(idProf) === Number(userIdRef.current);
        })
        .sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      setPedidos(meusPedidos);

      const resPerfil = await api.get(`/api/user/${userIdRef.current}`);
      setDadosPerfil(resPerfil.data);
      setUserName(resPerfil.data.name);

      return meusPedidos;
    } catch (err) {
      console.error('Erro ao carregar demandas:', err);
      if (!silencioso) Toast.show({ type: 'error', text1: 'Erro ao carregar as solicitações.' });
      return null;
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await buscarPedidos(true);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const userId = await getUserId();
        userIdRef.current = Number(userId);
        await buscarPedidos();
      })();
      return () => { };
    }, [])
  );

  useEffect(() => {
    if (!userIdRef.current) return;
    refreshIntervalRef.current = setInterval(() => buscarPedidos(true), INTERVALO_REFRESH);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  const processarAtualizacaoStatus = async (pedidoId: number, novoStatus: string) => {
    try {
      await api.patch(`/api/demand/${pedidoId}/status`, { status: novoStatus });
      if (novoStatus === 'AGUARDANDO') Toast.show({ type: 'success', text1: 'Serviço aceito! Dados de contato liberados.' });
      else if (novoStatus === 'FECHADO') Toast.show({ type: 'info', text1: 'Serviço finalizado.' });
      else if (novoStatus === 'REJEITADO') Toast.show({ type: 'error', text1: 'Serviço recusado.' });

      const listaAtualizada = await buscarPedidos();
      if (pedidoDetalhado && listaAtualizada) {
        const atualizado = listaAtualizada.find((p: any) => p.id === pedidoId);
        setPedidoDetalhado(atualizado || null);
      }
    } catch (error: any) {
      const msgErro = error.response?.data?.message || 'Falha ao atualizar o status do pedido.';
      Toast.show({ type: 'error', text1: msgErro });
    }
  };

  const solicitarConfirmacao = (pedidoId: number, novoStatus: string, acaoTexto: string) => {
    setConfirmacao({ visivel: true, pedidoId, novoStatus, tituloAcao: acaoTexto });
  };

  const executarAcaoConfirmada = () => {
    if (confirmacao.pedidoId && confirmacao.novoStatus) {
      processarAtualizacaoStatus(confirmacao.pedidoId, confirmacao.novoStatus);
    }
    setConfirmacao({ visivel: false, pedidoId: null, novoStatus: null, tituloAcao: '' });
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const s = String(p.demandStatus || '').toUpperCase();
    const matchesTexto = p.title?.toLowerCase().includes(buscaTexto.toLowerCase());
    if (!matchesTexto) return false;
    if (abaAtiva === 'NOVO') return s === 'ABERTO';
    if (abaAtiva === 'ANDAMENTO') return s === 'AGUARDANDO';
    if (abaAtiva === 'FINALIZADO') return s === 'FECHADO' || s === 'REJEITADO';
    return true;
  });

  const contagem = (statusAlvo: string) =>
    pedidos.filter(p => {
      const s = String(p.demandStatus || '').toUpperCase();
      if (statusAlvo === 'ABERTO') return s === 'ABERTO';
      if (statusAlvo === 'AGUARDANDO') return s === 'AGUARDANDO';
      if (statusAlvo === 'FINALIZADO') return s === 'FECHADO' || s === 'REJEITADO';
      return false;
    }).length;

  const getStatusPill = (status: string) => {
    const s = String(status).toUpperCase();
    if (s === 'ABERTO') return { text: 'Novo', style: styles.pillNovo };
    if (s === 'AGUARDANDO') return { text: 'Em Andamento', style: styles.pillAndamento };
    if (s === 'FECHADO') return { text: 'Finalizado', style: styles.pillFinalizado };
    if (s === 'REJEITADO') return { text: 'Rejeitado', style: styles.pillRejeitado };
    return { text: s, style: {} };
  };

  const DemandInfoBadges = ({ demanda }: { demanda: any }) => (
    <View style={styles.badgesRow}>
      {demanda.categoryId?.name && (
        <View style={styles.badge}>
          <Ionicons name="pricetag-outline" size={12} color="#3b82f6" />
          <Text style={styles.badgeText}>{demanda.categoryId.name}</Text>
        </View>
      )}
      {demanda.suggestedValue != null && (
        <View style={styles.badge}>
          <Ionicons name="cash-outline" size={12} color="#3b82f6" />
          <Text style={styles.badgeText}>
            {Number(demanda.suggestedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        </View>
      )}
      {demanda.suggestedDate && (
        <View style={styles.badge}>
          <Ionicons name="calendar-outline" size={12} color="#3b82f6" />
          <Text style={styles.badgeText}>{demanda.suggestedDate}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} tintColor="#3b82f6" />
        }
      >
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.welcome}>Painel de Controle</Text>
            <Text style={styles.sub}>
              Olá, <Text style={styles.name}>{userName || 'Profissional'}</Text>. Veja como está sua agenda.
            </Text>
            {dadosPerfil && (
              <View style={styles.reputacaoContainer}>
                <Ionicons
                  name="star"
                  size={16}
                  color={dadosPerfil.rating ? '#ffc107' : '#ccc'}
                />
                <Text style={styles.reputacaoText}>
                  Sua Reputação: {dadosPerfil.rating != null ? Number(dadosPerfil.rating).toFixed(1) : 'Sem avaliação'}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.btnAjustes} onPress={() => navigation.navigate('EditarPerfil')}>
            <Ionicons name="settings-outline" size={18} color="#3b82f6" />
            <Text style={styles.btnAjustesText}>Ajustes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, abaAtiva === 'NOVO' && styles.statCardActive]}
            onPress={() => setAbaAtiva('NOVO')}
          >
            <Text style={styles.statNumber}>{contagem('ABERTO')}</Text>
            <Text style={styles.statLabel}>Novas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, abaAtiva === 'ANDAMENTO' && styles.statCardActive]}
            onPress={() => setAbaAtiva('ANDAMENTO')}
          >
            <Text style={styles.statNumber}>{contagem('AGUARDANDO')}</Text>
            <Text style={styles.statLabel}>Em Andamento</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, abaAtiva === 'FINALIZADO' && styles.statCardActive]}
            onPress={() => setAbaAtiva('FINALIZADO')}
          >
            <Text style={styles.statNumber}>{contagem('FINALIZADO')}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'NOVO' && styles.tabActive]}
            onPress={() => setAbaAtiva('NOVO')}
          >
            <Text style={abaAtiva === 'NOVO' ? styles.tabTextActive : styles.tabText}>
              Novas ({contagem('ABERTO')})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'ANDAMENTO' && styles.tabActive]}
            onPress={() => setAbaAtiva('ANDAMENTO')}
          >
            <Text style={abaAtiva === 'ANDAMENTO' ? styles.tabTextActive : styles.tabText}>
              Em Andamento ({contagem('AGUARDANDO')})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, abaAtiva === 'FINALIZADO' && styles.tabActive]}
            onPress={() => setAbaAtiva('FINALIZADO')}
          >
            <Text style={abaAtiva === 'FINALIZADO' ? styles.tabTextActive : styles.tabText}>
              Finalizadas ({contagem('FINALIZADO')})
            </Text>
          </TouchableOpacity>
        </View>

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
            onPress={() => buscarPedidos()}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={loading ? '#a0aec0' : '#3b82f6'} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 30 }} />
        ) : pedidosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={50} color="#cbd5e0" />
            <Text style={styles.emptyTitle}>Nenhuma demanda encontrada</Text>
            <Text style={styles.emptySub}>Não há registros correspondentes para exibir nesta aba no momento.</Text>
          </View>
        ) : (
          pedidosFiltrados.map((item: any) => {
            const statusInfo = getStatusPill(item.demandStatus);
            return (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.requestCard}
                activeOpacity={0.7}
                onPress={() => setPedidoDetalhado(item)}
              >
                <View style={styles.cardBody}>
                  <View style={[styles.pillBase, statusInfo.style]}>
                    <Text style={styles.pillText}>{statusInfo.text}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.clientName}>
                    <Ionicons name="person-outline" size={13} color="#3b82f6" /> {item.clientId?.name || 'Cliente'}
                  </Text>
                  <DemandInfoBadges demanda={item} />
                </View>

                {(String(item.demandStatus).toUpperCase() === 'ABERTO' ||
                  String(item.demandStatus).toUpperCase() === 'AGUARDANDO') && (
                    <View style={styles.cardFooter}>
                      {String(item.demandStatus).toUpperCase() === 'ABERTO' && (
                        <>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnAccept]}
                            onPress={() => solicitarConfirmacao(item.id, 'AGUARDANDO', 'aceitar esta solicitação de serviço')}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.btnActionText}>Aceitar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnDecline]}
                            onPress={() => solicitarConfirmacao(item.id, 'REJEITADO', 'recusar esta solicitação de serviço')}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                            <Text style={styles.btnActionText}>Recusar</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {String(item.demandStatus).toUpperCase() === 'AGUARDANDO' && (
                        <TouchableOpacity
                          style={[styles.btnAction, styles.btnInfo]}
                          onPress={() => setPedidoDetalhado(item)}
                        >
                          <Ionicons name="eye-outline" size={16} color="#475569" />
                          <Text style={styles.btnInfoText}>Ver detalhes</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!pedidoDetalhado} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPedidoDetalhado(null)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Descrição Completa da Demanda</Text>
              <TouchableOpacity onPress={() => setPedidoDetalhado(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.detailLabel}>SERVIÇO SOLICITADO</Text>
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

              {pedidoDetalhado?.clientId?.name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente</Text>
                  <Text style={styles.detailText}>
                    {pedidoDetalhado.clientId.name}
                    {pedidoDetalhado.clientId.phone && ` • ${pedidoDetalhado.clientId.phone}`}
                  </Text>
                  {pedidoDetalhado.clientId.email && (
                    <Text style={styles.detailSubText}>{pedidoDetalhado.clientId.email}</Text>
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

              <Text style={styles.detailLabel}>DESCRIÇÃO COMPLETA DO PROBLEMA</Text>
              <Text style={styles.detailDesc}>{pedidoDetalhado?.description}</Text>

              {String(pedidoDetalhado?.demandStatus).toUpperCase() === 'AGUARDANDO' && (
                <DetalhesSolicitacao demanda={pedidoDetalhado} modo="PROFISSIONAL" />
              )}

              <View style={styles.modalActions}>
                {String(pedidoDetalhado?.demandStatus).toUpperCase() === 'ABERTO' && (
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnAccept, styles.btnFullWidth]}
                      onPress={() => {
                        setPedidoDetalhado(null);
                        solicitarConfirmacao(pedidoDetalhado.id, 'AGUARDANDO', 'aceitar esta solicitação de serviço');
                      }}
                    >
                      <Text style={styles.btnActionText}>Aceitar Serviço</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnDecline, styles.btnFullWidth]}
                      onPress={() => {
                        setPedidoDetalhado(null);
                        solicitarConfirmacao(pedidoDetalhado.id, 'REJEITADO', 'recusar esta solicitação de serviço');
                      }}
                    >
                      <Text style={styles.btnActionText}>Recusar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {String(pedidoDetalhado?.demandStatus).toUpperCase() === 'AGUARDANDO' && (
                  <TouchableOpacity
                    style={[styles.btnAction, styles.btnFinish, { marginTop: 12 }]}
                    onPress={() => {
                      setPedidoDetalhado(null);
                      solicitarConfirmacao(pedidoDetalhado.id, 'FECHADO', 'finalizar este serviço de vez');
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.btnActionText}>Finalizar Serviço</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={confirmacao.visivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Ionicons name="warning" size={40} color="#ffc107" style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>Confirmar Ação</Text>
            <Text style={styles.confirmText}>
              Você tem certeza de que deseja <Text style={{ fontWeight: '700' }}>{confirmacao.tituloAcao}</Text>? Essa operação alterará o andamento do chamado.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setConfirmacao({ visivel: false, pedidoId: null, novoStatus: null, tituloAcao: '' })}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={executarAcaoConfirmada}>
                <Text style={styles.btnConfirmText}>Sim, Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  welcome: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  name: { fontWeight: '700' },
  reputacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  reputacaoText: { fontSize: 13, color: '#333', fontWeight: '600' },
  btnAjustes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#fff',
  },
  btnAjustesText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statCardActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#fafdff',
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 },
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
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6', marginBottom: -10 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#718096' },
  tabTextActive: { color: '#3b82f6', fontWeight: '700' },
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
  requestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardBody: { padding: 16 },
  pillBase: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 50,
    marginBottom: 8,
  },
  pillNovo: { backgroundColor: '#eff6ff' },
  pillAndamento: { backgroundColor: '#fffbeb' },
  pillFinalizado: { backgroundColor: '#f0fdf4' },
  pillRejeitado: { backgroundColor: '#fef2f2' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#333' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  clientName: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
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
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  btnAccept: { backgroundColor: '#10b981' },
  btnDecline: { backgroundColor: '#ef4444' },
  btnFinish: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 8 },
  btnInfo: { backgroundColor: '#f8fafc', flex: 1 },
  btnActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnInfoText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: 15,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2d3748', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#718096', marginTop: 6, textAlign: 'center' },

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
  detailValue: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
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
  modalActions: { marginTop: 20 },
  modalActionsRow: { flexDirection: 'row', gap: 10 },
  btnFullWidth: { flex: 1, borderRadius: 8 },

  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c', marginBottom: 10 },
  confirmText: { fontSize: 14, color: '#4a5568', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  btnCancelText: { fontWeight: '600', color: '#475569' },
  btnConfirm: {
    flex: 1,
    backgroundColor: '#0066ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnConfirmText: { fontWeight: '700', color: '#fff' },
});
