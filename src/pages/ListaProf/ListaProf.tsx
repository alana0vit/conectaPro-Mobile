import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import imgLista from '../../../assets/ImgLista1.jpg';

interface Profissional {
  id: number;
  nome: string;
  especialidade?: string;
  categoria?: { nome: string };
  mediaAvaliacao?: number;
  totalAvaliacoes?: number;
}

export default function ListaProf() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  const buscarProfissionais = async (filtros = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/profissionais', { params: filtros });
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
    buscarProfissionais({ nome: searchTerm, categoria });
  };

  const pegarLocalizacao = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Não foi possível acessar a localização.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      buscarProfissionais({ latitude, longitude });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao obter localização' });
    }
  };

  const lidarComSelecaoProfissional = (profissionalId: number) => {
    navigation.navigate('PerfilProfissional', { id: profissionalId });
  };

  return (
    <ScrollView style={styles.pagina}>
      <View style={styles.topoBusca}>
        <View style={styles.conteudoTopo}>
          <View style={styles.ladoEsquerdo}>
            <Text style={styles.tituloPrincipal}>
              Encontre o <Text style={styles.sublinhado}>profissional</Text> ideal
            </Text>
            <Text style={styles.subtitulo}>
              Pesquise por nome ou categoria e encontre o melhor para você.
            </Text>
            <View style={styles.barraPesquisa}>
              <FontAwesome5 name="search" size={16} color="#999" />
              <TextInput
                style={styles.inputPesquisa}
                placeholder="Ex: encanador, eletricista..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              <TouchableOpacity style={styles.btnBuscar} onPress={lidarComBusca}>
                <Text style={styles.btnBuscarText}>Buscar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filtrosLinha}>
              <View style={styles.selectCategoria}>
                <TextInput
                  style={styles.inputCategoria}
                  placeholder="Categoria"
                  value={categoria}
                  onChangeText={setCategoria}
                />
              </View>
              <TouchableOpacity style={styles.btnLocalizacao} onPress={pegarLocalizacao}>
                <MaterialIcons name="my-location" size={20} color="#fff" />
                <Text style={styles.btnLocalizacaoText}>Usar localização</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.ladoDireito}>
            <Image source={imgLista} style={styles.imagemHero} />
          </View>
        </View>
      </View>

      <View style={styles.conteudoGrade}>
        <Text style={styles.tituloSessao}>Profissionais disponíveis</Text>
        {loading ? (
          <Text style={{ textAlign: 'center' }}>Carregando...</Text>
        ) : (
          <FlatList
            data={profissionais}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cartaoProfissional}
                onPress={() => lidarComSelecaoProfissional(item.id)}
              >
                <View style={styles.topoColorido} />
                <View style={styles.corpoCartao}>
                  <View style={styles.avatar}>
                    <FontAwesome5 name="user-circle" size={50} color="#007bff" />
                  </View>
                  <Text style={styles.nomeProfissional}>{item.nome}</Text>
                  <Text style={styles.especialidade}>
                    {item.especialidade || item.categoria?.nome || 'Geral'}
                  </Text>
                  <View style={styles.avaliacao}>
                    <FontAwesome5 name="star" size={14} color="#ffcc00" />
                    <Text style={styles.avaliacaoNota}>
                      {item.mediaAvaliacao?.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={styles.totalAvaliacoes}>
                      ({item.totalAvaliacoes || 0})
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.btnPontoCartao}>
                    <Text style={styles.btnPontoText}>Ver perfil</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10 }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topoBusca: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  conteudoTopo: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  ladoEsquerdo: {
    alignItems: 'center',
  },
  tituloPrincipal: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sublinhado: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  subtitulo: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 8,
    marginBottom: 20,
  },
  barraPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 5,
    width: '100%',
  },
  inputPesquisa: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  btnBuscar: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  btnBuscarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filtrosLinha: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  selectCategoria: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  inputCategoria: {
    height: 40,
  },
  btnLocalizacao: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 5,
  },
  btnLocalizacaoText: {
    color: '#fff',
  },
  ladoDireito: {
    marginTop: 20,
    width: '100%',
  },
  imagemHero: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
  },
  conteudoGrade: {
    padding: 20,
  },
  tituloSessao: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  cartaoProfissional: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  topoColorido: {
    height: 70,
    backgroundColor: '#e6f0ff',
  },
  corpoCartao: {
    alignItems: 'center',
    padding: 15,
    marginTop: -35,
  },
  avatar: {
    marginBottom: 10,
  },
  nomeProfissional: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  especialidade: {
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  avaliacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 15,
  },
  avaliacaoNota: {
    fontWeight: 'bold',
  },
  totalAvaliacoes: {
    color: '#999',
  },
  btnPontoCartao: {
    borderWidth: 1,
    borderColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnPontoText: {
    color: '#007bff',
  },
});
