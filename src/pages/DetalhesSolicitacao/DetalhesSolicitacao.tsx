import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  StyleSheet,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

type DetalhesRoute = RouteProp<RootStackParamList, 'DetalhesSolicitacao'>;

export default function DetalhesSolicitacao() {
  const route = useRoute<DetalhesRoute>();
  const { id } = route.params;
  const [demand, setDemand] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/demand/user/${id}`);
        setDemand(res.data);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Erro ao carregar detalhes' });
      }
    })();
  }, [id]);

  if (!demand) return null;

  const statusTraduzido: Record<string, string> = {
    ABERTO: 'Aberto',
    AGUARDANDO: 'Em andamento',
    FECHADO: 'Finalizado',
    REJEITADO: 'Rejeitado',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{demand.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusTraduzido[demand.demandStatus] || demand.demandStatus}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.infoPrincipal}>
            <FontAwesome5 name="user-circle" size={40} color="#007bff" />
            <View>
              <Text style={styles.nome}>{demand.professionalId?.name || 'Profissional'}</Text>
              <Text style={styles.email}>{demand.professionalId?.email}</Text>
            </View>
          </View>
          <View style={styles.gridContatos}>
            <View style={styles.itemContato}>
              <FontAwesome5 name="phone" size={16} color="#28a745" />
              <Text>{demand.professionalId?.phone}</Text>
            </View>
          </View>
          <View style={styles.enderecoServico}>
            <FontAwesome5 name="file-alt" size={20} color="#333" />
            <Text style={{ flex: 1 }}>{demand.description}</Text>
          </View>
        </View>
        {demand.professionalId?.phone && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnWhatsapp}
              onPress={() => Linking.openURL(`https://wa.me/55${demand.professionalId.phone.replace(/\D/g, '')}`)}
            >
              <FontAwesome5 name="whatsapp" size={20} color="#fff" />
              <Text style={styles.btnWhatsappText}>Chamar no WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  badge: { backgroundColor: '#e6f0ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#007bff', fontWeight: 'bold' },
  body: { padding: 20 },
  infoPrincipal: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  nome: { fontSize: 16, fontWeight: 'bold' },
  email: { color: '#888' },
  gridContatos: { gap: 10, marginBottom: 20 },
  itemContato: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  enderecoServico: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  btnWhatsapp: { flexDirection: 'row', backgroundColor: '#25d366', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 8, gap: 10 },
  btnWhatsappText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
