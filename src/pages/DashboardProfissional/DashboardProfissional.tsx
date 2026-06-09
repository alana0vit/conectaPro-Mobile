import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { getUserId } from '../../services/auth';

export default function DashboardProfissional() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('todos');

  const buscarPedidos = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const res = await api.get('/api/demand/user');
      const minhas = res.data.filter((d: any) => d.professionalId?.id == userId);
      setPedidos(minhas);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar demandas' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => { buscarPedidos(); }, [])
  );

  const atualizarStatus = async (pedidoId: number, novoStatus: string) => {
    try {
      await api.patch(`/api/demand/${pedidoId}/status`, { status: novoStatus });
      Toast.show({ type: 'success', text1: 'Status atualizado!' });
      buscarPedidos();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao atualizar' });
    }
  };

  const pedidosFiltrados = tab === 'todos' ? pedidos : pedidos.filter(p => p.demandStatus === tab.toUpperCase());

  const traduzirStatus = (status: string) => {
    const map: Record<string, string> = {
      ABERTO: 'Novo',
      AGUARDANDO: 'Em andamento',
      FECHADO: 'Finalizado',
      REJEITADO: 'Rejeitado',
    };
    return map[status] || status;
  };

  return (
    <View style={styles.bg}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Olá, Profissional</Text>
            <Text style={styles.subtitle}>Acompanhe suas demandas</Text>
          </View>
          <TouchableOpacity style={styles.btnConfig} onPress={() => navigation.navigate('EditarPerfil')}>
            <FontAwesome5 name="cog" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          {['todos', 'aberto', 'aguardando', 'fechado'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={tab === t ? styles.tabTextActive : styles.tabText}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btnRefresh} onPress={buscarPedidos}>
          <FontAwesome5 name="sync-alt" size={16} color="#fff" />
          <Text style={styles.btnRefreshText}>Atualizar</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>Demandas</Text>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={pedidosFiltrados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <View style={styles.cardBody}>
                  <Text style={styles.badgeStatus}>{traduzirStatus(item.demandStatus)}</Text>
                  <Text style={styles.clientName}>{item.clientId?.name || 'Cliente'}</Text>
                  <Text numberOfLines={2}>{item.title}</Text>
                </View>
                <View style={styles.cardFooter}>
                  {item.demandStatus === 'ABERTO' && (
                    <>
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnAccept]}
                        onPress={() => atualizarStatus(item.id, 'AGUARDANDO')}
                      >
                        <Text style={styles.btnActionText}>Aceitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnDecline]}
                        onPress={() => atualizarStatus(item.id, 'REJEITADO')}
                      >
                        <Text style={styles.btnActionText}>Recusar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {item.demandStatus === 'AGUARDANDO' && (
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnFinish]}
                      onPress={() => atualizarStatus(item.id, 'FECHADO')}
                    >
                      <Text style={styles.btnActionText}>Finalizar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.btnAction, styles.btnInfo]}
                    onPress={() => navigation.navigate('DetalhesSolicitacao', { id: item.id })}
                  >
                    <Text style={{ color: '#333' }}>Detalhes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f4f6f9' },
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcome: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#888' },
  btnConfig: { padding: 10 },
  tabsContainer: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e9ecef' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { color: '#555' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },
  btnRefresh: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#3b82f6', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, gap: 5, marginBottom: 15 },
  btnRefreshText: { color: '#fff' },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  requestCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10 },
  cardBody: { marginBottom: 10 },
  badgeStatus: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', fontSize: 12 },
  clientName: { fontWeight: 'bold', marginVertical: 5 },
  cardFooter: { flexDirection: 'row', gap: 8 },
  btnAction: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  btnAccept: { backgroundColor: '#10b981' },
  btnDecline: { backgroundColor: '#ef4444' },
  btnFinish: { backgroundColor: '#3b82f6' },
  btnInfo: { backgroundColor: '#e9ecef' },
  btnActionText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
