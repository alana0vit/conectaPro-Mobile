import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { logout as doLogout } from '../services/auth';
import Toast from 'react-native-toast-message';
import logoImg from '../../assets/logo.png';

interface HeaderProps {
  user?: { nome: string; tipo?: string } | null;
  setUser?: (user: null) => void;
}

export default function Header({ user, setUser }: HeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    await doLogout();
    if (setUser) setUser(null);
    Toast.show({ type: 'success', text1: 'Logout realizado' });
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={logoImg} style={styles.logoImg} />
        </TouchableOpacity>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.navLink}>Home</Text>
          </TouchableOpacity>
          {user ? (
            <View style={styles.userMenu}>
              <Text style={styles.userGreeting}>Olá, {user.nome}</Text>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.btnLogout}>Sair</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authButtons}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.btnLogin}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
                <Text style={styles.btnCadastro}>Cadastro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoImg: {
    width: 170,
    height: 48,
    resizeMode: 'contain',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navLink: {
    fontSize: 16,
    color: '#333',
  },
  userMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userGreeting: {
    fontSize: 14,
    color: '#555',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btnLogin: {
    fontSize: 14,
    color: '#007bff',
    borderWidth: 1,
    borderColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnCadastro: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  btnLogout: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: 'bold',
  },
});
