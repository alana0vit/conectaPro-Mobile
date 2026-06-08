import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const faqs = [
  { pergunta: 'Como encontro um profissional?', resposta: 'Navegue pela lista de profissionais ou use a busca para filtrar por categoria.' },
  { pergunta: 'É seguro contratar pelo app?', resposta: 'Sim, todos os profissionais são verificados e você pode avaliar o serviço.' },
  { pergunta: 'Como cancelar uma solicitação?', resposta: 'Vá até a dashboard e cancele a solicitação desejada.' },
];

export default function FAQ() {
  const [ativo, setAtivo] = useState<number | null>(null);
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.faqContainer}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqTitle}>Perguntas Frequentes</Text>
        <Text style={styles.faqSubtitle}>Tire suas dúvidas sobre a plataforma</Text>
      </View>
      {faqs.map((faq, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.faqItem, ativo === index && styles.faqItemAtivo]}
          onPress={() => setAtivo(ativo === index ? null : index)}
        >
          <View style={styles.faqPergunta}>
            <Text style={styles.faqPerguntaTexto}>{faq.pergunta}</Text>
            <Text style={styles.faqIcon}>{ativo === index ? '−' : '+'}</Text>
          </View>
          {ativo === index && (
            <View style={styles.faqResposta}>
              <Text>{faq.resposta}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
      <View style={styles.faqCta}>
        <TouchableOpacity
          style={styles.btnAction}
          onPress={() => navigation.navigate('FaleConosco' as never)}
        >
          <Text style={styles.btnActionText}>Fale Conosco</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  faqContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  faqHeader: {
    marginBottom: 25,
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  faqSubtitle: {
    color: '#777',
    marginTop: 5,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  faqItemAtivo: {
    borderColor: '#007bff',
  },
  faqPergunta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqPerguntaTexto: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  faqIcon: {
    fontSize: 22,
    color: '#007bff',
    marginLeft: 10,
  },
  faqResposta: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  faqCta: {
    marginTop: 30,
    alignItems: 'center',
  },
  btnAction: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
  },
  btnActionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
