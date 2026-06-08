import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function Footer() {
  const navigation = useNavigation < NativeStackNavigationProp < RootStackParamList >> ();

  return (
    <View style={styles.footerContainer}>
      <View style={styles.footerContent}>
        <View style={styles.footerColumn}>
          <Text style={styles.columnTitle}>Institucional</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FAQ')}>
            <Text style={styles.link}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FaleConosco')}>
            <Text style={styles.link}>Fale Conosco</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('TermosDeUso')}>
            <Text style={styles.link}>Termos de Uso</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.columnTitle}>Contato</Text>
          <Text style={styles.contactText}>
            <FontAwesome5 name="phone-alt" size={14} /> (11) 99999-9999
          </Text>
          <Text style={styles.contactText}>
            <MaterialIcons name="email" size={14} /> contato@conectapro.com.br
          </Text>
        </View>
      </View>
      <View style={styles.footerBottom}>
        <Text style={styles.copyText}>© 2025 conectaPRO. Todos os direitos reservados.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  footerColumn: {
    marginBottom: 20,
  },
  columnTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  link: {
    color: '#adb5bd',
    fontSize: 14,
    marginBottom: 6,
  },
  contactText: {
    color: '#adb5bd',
    fontSize: 14,
    marginBottom: 6,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#343a40',
    marginTop: 20,
    paddingTop: 15,
    alignItems: 'center',
  },
  copyText: {
    color: '#6c757d',
    fontSize: 13,
  },
});
