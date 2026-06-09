import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { logout, getUserId } from '../../services/auth';
import { RootStackParamList } from '../../navigation/types';

export default function PerfilCliente() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await getUserId();
        if (!userId) {
          Toast.show({ type: 'error', text1: 'Usuário não identificado. Faça login.' });
          return;
        }
        const res = await api.get(`/api/user/${userId}`);
        setUser(res.data);
      } catch (error: any) {
        console.log('Erro ao carregar perfil:',
          error.response?.status,
          error.response?.data,
          error.message
        );
        Toast.show({ type: 'error', text1: 'Erro ao carregar perfil' });
      }
    })();
  }, []);
  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.bg}>
      <View style={styles.container}>
        <View style={styles.cabecalho}>
          <View style={styles.infoTopo}>
            <FontAwesome5 name="user-circle" size={80} color="#007bff" />
            <View>
              <Text style={styles.nome}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.btnEditar}
            onPress={() => navigation.navigate('EditarPerfil')}
          >
            <Text>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grade}>
          <View style={styles.coluna}>
            <Text style={styles.tituloSecao}>Ajuda</Text>
            <TouchableOpacity
              style={styles.cartaoAjuda}
              onPress={() => navigation.navigate('FAQ')}
            >
              <FontAwesome5 name="question-circle" size={40} color="#007bff" />
              <Text style={{ marginTop: 10 }}>Perguntas Frequentes</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.coluna}>
            <Text style={styles.tituloSecao}>Configurações</Text>
            <TouchableOpacity
              style={styles.itemLinha}
              onPress={() => navigation.navigate('FaleConosco')}
            >
              <FontAwesome5 name="headset" size={16} color="#007bff" />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontWeight: '600' }}>Fale Conosco</Text>
                <Text style={{ color: '#999' }}>Atendimento</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.itemLinha} onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#ff4d4d" />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontWeight: '600', color: '#ff4d4d' }}>Sair</Text>
                <Text style={{ color: '#999' }}>Encerrar sessão</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f4f6f9' },
  container: { padding: 20 },
  cabecalho: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20 },
  infoTopo: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 15 },
  nome: { fontSize: 20, fontWeight: 'bold' },
  email: { color: '#888' },
  btnEditar: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  grade: { flexDirection: 'row', gap: 15 },
  coluna: { flex: 1 },
  tituloSecao: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  cartaoAjuda: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  itemLinha: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
});
