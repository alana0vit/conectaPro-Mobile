import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function AppPromo() {
  const categorias = [
    { nome: 'Eletricista', icone: <Ionicons name="flash" size={28} color="#007bff" /> },
    { nome: 'Encanador', icone: <FontAwesome5 name="wrench" size={24} color="#007bff" /> },
    { nome: 'Diarista', icone: <MaterialIcons name="cleaning-services" size={28} color="#007bff" /> },
    { nome: 'Pintor', icone: <FontAwesome5 name="paint-roller" size={24} color="#007bff" /> },
    { nome: 'Fretes', icone: <FontAwesome5 name="truck" size={24} color="#007bff" /> },
    { nome: 'Montador', icone: <FontAwesome5 name="hammer" size={24} color="#007bff" /> },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Em alta no aplicativo</Text>
      <Text style={styles.subtitulo}>Veja quais são os profissionais mais procurados por aqui.</Text>
      
      <View style={styles.grid}>
        {categorias.map((cat, index) => (
          <TouchableOpacity key={index} style={styles.card}>
            <View style={styles.iconCircle}>
              {cat.icone}
            </View>
            <Text style={styles.cardText}>{cat.nome}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
//a
const styles = StyleSheet.create({
  container: {
    paddingVertical: 45,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 35,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    width: '100%',
  },
  card: {
    width: '45%',
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f3f5',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});