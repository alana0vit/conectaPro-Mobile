import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { getUserId } from '../../services/auth';

const INTERVALO_REFRESH = 30_000;

const formatarMoeda = (valor: any) => {
  if (valor == null || valor === '') return 'Não informado';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarData = (data: any) => {
  if (!data) return 'Não informada';
  const d = new Date(data);
  if (isNaN(d.getTime())) return 'Não informada';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatarEndereco = (addressId: any) => {
  if (!addressId) return null;
  const partes = [addressId.street, addressId.number, addressId.neighborhood, addressId.city].filter(Boolean);
  return partes.length > 0 ? partes.join(', ') : null;
};

export default function DashboardProfissional() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('NOVO');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [dadosPerfil, setDadosPerfil] = useState<any>(null);
  const [userName, setUserName] = useState('Profissional');

  const userIdRef = useRef<number | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
    return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [buscaTexto]);

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

  const DemandInfoBadges = ({ demanda }: { demanda: any }) => {
    const endereco = formatarEndereco(demanda?.addressId);
    return (
      <View style={styles.infoBadgesContainer}>
        {demanda?.categoryId?.name && (
          <View style={styles.categoryTag}>
            <Ionicons name="pricetag" size={12} color="#2563eb" />
            <Text style={styles.categoryTagText}>{demanda.categoryId.name}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color="#3b82f6" />
            <Text style={styles.metaText}>{formatarMoeda(demanda?.suggestedValue)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#3b82f6" />
            <Text style={styles.metaText}>{formatarData(demanda?.suggestedDate)}</Text>
          </View>
        </View>
        {endereco && (
          <View style={styles.addressLine}>
            <Ionicons name="location-outline" size={14} color="#3b82f6" />
            <Text style={styles.addressText}>{endereco}</Text>
          </View>
        )}
      </View>
    );
  };

  const DemandFotos = ({ demanda, modo = 'galeria' }: { demanda: any; modo?: 'indicador' | 'galeria' }) => {
    const raw = demanda?.imgUrl;
    const nomes = Array.isArray(raw) ? raw.filter(Boolean) : typeof raw === 'string' && raw.trim() ? [raw] : [];
    const fotos = nomes.filter(Boolean);
    if (fotos.length === 0) return null;
    if (modo === 'indicador') {
      return (
        <View style={styles.fotoIndicatorRow}>
          <Ionicons name="images-outline" size={14} color="#3b82f6" />
          <Text style={styles.fotoIndicatorText}>{fotos.length} foto{fotos.length > 1 ? 's' : ''}</Text>
        </View>
      );
    }
    return (
      <View style={styles.fotoGaleria}>
        <Text style={styles.fotoGaleriaTitulo}><Ionicons name="images-outline" size={14} color="#3b82f6" /> Fotos anexadas ({fotos.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotoScroll}>
          {fotos.map((url: string, idx: number) => (
            <Image key={idx} source={{ uri: url }} style={styles.fotoImage} resizeMode="cover" />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} tintColor="#3b82f6" />}
      >
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.welcome}>Painel de Controle</Text>
            <Text style={styles.sub}>Olá, <Text style={styles.name}>{userName || 'Profissional'}</Text>. Veja como está sua agenda.</Text>
            {dadosPerfil && (
              <View style={styles.reputacaoContainer}>
                <Ionicons name="star" size={16} color={dadosPerfil.rating ? '#ffc107' : '#ccc'} />
                <Text style={styles.reputacaoText}>Sua Reputação: {dadosPerfil.rating != null ? Number(dadosPerfil.rating).toFixed(1) : 'Sem avaliação'}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.btnAjustes} onPress={() => navigation.navigate('EditarPerfil')}>
            <Ionicons name="settings-outline" size={18} color="#3b82f6" />
            <Text style={styles.btnAjustesText}>Ajustes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, abaAtiva === 'NOVO' && styles.statCardActive]} onPress={() => setAbaAtiva('NOVO')}>
            <Text style={styles.statNumber}>{contagem('ABERTO')}</Text>
            <Text style={styles.statLabel}>Novas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, abaAtiva === 'ANDAMENTO' && styles.statCardActive]} onPress={() => setAbaAtiva('ANDAMENTO')}>
            <Text style={styles.statNumber}>{contagem('AGUARDANDO')}</Text>
            <Text style={styles.statLabel}>Em Andamento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, abaAtiva === 'FINALIZADO' && styles.statCardActive]} onPress={() => setAbaAtiva('FINALIZADO')}>
            <Text style={styles.statNumber}>{contagem('FINALIZADO')}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, abaAtiva === 'NOVO' && styles.tabActive]} onPress={() => setAbaAtiva('NOVO')}>
            <Text style={abaAtiva === 'NOVO' ? styles.tabTextActive : styles.tabText}>Novas ({contagem('ABERTO')})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, abaAtiva === 'ANDAMENTO' && styles.tabActive]} onPress={() => setAbaAtiva('ANDAMENTO')}>
            <Text style={abaAtiva === 'ANDAMENTO' ? styles.tabTextActive : styles.tabText}>Em Andamento ({contagem('AGUARDANDO')})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, abaAtiva === 'FINALIZADO' && styles.tabActive]} onPress={() => setAbaAtiva('FINALIZADO')}>
            <Text style={abaAtiva === 'FINALIZADO' ? styles.tabTextActive : styles.tabText}>Finalizadas ({contagem('FINALIZADO')})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={16} color="#a0aec0" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Filtrar por título..." placeholderTextColor="#a0aec0" value={buscaTexto} onChangeText={setBuscaTexto} />
          </View>
          <TouchableOpacity style={styles.btnRefresh} onPress={() => buscarPedidos()} disabled={loading}>
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
                onPress={() => navigation.navigate('DetalhesDemanda', { demanda: item, modo: 'PROFISSIONAL' })}
              >
                <View style={styles.cardBody}>
                  <View style={[styles.pillBase, statusInfo.style]}>
                    <Text style={styles.pillText}>{statusInfo.text}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.clientName}><Ionicons name="person-outline" size={13} color="#3b82f6" /> {item.clientId?.name || 'Cliente'}</Text>
                  <DemandInfoBadges demanda={item} />
                  <DemandFotos demanda={item} modo="indicador" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 30 },
  banner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, margin: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 15, flexWrap: 'wrap' },
  bannerTextContainer: { flex: 1 },
  welcome: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  name: { fontWeight: '700' },
  reputacaoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#f8fafc', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50, alignSelf: 'flex-start' },
  reputacaoText: { fontSize: 13, color: '#333', fontWeight: '600' },
  btnAjustes: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#cbd5e0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, backgroundColor: '#fff' },
  btnAjustesText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: 15, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  statCardActive: { borderColor: '#3b82f6', backgroundColor: '#fafdff' },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 12, marginHorizontal: 15, borderBottomWidth: 2, borderBottomColor: '#edf2f7', paddingBottom: 8, marginBottom: 15 },
  tab: { paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6', marginBottom: -10 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#718096' },
  tabTextActive: { color: '#3b82f6', fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginBottom: 15, gap: 10 },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 50, paddingHorizontal: 12, height: 38, backgroundColor: '#fff' },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#334155' },
  btnRefresh: { width: 38, height: 38, borderRadius: 50, borderWidth: 1, borderColor: '#cbd5e0', alignItems: 'center', justifyContent: 'center' },
  requestCard: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  cardBody: { padding: 16 },
  pillBase: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50, marginBottom: 8 },
  pillNovo: { backgroundColor: '#eff6ff' },
  pillAndamento: { backgroundColor: '#fffbeb' },
  pillFinalizado: { backgroundColor: '#f0fdf4' },
  pillRejeitado: { backgroundColor: '#fef2f2' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#333' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  clientName: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  infoBadgesContainer: { gap: 8, marginTop: 8 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eff6ff', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50, alignSelf: 'flex-start' },
  categoryTagText: { fontSize: 11, fontWeight: '700', color: '#2563eb', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  addressLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addressText: { fontSize: 13, color: '#475569', fontWeight: '500', flex: 1 },
  fotoIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 4 },
  fotoIndicatorText: { fontSize: 11, color: '#3b82f6', fontWeight: '600' },
  fotoGaleria: { marginTop: 8 },
  fotoGaleriaTitulo: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8 },
  fotoScroll: { marginTop: 4 },
  fotoImage: { width: 200, height: 150, borderRadius: 10, marginRight: 10, backgroundColor: '#f1f5f9' },
  emptyState: { alignItems: 'center', paddingVertical: 60, marginHorizontal: 15 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2d3748', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#718096', marginTop: 6, textAlign: 'center' },
});
