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
import { getUserId } from '../../services/auth';

export default function DashboardCliente() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabAtiva, setTabAtiva] = useState('todos');
  const [userName, setUserName] = useState('');

  // Estados para modal de avaliação
  const [modalVisible, setModalVisible] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<any>(null);
  const [ratingPoints, setRatingPoints] = useState(0);
  const [ratingDescription, setRatingDescription] = useState('');
  const [ratingAnonymous, setRatingAnonymous] = useState(false);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

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

  const abrirModalAvaliacao = (demanda: any) => {
    setDemandaSelecionada(demanda);
    setRatingPoints(0);
    setRatingDescription('');
    setRatingAnonymous(false);
    setModalVisible(true);
  };

  const enviarAvaliacao = async () => {
    if (ratingPoints === 0) {
      Toast.show({ type: 'error', text1: 'Selecione uma pontuação' });
      return;
    }
    setEnviandoAvaliacao(true);
    try {
      const userId = await getUserId();
      await api.post('/api/rating', {
        service: demandaSelecionada.id,
        evaluatingPerson: parseInt(userId!),
        personEvaluated: demandaSelecionada.professionalId.id,
        points: ratingPoints,
        description: ratingDescription,
        anonymous: ratingAnonymous,
      });
      Toast.show({ type: 'success', text1: 'Avaliação enviada!' });
      setModalVisible(false);
      buscarPedidos();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao enviar avaliação';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setEnviandoAvaliacao(false);
    }
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
              <View style={styles.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>{item.title}</Text>
                  <Text style={styles.orderMeta}>{item.description?.substring(0, 60)}...</Text>
                  {item.demandStatus === 'FECHADO' && (
                    <TouchableOpacity
                      style={styles.btnAvaliar}
                      onPress={() => abrirModalAvaliacao(item)}
                    >
                      <Text style={styles.btnAvaliarText}>Avaliar</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.pill, item.demandStatus === 'ABERTO' && styles.pillAberto, item.demandStatus === 'FECHADO' && styles.pillFinalizado]}>
                  <Text style={styles.pillText}>{traduzirStatus(item.demandStatus)}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal de avaliação */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avaliar Serviço</Text>

            {/* Seleção de estrelas */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRatingPoints(star)}>
                  <FontAwesome5
                    name="star"
                    size={32}
                    color={star <= ratingPoints ? '#f59f00' : '#ced4da'}
                    solid={star <= ratingPoints}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingQualifier}>
              {ratingPoints === 0 ? 'Toque para avaliar' :
                ratingPoints <= 2 ? 'Ruim' :
                  ratingPoints === 3 ? 'Regular' :
                    ratingPoints === 4 ? 'Bom' : 'Excelente'}
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva sua experiência (opcional)"
              multiline
              value={ratingDescription}
              onChangeText={setRatingDescription}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRatingAnonymous(!ratingAnonymous)}
            >
              <View style={[styles.checkbox, ratingAnonymous && styles.checkboxChecked]}>
                {ratingAnonymous && <Text style={{ color: '#fff' }}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Avaliar anonimamente</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#666' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSubmit, enviandoAvaliacao && { opacity: 0.7 }]}
                onPress={enviarAvaliacao}
                disabled={enviandoAvaliacao}
              >
                <Text style={styles.btnSubmitText}>
                  {enviandoAvaliacao ? 'Enviando...' : 'Enviar Avaliação'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos (adicionados os novos elementos)
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
  btnAvaliar: { marginTop: 8, backgroundColor: '#f59f00', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  btnAvaliarText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  ratingQualifier: { textAlign: 'center', color: '#888', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  textArea: { height: 100, textAlignVertical: 'top', marginBottom: 15 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#007bff', borderRadius: 4, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#007bff' },
  checkboxLabel: { fontSize: 14, color: '#555' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 25, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  btnSubmit: { backgroundColor: '#0066ff', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  btnSubmitText: { color: '#fff', fontWeight: 'bold' },
});
