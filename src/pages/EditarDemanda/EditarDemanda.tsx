import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';
import api from '../../services/api';

type EditarDemandaRoute = RouteProp<RootStackParamList, 'EditarDemanda'>;

export default function EditarDemanda() {
  const route = useRoute<EditarDemandaRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params;
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/demandas/${id}`);
        setDescricao(res.data.descricao);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Erro ao carregar demanda' });
      }
    })();
  }, [id]);

  const lidarComSubmissao = async () => {
    setLoading(true);
    try {
      await api.put(`/demandas/${id}`, { descricao });
      Toast.show({ type: 'success', text1: 'Demanda atualizada!' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao atualizar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Editar Demanda</Text>
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={descricao}
          onChangeText={setDescricao}
        />
        <TouchableOpacity
          style={[styles.btnSalvar, loading && { opacity: 0.7 }]}
          onPress={lidarComSubmissao}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f0f2f5' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  textArea: { height: 150, textAlignVertical: 'top' },
  btnSalvar: { backgroundColor: '#0f172a', paddingVertical: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
