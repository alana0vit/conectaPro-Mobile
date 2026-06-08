import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function HowItWorks() {
  const steps = [
    {
      icon: <FontAwesome5 name="search" size={30} color="#007bff" />,
      number: '1',
      title: 'Busque',
      description: 'Encontre o profissional ideal para sua necessidade.',
    },
    {
      icon: <MaterialIcons name="contact-phone" size={30} color="#007bff" />,
      number: '2',
      title: 'Conecte',
      description: 'Entre em contato diretamente pelo app.',
    },
    {
      icon: <Ionicons name="checkmark-done" size={30} color="#007bff" />,
      number: '3',
      title: 'Resolva',
      description: 'Serviço realizado com qualidade e segurança.',
    },
  ];

  return (
    <View style={styles.howItWorks}>
      <Text style={styles.sectionTitle}>Como funciona</Text>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={styles.stepIconWrapper}>
              {step.icon}
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumber}>{step.number}</Text>
              </View>
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  howItWorks: {
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1a1a2e',
  },
  stepsContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 20,
  },
  stepCard: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 25,
    borderRadius: 12,
  },
  stepIconWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#007bff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 15,
  },
});