import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import DetalhesSolicitacao from '../DetalhesSolicitacao/DetalhesSolicitacao';

type DetalhesDemandaRouteProp = RouteProp<RootStackParamList, 'DetalhesDemanda'>;

const formatarMoeda = (valor: any) => {
  if (valor == null || valor === '') return 'Não informado';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarData = (data: any) => {
  if (!data) return 'Não informada';
  const d = new Date(data);
  if (isNaN(d.getTime())) return 'Não informada';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatarEndereco = (addressId: any) => {
  if (!addressId) return null;
  const partes = [addressId.street, addressId.number, addressId.neighborhood, addressId.city].filter(Boolean);
  return partes.length > 0 ? partes.join(', ') : null;
};

const getStatusPill = (status: string) => {
  const s = String(status).toUpperCase();
  if (s === 'ABERTO') return { text: 'Aguardando Resposta', style: styles.pillAberto };
  if (s === 'AGUARDANDO') return { text: 'Em Andamento', style: styles.pillAguardando };
  if (s === 'FECHADO') return { text: 'Concluída', style: styles.pillFechado };
  if (s === 'REJEITADO') return { text: 'Recusada', style: styles.pillRejeitado };
  return { text: s, style: {} };
};

// Função para converter ArrayBuffer para base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

export default function DetalhesDemanda() {
  const route = useRoute<DetalhesDemandaRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { demanda, modo } = route.params;

  const [confirmacao, setConfirmacao] = useState({
    visivel: false,
    novoStatus: null as string | null,
    tituloAcao: '',
  });

  const [imagensBase64, setImagensBase64] = useState<string[]>([]);
  const [carregandoImagens, setCarregandoImagens] = useState(false);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);

  // Baixa as imagens com autenticação
  useEffect(() => {
    const raw = demanda?.imgUrl;
    const nomes = Array.isArray(raw) ? raw.filter(Boolean) : typeof raw === 'string' && raw.trim() ? [raw] : [];
    const fotos = nomes.filter(Boolean);

    if (fotos.length === 0) return;

    const carregarImagens = async () => {
      setCarregandoImagens(true);
      try {
        const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') || '';
        const promessas = fotos.map(async (nomeArquivo: string) => {
          const url = nomeArquivo.startsWith('http') ? nomeArquivo : `${baseUrl}/api/images/${nomeArquivo}`;
          try {
            const response = await api.get(url, { responseType: 'arraybuffer' });
            const base64 = arrayBufferToBase64(response.data);
            const mimeType = response.headers['content-type'] || 'image/jpeg';
            return `data:${mimeType};base64,${base64}`;
          } catch (error) {
            console.error('Erro ao baixar imagem:', error);
            return null;
          }
        });
        const resultados = await Promise.all(promessas);
        setImagensBase64(resultados.filter(Boolean) as string[]);
      } catch (error) {
        console.error('Erro ao carregar imagens:', error);
      } finally {
        setCarregandoImagens(false);
      }
    };

    carregarImagens();
  }, [demanda?.imgUrl]);

  const processarAtualizacaoStatus = async (novoStatus: string) => {
    try {
      await api.patch(`/api/demand/${demanda.id}/status`, { status: novoStatus });
      if (novoStatus === 'AGUARDANDO') Toast.show({ type: 'success', text1: 'Serviço aceito! Dados de contato liberados.' });
      else if (novoStatus === 'FECHADO') Toast.show({ type: 'info', text1: 'Serviço finalizado.' });
      else if (novoStatus === 'REJEITADO') Toast.show({ type: 'error', text1: 'Serviço recusado.' });
      navigation.goBack();
    } catch (error: any) {
      const msgErro = error.response?.data?.message || 'Falha ao atualizar o status do pedido.';
      Toast.show({ type: 'error', text1: msgErro });
    }
  };

  const solicitarConfirmacao = (novoStatus: string, acaoTexto: string) => {
    setConfirmacao({ visivel: true, novoStatus, tituloAcao: acaoTexto });
  };

  const executarAcaoConfirmada = () => {
    if (confirmacao.novoStatus) {
      processarAtualizacaoStatus(confirmacao.novoStatus);
    }
    setConfirmacao({ visivel: false, novoStatus: null, tituloAcao: '' });
  };

  const statusInfo = getStatusPill(demanda.demandStatus);
  const isCliente = modo === 'CLIENTE';
  const isProfissional = modo === 'PROFISSIONAL';

  const endereco = formatarEndereco(demanda?.addressId);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Botão Voltar */}
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#007bff" />
          <Text style={styles.btnVoltarText}>Voltar</Text>
        </TouchableOpacity>

        {/* Título e Status */}
        <Text style={styles.titulo}>{demanda.title}</Text>
        <View style={[styles.pillBase, statusInfo.style]}>
          <Text style={styles.pillText}>{statusInfo.text}</Text>
        </View>

        {/* Badges de informação */}
        <View style={styles.infoBadgesContainer}>
          {demanda?.categoryId?.name && (
            <View style={styles.categoryTag}>
              <Ionicons name="pricetag" size={12} color="#2563eb" />
              <Text style={styles.categoryTagText}>{demanda.categoryId.name}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color="#3b82f6" />
              <Text style={styles.metaText}>{formatarMoeda(demanda?.suggestedValue)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#3b82f6" />
              <Text style={styles.metaText}>{formatarData(demanda?.suggestedDate)}</Text>
            </View>
          </View>

          {endereco && (
            <View style={styles.addressLine}>
              <Ionicons name="location-outline" size={14} color="#3b82f6" />
              <Text style={styles.addressText}>{endereco}</Text>
            </View>
          )}
        </View>

        {/* Pessoa relacionada */}
        {isCliente && demanda.professionalId?.name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              Profissional: {demanda.professionalId.name}
              {demanda.professionalId.phone && ` • ${demanda.professionalId.phone}`}
            </Text>
          </View>
        )}
        {isProfissional && demanda.clientId?.name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              Cliente: {demanda.clientId.name}
              {demanda.clientId.phone && ` • ${demanda.clientId.phone}`}
            </Text>
          </View>
        )}

        {/* Descrição */}
        <Text style={styles.sectionTitle}>Descrição</Text>
        <Text style={styles.descricao}>{demanda.description}</Text>

        {/* Fotos */}
        {carregandoImagens ? (
          <ActivityIndicator color="#0066ff" style={{ marginVertical: 15 }} />
        ) : imagensBase64.length > 0 ? (
          <View style={styles.fotoGaleria}>
            <Text style={styles.fotoGaleriaTitulo}>
              <Ionicons name="images-outline" size={14} color="#0066ff" /> Fotos anexadas ({imagensBase64.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotoScroll}>
              {imagensBase64.map((uri: string, idx: number) => (
                <TouchableOpacity key={idx} onPress={() => setImagemAmpliada(uri)}>
                  <Image source={{ uri }} style={styles.fotoImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Cartão de contato quando AGUARDANDO */}
        {String(demanda.demandStatus).toUpperCase() === 'AGUARDANDO' && (
          <DetalhesSolicitacao demanda={demanda} modo={modo} />
        )}

        {/* Ações */}
        <View style={styles.actionsContainer}>
          {isCliente && String(demanda.demandStatus).toUpperCase() === 'ABERTO' && (
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate('EditarDemanda', { id: demanda.id })}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Editar Esta Solicitação</Text>
            </TouchableOpacity>
          )}
          {isCliente && String(demanda.demandStatus).toUpperCase() === 'REJEITADO' && (
            <TouchableOpacity
              style={styles.btnSuccess}
              onPress={() => navigation.navigate('ListaProf', { reassignDemandId: demanda.id } as any)}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Solicitar a Outro Profissional</Text>
            </TouchableOpacity>
          )}

          {isProfissional && String(demanda.demandStatus).toUpperCase() === 'ABERTO' && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnAccept]}
                onPress={() => solicitarConfirmacao('AGUARDANDO', 'aceitar esta solicitação de serviço')}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.btnText}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnDecline]}
                onPress={() => solicitarConfirmacao('REJEITADO', 'recusar esta solicitação de serviço')}
              >
                <Ionicons name="close" size={18} color="#fff" />
                <Text style={styles.btnText}>Recusar</Text>
              </TouchableOpacity>
            </View>
          )}
          {isProfissional && String(demanda.demandStatus).toUpperCase() === 'AGUARDANDO' && (
            <TouchableOpacity
              style={[styles.btnAction, styles.btnFinish]}
              onPress={() => solicitarConfirmacao('FECHADO', 'finalizar este serviço de vez')}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Finalizar Serviço</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal de imagem ampliada */}
      <Modal visible={!!imagemAmpliada} transparent={false} animationType="fade" onRequestClose={() => setImagemAmpliada(null)}>
        <View style={styles.modalImagemContainer}>
          <TouchableOpacity style={styles.fecharImagemBtn} onPress={() => setImagemAmpliada(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {imagemAmpliada && (
            <Image source={{ uri: imagemAmpliada }} style={styles.imagemAmpliada} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Modal de Confirmação */}
      <Modal visible={confirmacao.visivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Ionicons name="warning" size={40} color="#ffc107" style={{ marginBottom: 10 }} />
            <Text style={styles.confirmTitle}>Confirmar Ação</Text>
            <Text style={styles.confirmText}>
              Você tem certeza de que deseja <Text style={{ fontWeight: '700' }}>{confirmacao.tituloAcao}</Text>? Essa operação alterará o andamento do chamado.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setConfirmacao({ visivel: false, novoStatus: null, tituloAcao: '' })}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={executarAcaoConfirmada}>
                <Text style={styles.btnConfirmText}>Sim, Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  btnVoltar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 6 },
  btnVoltarText: { fontSize: 16, color: '#007bff', fontWeight: '500' },
  titulo: { fontSize: 22, fontWeight: '700', color: '#1a202c', marginBottom: 10 },
  pillBase: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50, alignSelf: 'flex-start', marginBottom: 15 },
  pillAberto: { backgroundColor: '#e6f0ff' },
  pillAguardando: { backgroundColor: '#fff9db' },
  pillFechado: { backgroundColor: '#ebfbee' },
  pillRejeitado: { backgroundColor: '#fff5f5' },
  pillText: { fontSize: 11, fontWeight: '600', color: '#333' },

  infoBadgesContainer: { gap: 8, marginBottom: 15 },
  categoryTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eff6ff',
    paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50, alignSelf: 'flex-start',
  },
  categoryTagText: { fontSize: 11, fontWeight: '700', color: '#2563eb', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  addressLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addressText: { fontSize: 13, color: '#475569', fontWeight: '500', flex: 1 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  infoText: { fontSize: 14, color: '#4a5568' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 5 },
  descricao: {
    fontSize: 14, color: '#2d3748', backgroundColor: '#fff', padding: 15,
    borderRadius: 10, lineHeight: 22, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15,
  },

  fotoGaleria: { marginBottom: 15 },
  fotoGaleriaTitulo: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8 },
  fotoScroll: { marginTop: 4 },
  fotoImage: { width: 200, height: 150, borderRadius: 10, marginRight: 10, backgroundColor: '#f1f5f9' },

  modalImagemContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fecharImagemBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imagemAmpliada: {
    width: '100%',
    height: '80%',
  },

  actionsContainer: { marginTop: 10, gap: 12 },
  btnPrimary: {
    backgroundColor: '#0066ff', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: 14, borderRadius: 8, gap: 8,
  },
  btnSuccess: {
    backgroundColor: '#2b8a3e', flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: 14, borderRadius: 8, gap: 8,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  btnAction: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 8, gap: 8 },
  btnAccept: { backgroundColor: '#10b981' },
  btnDecline: { backgroundColor: '#ef4444' },
  btnFinish: { backgroundColor: '#3b82f6', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,32,44,0.4)', justifyContent: 'center', padding: 20 },
  confirmModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginHorizontal: 20 },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c', marginBottom: 10 },
  confirmText: { fontSize: 14, color: '#4a5568', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel: { flex: 1, borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  btnCancelText: { fontWeight: '600', color: '#475569' },
  btnConfirm: { flex: 1, backgroundColor: '#0066ff', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnConfirmText: { fontWeight: '700', color: '#fff' },
});
