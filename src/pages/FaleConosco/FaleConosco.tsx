import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import imgContato from '../../../assets/imgfaleconosco.jpg';

export default function FaleConosco() {
  const [form, setForm] = useState({ nome: '', email: '', mensagem: '' });

  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.mensagem) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos.' });
      return;
    }
    try {
      await api.post('/fale-conosco', form);
      Toast.show({ type: 'success', text1: 'Mensagem enviada com sucesso!' });
      setForm({ nome: '', email: '', mensagem: '' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao enviar mensagem.' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.paginaFaleConosco}>
      <View style={styles.cartaoFaleConosco}>
        <View style={styles.secaoVisualContato}>
          <Text style={styles.etiquetaContato}>Fale Conosco</Text>
          <Text style={styles.tituloContato}>Estamos aqui para ajudar</Text>
          <Text style={styles.textoContato}>
            Envie sua dúvida, sugestão ou reclamação. Responderemos o mais breve possível.
          </Text>
          <Image source={imgContato} style={styles.imagemContato} />
        </View>
        <View style={styles.secaoFormularioContato}>
          <View style={styles.campoEntradaContato}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={form.nome}
              onChangeText={(t) => setForm({ ...form, nome: t })}
            />
          </View>
          <View style={styles.campoEntradaContato}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              keyboardType="email-address"
            />
          </View>
          <View style={styles.campoEntradaContato}>
            <Text style={styles.label}>Mensagem</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={5}
              value={form.mensagem}
              onChangeText={(t) => setForm({ ...form, mensagem: t })}
            />
          </View>
          <TouchableOpacity style={styles.botaoContato} onPress={handleSubmit}>
            <Text style={styles.botaoTexto}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  paginaFaleConosco: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  cartaoFaleConosco: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  secaoVisualContato: {
    padding: 20,
    alignItems: 'center',
  },
  etiquetaContato: {
    backgroundColor: '#e6f0ff',
    color: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tituloContato: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  textoContato: {
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 20,
  },
  imagemContato: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
  },
  secaoFormularioContato: {
    padding: 20,
  },
  campoEntradaContato: {
    marginBottom: 15,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  botaoContato: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
