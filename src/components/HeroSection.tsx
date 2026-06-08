import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import banner from '../../assets/banner.png';

interface HeroSectionProps {
  onScrollToHowItWorks?: () => void;
}

export default function HeroSection({ onScrollToHowItWorks }: HeroSectionProps) {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>
          Conectando você aos{' '}
          <Text style={styles.highlightText}>melhores profissionais</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Encontre o profissional ideal para o seu serviço em poucos cliques.
        </Text>
        <TouchableOpacity style={styles.btnHowItWorks} onPress={onScrollToHowItWorks}>
          <Text style={styles.btnText}>Como funciona</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.heroImageContainer}>
        <Image source={banner} style={styles.heroMainImg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a2e',
  },
  highlightText: {
    color: '#007bff',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  btnHowItWorks: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroImageContainer: {
    width: '100%',
    height: 200,
  },
  heroMainImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
