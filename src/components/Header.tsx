import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { logout as doLogout } from '../services/auth';
import Toast from 'react-native-toast-message';

interface HeaderProps {
  user?: { nome: string; tipo?: string } | null;
  setUser?: (user: null) => void;
}

export default function Header({ user, setUser }: HeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLogout = async () => {
    await doLogout();
    if (setUser) setUser(null);
    setMenuAberto(false);
    Toast.show({ type: 'success', text1: 'Logout realizado' });
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const navegarPara = (tela: keyof RootStackParamList) => {
    setMenuAberto(false);
    navigation.navigate(tela as any);
  };

  return (
    <View style={styles.header}>
      {/* BARRA SUPERIOR: Apenas o Ícone do Sanduíche na direita */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setMenuAberto(!menuAberto)}
        >
          <Text style={styles.menuIcon}>{menuAberto ? '✕' : '☰'}</Text>
        </TouchableOpacity>
      </View>

      {/* MENU DROPDOWN */}
      {menuAberto && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navegarPara('Home')}>
            <Text style={styles.navLink}>Home</Text>
          </TouchableOpacity>

          {user ? (
            <>
              <View style={styles.menuItem}>
                <Text style={styles.userGreeting}>Olá, {user.nome}</Text>
              </View>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.btnLogout}>Sair</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => navegarPara('Login')}>
                <Text style={styles.btnLogin}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => navegarPara('Cadastro')}>
                <Text style={styles.btnCadastro}>Cadastro</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Garante que o menu fique na direita
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45, // <--- Aqui é a mágica que empurra o sanduíche para baixo
    paddingBottom: 15,
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    fontSize: 32, // Aumentei levemente para ficar melhor o toque
    color: '#333',
    fontWeight: 'bold',
  },
  dropdownMenu: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navLink: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  userGreeting: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
  },
  btnLogin: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
  },
  btnCadastro: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
  },
  btnLogout: {
    fontSize: 18,
    color: '#dc3545',
    fontWeight: 'bold',
  },
});