import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { logout as doLogout, getUserType } from '../services/auth';
import Toast from 'react-native-toast-message';

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
          <Text style={styles.logoText}>conectaPRO</Text>
        </TouchableOpacity>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.navigate('FAQ')}>
            <Text style={styles.navLink}>FAQ</Text>
          </TouchableOpacity>

          {user ? (
            <>
              {user.tipo === 'CLIENT' && (
                <TouchableOpacity onPress={() => navigation.navigate('ListaProf')}>
                  <Text style={styles.navLink}>Serviços</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    user.tipo === 'CLIENT' ? 'DashboardCliente' : 'DashboardProfissional'
                  )
                }
              >
                <Text style={styles.navLink}>Meu Painel</Text>
              </TouchableOpacity>
              <Text style={styles.userGreeting}>Olá, {user.nome.split(' ')[0]}</Text>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.btnLogout}>Sair</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.btnLogin}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
                <Text style={styles.btnCadastro}>Cadastre-se</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f5f8ff',
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
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flexWrap: 'wrap',
  },
  navLink: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
  userGreeting: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  btnLogin: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  btnCadastro: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
    fontWeight: '600',
  },
  btnLogout: {
    fontSize: 14,
    color: '#dc3545',
    borderWidth: 1,
    borderColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '600',
  },
});
