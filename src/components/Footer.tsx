import React from 'react';
import { View, Text, TouchableOpacity, Linking, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

export default function Footer() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const abrirLink = (url: string) => Linking.openURL(url);

  return (
    <View style={styles.footer}>
      <View style={styles.container}>
        <View style={styles.brand}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.description}>
            Conectando talentos a oportunidades de forma rápida, segura e inteligente.
          </Text>
          <View style={styles.socials}>
            <TouchableOpacity style={styles.socialBtn} onPress={() => abrirLink('https://youtube.com')}>
              <Ionicons name="logo-youtube" size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => abrirLink('https://instagram.com')}>
              <Ionicons name="logo-instagram" size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => abrirLink('https://facebook.com')}>
              <Ionicons name="logo-facebook" size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => abrirLink('https://twitter.com')}>
              <Ionicons name="logo-twitter" size={18} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => abrirLink('https://linkedin.com')}>
              <Ionicons name="logo-linkedin" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.columnsRow}>
          <View style={styles.linksColumn}>
            <Text style={styles.columnTitle}>Plataforma</Text>
            <View style={styles.linksList}>
              <TouchableOpacity onPress={() => navigation.navigate('ListaProf')}>
                <Text style={styles.linkText}>Serviços</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('DashboardCliente')}>
                <Text style={styles.linkText}>Meu Painel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('FAQ')}>
                <Text style={styles.linkText}>Central de Ajuda (FAQ)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('FaleConosco')}>
                <Text style={styles.linkText}>Fale Conosco</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contactColumn}>
            <Text style={styles.columnTitle}>Contato Direto</Text>
            <View style={styles.contactList}>
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL('mailto:conectapro@conectapro.com')}
              >
                <Ionicons name="mail-outline" size={16} color="#94a3b8" />
                <Text style={styles.contactText}>conectapro@conectapro.com</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL('https://wa.me/5581955550000')}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#94a3b8" />
                <Text style={styles.contactText}>(81) 95555-0000</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.copyText}>© 2026 ConectaPro LLC - Todos os direitos reservados.</Text>
        <View style={styles.bottomLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('TermosDeUso')}>
            <Text style={styles.bottomLink}>Termos de serviço</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.bottomLink}>Política de privacidade</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#f5f8ff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  container: {
    flexDirection: 'column',
    gap: 30,
    marginBottom: 30,
  },
  brand: {
    width: '100%',
  },
  logo: {
    height: 90,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    marginBottom: 16,
    maxWidth: 300,
  },
  socials: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 40,
  },
  linksColumn: {
    flex: 1,
    minWidth: 140,
  },
  contactColumn: {
    flex: 1,
    minWidth: 160,
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  linksList: {
    gap: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#64748b',
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#64748b',
  },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  copyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  bottomLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  bottomLink: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
