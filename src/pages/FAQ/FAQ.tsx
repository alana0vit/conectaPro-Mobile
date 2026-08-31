import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const faqData = [
  {
    pergunta: "Como encontro um profissional na minha região?",
    resposta: "Basta acessar nosso catálogo na página inicial, buscar pela sua cidade e escolher a categoria do serviço desejado."
  },
  {
    pergunta: "O cadastro é pago?",
    resposta: "Não! O cadastro é totalmente gratuito tanto para clientes quanto para profissionais."
  },
  {
    pergunta: "Como entro em contato com o profissional?",
    resposta: "Após você realizar um pedido no perfil do profissional, ele receberá uma notificação. Se ele aceitar, o WhatsApp dele será liberado para você."
  }
];

export default function FAQ() {
  const [perguntaAtiva, setPerguntaAtiva] = useState<number | null>(null);
  const navigation = useNavigation();

  const togglePergunta = (index: number) => {
    setPerguntaAtiva(perguntaAtiva === index ? null : index);
  };

  return (
    <ScrollView style={styles.faqContainer} contentContainerStyle={styles.contentContainer}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqTitle}>Perguntas Frequentes</Text>
        <Text style={styles.faqSubtitle}>Tire suas dúvidas sobre como o ConectaPro funciona.</Text>
      </View>

      <View style={styles.faqList}>
        {faqData.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.faqItem, perguntaAtiva === index && styles.faqItemAtivo]}
            onPress={() => togglePergunta(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqPergunta}>
              <Text style={styles.faqPerguntaTexto}>{item.pergunta}</Text>
              <Ionicons
                name={perguntaAtiva === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#007bff"
              />
            </View>

            {perguntaAtiva === index && (
              <View style={styles.faqResposta}>
                <Text style={styles.faqRespostaTexto}>{item.resposta}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.faqCta}>
        <Text style={styles.faqCtaText}>
          Ainda tem dúvidas? Mande uma mensagem e lhe retornaremos!
        </Text>
        <TouchableOpacity
          style={styles.btnAction}
          onPress={() => navigation.navigate('FaleConosco' as never)}
        >
          <Text style={styles.btnActionText}>Atendimento ao Cliente</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  faqContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 30,
  },
  faqHeader: {
    marginBottom: 30,
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  faqSubtitle: {
    color: '#555',
    fontSize: 15,
    textAlign: 'center',
  },
  faqList: {
    marginBottom: 10,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    marginBottom: 12,
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
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  faqResposta: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  faqRespostaTexto: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 22,
  },
  faqCta: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  faqCtaText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  btnAction: {
    backgroundColor: '#007bff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 3,
    shadowColor: 'rgba(0, 123, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  btnActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
