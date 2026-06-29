import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  demanda: any;
  modo: 'CLIENTE' | 'PROFISSIONAL';
}

export default function DetalhesSolicitacao({ demanda, modo }: Props) {
  const exibirPessoa = modo === 'CLIENTE' ? demanda?.professionalId : demanda?.clientId;
  const tituloRelacao = modo === 'CLIENTE' ? 'Profissional Designado' : 'Dados do Solicitante';
  const inicialNome = exibirPessoa?.name ? exibirPessoa.name.charAt(0).toUpperCase() : 'U';
  const endereco = demanda?.addressId;

  const abrirWhatsApp = () => {
    if (exibirPessoa?.phone) {
      const numero = exibirPessoa.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${numero}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badgeAndamento}>
          <Text style={styles.badgeAndamentoText}>SESSÃO EM ANDAMENTO</Text>
        </View>
        <Text style={styles.headerTitle}>{tituloRelacao}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.infoPrincipal}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicialNome}</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.nome}>{exibirPessoa?.name || 'Usuário ConectaPro'}</Text>
            <Text style={styles.especialidade}>
              {modo === 'CLIENTE'
                ? demanda?.categoryId?.name || 'Especialista Parceiro'
                : 'Cliente Verificado'}
            </Text>
          </View>
        </View>

        <View style={styles.gridContatos}>
          <View style={styles.itemContato}>
            <Ionicons name="logo-whatsapp" size={18} color="#25d366" />
            <View style={styles.itemContatoTexto}>
              <Text style={styles.itemLabel}>WhatsApp / Telefone</Text>
              <Text style={styles.itemValue}>{exibirPessoa?.phone || 'Contacto não registado'}</Text>
            </View>
          </View>
          <View style={styles.itemContato}>
            <Ionicons name="mail-outline" size={18} color="#3b82f6" />
            <View style={styles.itemContatoTexto}>
              <Text style={styles.itemLabel}>E-mail de Contacto</Text>
              <Text style={styles.itemValue}>{exibirPessoa?.email || 'email@naoinformado.com'}</Text>
            </View>
          </View>
        </View>

        {modo === 'PROFISSIONAL' && endereco && (
          <View style={styles.enderecoServico}>
            <Ionicons name="location-outline" size={18} color="#ef4444" />
            <View style={styles.enderecoTexto}>
              <Text style={styles.itemLabel}>Local do Serviço</Text>
              <Text style={styles.itemValue}>
                {endereco.street || 'Rua não informada'}, {endereco.number || 'S/N'}
                {endereco.neighborhood ? ` - ${endereco.neighborhood}` : ''}
                {endereco.city ? ` - ${endereco.city}` : ''}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Combine os detalhes finais, valores e horários diretamente pelo WhatsApp.
        </Text>
        {exibirPessoa?.phone ? (
          <TouchableOpacity style={styles.btnWhatsapp} onPress={abrirWhatsApp}>
            <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
            <Text style={styles.btnWhatsappText}>Iniciar Conversa</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.btnWhatsapp, styles.btnDisabled]}>
            <Ionicons name="chatbubbles-outline" size={20} color="#94a3b8" />
            <Text style={styles.btnDisabledText}>Sem número disponível</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 15,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  badgeAndamento: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeAndamentoText: { fontSize: 10, fontWeight: '800', color: '#92400e', letterSpacing: 0.5 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  body: { padding: 16 },
  infoPrincipal: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: {
    width: 45,
    height: 45,
    backgroundColor: '#1e293b',
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  infoTextContainer: { flex: 1 },
  nome: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  especialidade: { fontSize: 13, color: '#64748b', marginTop: 2 },
  gridContatos: { gap: 12, marginBottom: 12 },
  itemContato: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  itemContatoTexto: { flex: 1 },
  itemLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemValue: { fontSize: 13, color: '#334155', marginTop: 1 },
  enderecoServico: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
  },
  enderecoTexto: { flex: 1 },
  footer: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 12 },
  btnWhatsapp: {
    flexDirection: 'row',
    backgroundColor: '#25d366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  btnWhatsappText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  btnDisabledText: { color: '#94a3b8', fontWeight: '700', fontSize: 14 },
});
