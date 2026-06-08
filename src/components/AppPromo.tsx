import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import appMockup from '../../assets/imgdash.png'; // placeholder

export default function AppPromo() {
  return (
    <View style={styles.appPromo}>
      <View style={styles.promoImage}>
        <Image source={appMockup} style={styles.mobilePlaceholder} />
      </View>
      <View style={styles.promoContent}>
        <Text style={styles.promoTitle}>Baixe nosso aplicativo</Text>
        <Text style={styles.promoDescription}>
          Tenha acesso rápido a profissionais de confiança onde estiver.
        </Text>
        <View style={styles.storeButtons}>
          <TouchableOpacity style={styles.storeBtn}>
            <FontAwesome5 name="google-play" size={20} color="#fff" />
            <Text style={styles.storeBtnText}>Google Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.storeBtn}>
            <FontAwesome5 name="apple" size={20} color="#fff" />
            <Text style={styles.storeBtnText}>App Store</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appPromo: {
    flexDirection: 'row',
    padding: 30,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  promoImage: {
    flex: 1,
    minWidth: 150,
  },
  mobilePlaceholder: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
  },
  promoContent: {
    flex: 1,
    paddingLeft: 20,
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  promoDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  storeBtn: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
  },
  storeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
