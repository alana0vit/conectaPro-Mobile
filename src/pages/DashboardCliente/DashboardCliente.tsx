import React, { useState, useEffect, useCallback } from 'react';
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
import { getToken, getUserType, logout } from '../../services/auth';

// Adaptação simplificada - mantém a lógica essencial
export default function DashboardCliente() {
  const navigation = useNavigation();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabAtiva, setTabAtiva] = useState('todos');
  const [userName, setUserName] = useState('');
  const [contagens, setContagens] = useState({ abertos: 0, aguardando: 0, finalizados: 0 });

  const buscarPedidos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/solicitacoes/cliente');
      setPedidos(res.data);
      // Calcular contagens
      setContagens({
        abertos: res.data.filter((p: any) => p.status === 'ABERTO').length,
        aguardando: res.data.filter((p: any) => p.status === 'AGUARDANDO').length,
        finalizados: res.data.filter((p: any) => p.status === 'FINALIZADO').length,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar solicitações' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarPedidos();
      // Obter nome do token ou perfil
      (async () => {
        const res = await api.get('/perfil');
        setUserName(res.data.nome);
      })();
    }, [])
  );

  const pedidosFiltrados = tabAtiva === 'todos'
    ? pedidos.filter(p => p.descricao?.toLowerCase().includes(search.toLowerCase()))
    : pedidos.filter(p => p.status === tabAtiva.toUpperCase() && p.descricao?.toLowerCase().includes(search.toLowerCase()));

  const traduzirStatus = (status: string) => {
    const map: Record<string, string> = { ABERTO: 'Aberto', AGUARDANDO: 'Aguardando', FINALIZADO: 'Finalizado', REJEITADO: 'Rejeitado' };
    return map[status] || status;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.banner}>
        <View>
          <Text style={styles.welcome}>Bem-vindo(a),</Text>
          <Text style={styles.name}>{userName || 'Cliente'}</Text>
        </View>
        <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('EditarPerfil' as never)}>
          <Text style={styles.btnEditText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCards}>
        <View style={[styles.statusCard, { borderLeftColor: '#0066ff' }]}>
          <Text style={styles.statusNumber}>{contagens.abertos}</Text>
          <Text style={styles.statusLabel}>Abertos</Text>
        </View>
        <View style={[styles.statusCard, { borderLeftColor: '#f59f00' }]}>
          <Text style={styles.statusNumber}>{contagens.aguardando}</Text>
          <Text style={styles.statusLabel}>Aguardando</Text>
        </View>
        <View style={[styles.statusCard, { borderLeftColor: '#37b24d' }]}>
          <Text style={styles.statusNumber}>{contagens.finalizados}</Text>
          <Text style={styles.statusLabel}>Finalizados</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnNewSolic} onPress={() => navigation.navigate('ListaProf' as never)}>
        <Text style={styles.btnNewSolicText}>+ Nova Solicitação</Text>
      </TouchableOpacity>

      <View style={styles.board}>
        <Text style={styles.boardTitle}>Minhas Solicitações</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity onPress={buscarPedidos}>
            <FontAwesome5 name="sync-alt" size={18} color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {['todos', 'aberto', 'aguardando', 'finalizado'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, tabAtiva === tab && styles.tabActive]}
              onPress={() => setTabAtiva(tab)}
            >
              <Text style={tabAtiva === tab ? styles.tabTextActive : styles.tabText}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={pedidosFiltrados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.orderRow}>
                <View>
                  <Text style={styles.orderTitle}>{item.descricao}</Text>
                  <Text style={styles.orderMeta}>{item.profissional?.nome}</Text>
                </View>
                <View style={[styles.pill, item.status === 'ABERTO' && styles.pillAberto, item.status === 'FINALIZADO' && styles.pillFinalizado]}>
                  <Text style={styles.pillText}>{traduzirStatus(item.status)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
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
    borderRadius: 12,
  },
  welcome: { fontSize: 16, color: '#555' },
  name: { fontSize: 22, fontWeight: 'bold' },
  btnEdit: { backgroundColor: '#e9ecef', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  btnEditText: { color: '#333' },
  statusCards: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, marginBottom: 15 },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  statusNumber: { fontSize: 22, fontWeight: 'bold' },
  statusLabel: { color: '#888' },
  btnNewSolic: {
    backgroundColor: '#0066ff',
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  btnNewSolicText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  board: { flex: 1, backgroundColor: '#fff', margin: 15, borderRadius: 12, padding: 15 },
  boardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f1f3f5' },
  tabActive: { backgroundColor: '#0066ff' },
  tabText: { color: '#555' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderTitle: { fontWeight: '600' },
  orderMeta: { color: '#888', fontSize: 13 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e9ecef' },
  pillAberto: { backgroundColor: '#e6f0ff' },
  pillFinalizado: { backgroundColor: '#ebfbee' },
  pillText: { fontSize: 12, fontWeight: 'bold' },
});
