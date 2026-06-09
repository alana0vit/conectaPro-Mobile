import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { getUserId } from '../../services/auth';

export default function DashboardCliente() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabAtiva, setTabAtiva] = useState('todos');
  const [userName, setUserName] = useState('');

  const buscarPedidos = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const res = await api.get('/api/demand/user');
      const minhas = res.data.filter((d: any) => d.clientId?.id == userId);
      setPedidos(minhas);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar solicitações' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarPedidos();
      (async () => {
        try {
          const userId = await getUserId();
          const res = await api.get(`/api/user/${userId}`);
          setUserName(res.data.name);
        } catch (e) { }
      })();
    }, [])
  );

  const pedidosFiltrados = tabAtiva === 'todos'
    ? pedidos.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : pedidos.filter(p => p.demandStatus === tabAtiva.toUpperCase() && p.title?.toLowerCase().includes(search.toLowerCase()));

  const traduzirStatus = (status: string) => {
    const map: Record<string, string> = {
      ABERTO: 'Aberto',
      AGUARDANDO: 'Aguardando',
      FECHADO: 'Finalizado',
      REJEITADO: 'Rejeitado',
    };
    return map[status] || status;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.banner}>
        <View>
          <Text style={styles.welcome}>Bem-vindo(a),</Text>
          <Text style={styles.name}>{userName || 'Cliente'}</Text>
        </View>
        <TouchableOpacity style={styles.btnEdit} onPress={() => navigation.navigate('EditarPerfil')}>
          <Text style={styles.btnEditText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnNewSolic} onPress={() => navigation.navigate('ListaProf')}>
        <Text style={styles.btnNewSolicText}>+ Nova Solicitação</Text>
      </TouchableOpacity>

      <View style={styles.board}>
        <Text style={styles.boardTitle}>Minhas Solicitações</Text>
        <View style={styles.searchRow}>
          <TextInput style={styles.searchInput} placeholder="Buscar..." value={search} onChangeText={setSearch} />
          <TouchableOpacity onPress={buscarPedidos}>
            <FontAwesome5 name="sync-alt" size={18} color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {['todos', 'aberto', 'aguardando', 'fechado'].map(tab => (
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
              <TouchableOpacity
                style={styles.orderRow}
                onPress={() => navigation.navigate('DetalhesSolicitacao', { id: item.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>{item.title}</Text>
                  <Text style={styles.orderMeta}>{item.description?.substring(0, 60)}...</Text>
                </View>
                <View style={[styles.pill, item.demandStatus === 'ABERTO' && styles.pillAberto, item.demandStatus === 'FECHADO' && styles.pillFinalizado]}>
                  <Text style={styles.pillText}>{traduzirStatus(item.demandStatus)}</Text>
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
  banner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, margin: 15, borderRadius: 12 },
  welcome: { fontSize: 16, color: '#555' },
  name: { fontSize: 22, fontWeight: 'bold' },
  btnEdit: { backgroundColor: '#e9ecef', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  btnEditText: { color: '#333' },
  btnNewSolic: { backgroundColor: '#0066ff', marginHorizontal: 15, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
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
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  orderTitle: { fontWeight: '600' },
  orderMeta: { color: '#888', fontSize: 13 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e9ecef' },
  pillAberto: { backgroundColor: '#e6f0ff' },
  pillFinalizado: { backgroundColor: '#ebfbee' },
  pillText: { fontSize: 12, fontWeight: 'bold' },
});
