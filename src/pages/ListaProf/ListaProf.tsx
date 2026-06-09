import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

export default function ListaProf() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  const buscarProfissionais = async (filtros: any = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/api/user/search', { params: filtros });
      setProfissionais(res.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar profissionais' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarProfissionais();
  }, []);

  const lidarComBusca = () => {
    const params: any = {};
    if (searchTerm) params.name = searchTerm;
    if (categoria) params.categoryId = categoria;
    buscarProfissionais(params);
  };

  const pegarLocalizacao = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permissão de localização negada' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      buscarProfissionais({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, radiusKm: 10 });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao obter localização' });
    }
  };

  return (
    <ScrollView style={styles.pagina}>
      <View style={styles.topoBusca}>
        <Text style={styles.tituloPrincipal}>Encontre o profissional ideal</Text>
        <View style={styles.barraPesquisa}>
          <TextInput
            style={styles.inputPesquisa}
            placeholder="Nome do profissional..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity style={styles.btnBuscar} onPress={lidarComBusca}>
            <Text style={styles.btnBuscarText}>Buscar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filtrosLinha}>
          <TextInput
            style={styles.inputCategoria}
            placeholder="ID Categoria"
            value={categoria}
            onChangeText={setCategoria}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.btnLocalizacao} onPress={pegarLocalizacao}>
            <FontAwesome5 name="location-arrow" size={16} color="#fff" />
            <Text style={styles.btnLocalizacaoText}>Perto de mim</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={profissionais}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10, padding: 15 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cartao}
            onPress={() => navigation.navigate('PerfilProfissional', { id: item.id })}
          >
            <View style={styles.topoColorido} />
            <View style={styles.corpoCartao}>
              <FontAwesome5 name="user-circle" size={50} color="#007bff" />
              <Text style={styles.nome}>{item.name}</Text>
              {item.categories?.[0] && (
                <Text style={styles.especialidade}>{item.categories[0].name}</Text>
              )}
              {item.rating != null && (
                <View style={styles.avaliacao}>
                  <FontAwesome5 name="star" size={14} color="#ffcc00" />
                  <Text style={styles.avaliacaoNota}>{item.rating.toFixed(1)}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.btnVerPerfil}>
                <Text style={styles.btnVerPerfilText}>Ver perfil</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: '#f8f9fa' },
  topoBusca: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  tituloPrincipal: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  barraPesquisa: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f5', borderRadius: 30, paddingLeft: 15 },
  inputPesquisa: { flex: 1, fontSize: 16, paddingVertical: 8 },
  btnBuscar: { backgroundColor: '#007bff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  btnBuscarText: { color: '#fff', fontWeight: 'bold' },
  filtrosLinha: { flexDirection: 'row', marginTop: 10, gap: 10 },
  inputCategoria: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, height: 40 },
  btnLocalizacao: { flexDirection: 'row', backgroundColor: '#28a745', alignItems: 'center', paddingHorizontal: 15, borderRadius: 8, gap: 5 },
  btnLocalizacaoText: { color: '#fff' },
  cartao: { flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  topoColorido: { height: 70, backgroundColor: '#e6f0ff' },
  corpoCartao: { alignItems: 'center', padding: 15, marginTop: -35 },
  nome: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  especialidade: { color: '#666', marginBottom: 10, textAlign: 'center' },
  avaliacao: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  avaliacaoNota: { fontWeight: 'bold' },
  btnVerPerfil: { borderWidth: 1, borderColor: '#007bff', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 },
  btnVerPerfilText: { color: '#007bff' },
});
