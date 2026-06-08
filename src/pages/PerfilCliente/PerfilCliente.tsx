import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { logout } from '../../services/auth';
import { RootStackParamList } from '../../navigation/types';

export default function PerfilCliente() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/perfil');
        setUser(res.data);
        if (res.data.fotoperfil) setAvatarUri(res.data.fotoperfil);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Erro ao carregar perfil' });
      }
    })();
  }, []);

  const handleUploadImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);

      const formData = new FormData();
      formData.append('foto', {
        uri,
        name: 'foto.jpg',
        type: 'image/jpeg',
      } as any);

      try {
        await api.put('/perfil/foto', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Toast.show({ type: 'success', text1: 'Foto atualizada!' });
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Erro ao atualizar foto' });
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    Toast.show({ type: 'success', text1: 'Logout realizado' });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.bg}>
      <View style={styles.container}>
        <View style={styles.cabecalho}>
          <View style={styles.infoTopo}>
            <TouchableOpacity onPress={handleUploadImagem}>
              <Image
                source={{
                  uri: avatarUri || 'https://via.placeholder.com/120',
                }}
                style={styles.avatar}
              />
              <View style={styles.cameraIcon}>
                <FontAwesome5 name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
            <View>
              <Text style={styles.nome}>{user.nome}</Text>
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
  cabecalho: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 15,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007bff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontSize: 20, fontWeight: 'bold' },
  email: { color: '#888' },
  btnEditar: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  grade: { flexDirection: 'row', gap: 15 },
  coluna: { flex: 1 },
  tituloSecao: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  cartaoAjuda: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
});
