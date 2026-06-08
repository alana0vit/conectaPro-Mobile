import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TermosDeUso() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.paginaTermos}>
      <View style={styles.cartaoTermos}>
        <View style={styles.cabecalhoCartao}>
          <Text style={styles.titulo}>Termos de Uso</Text>
          <Text style={styles.atualizacao}>Última atualização: 01/01/2025</Text>
        </View>
        <View style={styles.conteudoTextoTermos}>
          <Text style={styles.paragrafo}>
            Bem-vindo ao conectaPRO. Ao utilizar nossa plataforma, você concorda com os seguintes termos...
          </Text>
          <Text style={styles.subtitulo}>1. Aceitação dos Termos</Text>
          <Text style={styles.paragrafo}>Ao acessar ou usar o serviço, você concorda em cumprir estes termos...</Text>
          <Text style={styles.subtitulo}>2. Cadastro</Text>
          <Text style={styles.paragrafo}>Para utilizar os serviços, é necessário criar uma conta...</Text>
        </View>
        <View style={styles.containerBotaoTermos}>
          <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
            <Text style={styles.btnVoltarTexto}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  paginaTermos: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  cartaoTermos: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
  },
  cabecalhoCartao: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  atualizacao: {
    color: '#999',
    marginTop: 5,
  },
  conteudoTextoTermos: {
    marginBottom: 30,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  paragrafo: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 10,
  },
  containerBotaoTermos: {
    alignItems: 'center',
  },
  btnVoltar: {
    backgroundColor: '#007bff',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 30,
  },
  btnVoltarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
