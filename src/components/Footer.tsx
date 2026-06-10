import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function Footer() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.footerContainer}>
      <View style={styles.footerContent}>
        {/* Coluna Nossas Redes */}
        <View style={styles.footerColumn}>
          <Text style={styles.columnTitle}>Nossas Redes</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity style={styles.linkItem}>
              <FontAwesome5 name="instagram" size={18} color="#007bff" />
              <Text style={styles.linkText}> @ConectaPro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkItem}>
              <FontAwesome5 name="whatsapp" size={18} color="#007bff" />
              <Text style={styles.linkText}> (81) 95555-0000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkItem}>
              <FontAwesome5 name="linkedin" size={18} color="#007bff" />
              <Text style={styles.linkText}> ConectaPro_News</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coluna Contato */}
        <View style={styles.footerColumn}>
          <Text style={styles.columnTitle}>Contato</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity style={styles.linkItem} onPress={() => Linking.openURL('mailto:conectaPro@conectapro.com')}>
              <MaterialIcons name="email" size={18} color="#007bff" />
              <Text style={styles.linkText}> conectaPro@conectapro.com</Text>
            </TouchableOpacity>
            <View style={styles.linkItem}>
              <FontAwesome5 name="phone-alt" size={16} color="#007bff" />
              <Text style={styles.linkText}> 3333-3333</Text>
            </View>
            <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('FAQ')}>
              <FontAwesome5 name="question-circle" size={18} color="#007bff" />
              <Text style={styles.linkText}> Central de Ajuda (FAQ)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footerBottom}>
        <Text style={styles.copyText}>© 2026 ConectaPro - Todos os direitos reservados.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#f5f8ff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 40,
  },
  footerColumn: {
    marginBottom: 20,
  },
  columnTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },
  footerLinks: {
    gap: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 30,
    paddingTop: 15,
    alignItems: 'center',
  },
  copyText: {
    color: '#aaa',
    fontSize: 12,
  },
});
