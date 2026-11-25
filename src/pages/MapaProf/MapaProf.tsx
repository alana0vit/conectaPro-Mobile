import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {View,Text,TouchableOpacity,StyleSheet,ActivityIndicator,Modal,FlatList,Linking,} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { RootStackParamList } from '../../navigation/types';

const GEOAPIFY_KEY = process.env.GEOAPIFY_MAP_KEY || '';

type LocationDTO = {
  addressId: number;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
};

type ProfissionalMapa = {
  id: number;
  name: string;
  photo: string | null;
  rating: number | null;
  verified: boolean | null;
  activePlanName: string | null;
  categories: { id: number; name: string }[];
  distanceKm: number | null;
  locations: LocationDTO[];
};

type Pin = { key: string; prof: ProfissionalMapa; loc: LocationDTO };

const RAIO_OPCOES = [5, 10, 20, 50];

const ESTRELAS_OPCOES = [
  { label: '⭐ Todas as Notas', value: 'TODOS' },
  { label: '⭐ 5 estrelas', value: '5' },
  { label: '⭐ 4.0 ou mais', value: '4PLUS' },
  { label: '⭐ 3.0 ou mais', value: '3PLUS' },
];

type Picker = 'categoria' | 'estrelas' | 'raio' | null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const formatarDistancia = (km: number | null | undefined) => {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
};

const obterLocalizacao = async () => {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    const err: any = new Error('permissao');
    err.canAskAgain = perm.canAskAgain;
    throw err;
  }
  if (!(await Location.hasServicesEnabledAsync())) throw new Error('gps_desligado');

  const ultima = await Location.getLastKnownPositionAsync();
  try {
    const atual = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
    ]);
    return { latitude: atual.coords.latitude, longitude: atual.coords.longitude };
  } catch (e) {
    if (ultima) return { latitude: ultima.coords.latitude, longitude: ultima.coords.longitude };
    throw e;
  }
};

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .bubble {
    position: relative; width: 48px; height: 48px;
    border-radius: 50%; background: #fff; box-sizing: border-box;
    border: 3px solid #0066ff;                       
    box-shadow: 0 3px 8px rgba(0,0,0,.35);
    transition: transform .15s; transform-origin: 50% 100%;
  }
  .bubble::after {
    content: ''; position: absolute; left: 50%; bottom: -11px;
    transform: translateX(-50%);
    border-left: 8px solid transparent; border-right: 8px solid transparent;
    border-top: 11px solid #0066ff;                  
  }
  .bubble .img {
    width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: #0066ff; color: #fff; font: 700 18px sans-serif;
  }
  .bubble .img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .bubble.sel { border-color: #e11d48; transform: scale(1.25); z-index: 1000; }
  .bubble.sel::after { border-top-color: #e11d48; }
</style>
</head>
<body>
<div id="map"></div>

<script>
  var KEY = ${JSON.stringify(GEOAPIFY_KEY)};
  var map = L.map('map', { zoomControl: false }).setView([-8.0476, -34.877], 12); // Recife
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=' + KEY, {
    maxZoom: 19,
    attribution: 'Powered by <a href="https://www.geoapify.com/">Geoapify</a> | © OpenStreetMap'
  }).addTo(map);

  var layer = L.layerGroup().addTo(map); 
  var selKey = null;                     
  var lastView = '';                     

  function send(obj) { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }
  map.on('click', function () { send({ type: 'map' }); });

  window.renderData = function (p) {
    layer.clearLayers();
    var pts = [];
    if (p.origin) {
      var o = [p.origin.latitude, p.origin.longitude];
      L.circleMarker(o, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(layer);
      if (p.radiusKm) {
        L.circle(o, { radius: p.radiusKm * 1000, color: '#0066ff', weight: 1, fillOpacity: 0.04 }).addTo(layer);
      }
      pts.push(o);
    }
    p.pins.forEach(function (pin) {
      var dentro = pin.photo ? '<img src="' + pin.photo + '" />' : '<span>' + pin.initial + '</span>';
      var icon = L.divIcon({
        className: '',
        html: '<div class="bubble" id="pin-' + pin.key + '"><div class="img">' + dentro + '</div></div>',
        iconSize: [48, 59],   
        iconAnchor: [24, 59]  
      });
      L.marker([pin.latitude, pin.longitude], { icon: icon })
        .on('click', function () { send({ type: 'pin', key: pin.key }); })
        .addTo(layer);
      pts.push([pin.latitude, pin.longitude]);
    });
    var view = JSON.stringify(pts);
    if (view !== lastView) {
      lastView = view;
      if (pts.length > 1) map.fitBounds(pts, { paddingTopLeft: [50, 90], paddingBottomRight: [50, 90], maxZoom: 16 });
      else if (pts.length === 1) map.setView(pts[0], 14);
    }
    window.selectPin(selKey);
  };
  window.selectPin = function (key) {
    selKey = key;
    document.querySelectorAll('.bubble').forEach(function (e) { e.classList.remove('sel'); });
    var el = key && document.getElementById('pin-' + key);
    if (el) el.classList.add('sel');
  };
  window.centerOn = function (lat, lng, zoom) {
    map.setView([lat, lng], zoom || 15, { animate: true });
  };
  send({ type: 'ready' });
</script>
</body>
</html>`;

export default function MapaProf() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const webRef = useRef<WebView | null>(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  const [origem, setOrigem] = useState<{ latitude: number; longitude: number } | null>(null);
  const [raioKm, setRaioKm] = useState(20);
  const [categorias, setCategorias] = useState<{ id: number; name: string }[]>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [filtroEstrelas, setFiltroEstrelas] = useState('TODOS');
  const [picker, setPicker] = useState<Picker>(null);
  const [profissionais, setProfissionais] = useState<ProfissionalMapa[]>([]);
  const [selecionado, setSelecionado] = useState<Pin | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotos, setFotos] = useState<Record<number, string | null>>({});
  const fotosCache = useRef<Record<number, string | null>>({});
  const [modalAvaliacoes, setModalAvaliacoes] = useState<{ id: number; nome: string } | null>(null);
  const [avaliacoesData, setAvaliacoesData] = useState<any[]>([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const centralizarPendente = useRef(false);

  const irParaMinhaLocalizacao = async (centralizar = true) => {
    try {
      setLocalizando(true);
      const coords = await obterLocalizacao();
      centralizarPendente.current = centralizar;
      setOrigem(coords);
    } catch (e: any) {
      if (e.message === 'permissao') {
        Toast.show({ type: 'error', text1: 'Permita o acesso a localização nas configurações.' });
        if (e.canAskAgain === false) Linking.openSettings();
      } else if (e.message === 'gps_desligado') {
        Toast.show({ type: 'error', text1: 'Ative o GPS do celular.' });
      } else {
        Toast.show({ type: 'error', text1: 'Não foi possível obter sua localização. Tente de novo.' });
      }
    } finally {
      setLocalizando(false);
    }
  };
  useEffect(() => {
    irParaMinhaLocalizacao(false);
  }, []);

  useEffect(() => {
    api
      .get('/api/category')
      .then((res) => setCategorias(res.data || []))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async () => {
    try {
      setLoading(true);
      setSelecionado(null);
      const params: Record<string, any> = {};
      if (categoriaId) params.categoryId = categoriaId;
      if (origem) {
        params.latitude = origem.latitude;
        params.longitude = origem.longitude;
        params.radiusKm = raioKm;
      }
      const res = await api.get<ProfissionalMapa[]>('/api/user/search/map', { params });
      setProfissionais(res.data || []);
    } catch (e) {
      console.error('Erro ao buscar profissionais:', e);
      Toast.show({ type: 'error', text1: 'Erro ao carregar profissionais.' });
    } finally {
      setLoading(false);
    }
  }, [origem, raioKm, categoriaId]);

  useEffect(() => {
    buscar();
  }, [buscar]);
  const profissionaisFiltrados = useMemo(
    () =>
      profissionais.filter((p) => {
        if (filtroEstrelas === 'TODOS') return true;
        const nota = p.rating ?? 0;
        if (filtroEstrelas === '5') return nota >= 5.0;
        if (filtroEstrelas === '4PLUS') return nota >= 4.0;
        if (filtroEstrelas === '3PLUS') return nota >= 3.0;
        return true;
      }),
    [profissionais, filtroEstrelas]
  );
  const pins: Pin[] = useMemo(
    () =>
      profissionaisFiltrados.flatMap((prof) =>
        prof.locations
          .filter((l) => l.latitude != null && l.longitude != null)
          .map((loc) => ({ key: `${prof.id}-${loc.addressId}`, prof, loc }))
      ),
    [profissionaisFiltrados]
  );
  useEffect(() => {
    if (selecionado && !pins.some((p) => p.key === selecionado.key)) setSelecionado(null);
  }, [pins, selecionado]);
  useEffect(() => {
    const baseUrl = api.defaults.baseURL?.replace(/\/$/, '') || '';
    const faltando = profissionais.filter(
      (p) => p.photo && fotosCache.current[p.id] === undefined
    );
    if (faltando.length === 0) return;
    let cancelado = false;
    (async () => {
      await Promise.all(
        faltando.map(async (p) => {
          try {
            const url = p.photo!.startsWith('http') ? p.photo! : `${baseUrl}/api/images/${p.photo}`;
            const res = await api.get(url, { responseType: 'arraybuffer' });
            const mime = res.headers['content-type'] || 'image/jpeg';
            fotosCache.current[p.id] = `data:${mime};base64,${arrayBufferToBase64(res.data)}`;
          } catch {
            fotosCache.current[p.id] = null;
          }
        })
      );
      if (!cancelado) setFotos({ ...fotosCache.current });
    })();
    return () => {
      cancelado = true;
    };
  }, [profissionais]);
  useEffect(() => {
    if (!mapaPronto) return;
    const payload = {
      origin: origem,
      radiusKm: origem ? raioKm : null,
      pins: pins.map((p) => ({
        key: p.key,
        latitude: p.loc.latitude,
        longitude: p.loc.longitude,
        photo: fotos[p.prof.id] ?? null,
        initial: (p.prof.name || '?').trim().charAt(0).toUpperCase(),
      })),
    };
    webRef.current?.injectJavaScript(`window.renderData(${JSON.stringify(payload)}); true;`);
  }, [mapaPronto, pins, origem, raioKm, fotos]);
  useEffect(() => {
    if (!mapaPronto || !origem || !centralizarPendente.current) return;
    centralizarPendente.current = false;
    webRef.current?.injectJavaScript(
      `window.centerOn(${origem.latitude}, ${origem.longitude}, 14); true;`
    );
  }, [origem, mapaPronto]);

  useEffect(() => {
    if (!mapaPronto) return;
    webRef.current?.injectJavaScript(
      `window.selectPin(${JSON.stringify(selecionado?.key ?? null)}); true;`
    );
  }, [selecionado, mapaPronto]);

  const aoReceberMensagem = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') setMapaPronto(true);
      else if (msg.type === 'pin') setSelecionado(pins.find((p) => p.key === msg.key) ?? null);
      else if (msg.type === 'map') setSelecionado(null);
    } catch {}
  };

  const abrirAvaliacoes = async (id: number, nome: string) => {
    setModalAvaliacoes({ id, nome });
    setCarregandoAvaliacoes(true);
    try {
      const res = await api.get(`/api/rating/user/${id}`);
      setAvaliacoesData(res.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar avaliações.' });
      setAvaliacoesData([]);
    } finally {
      setCarregandoAvaliacoes(false);
    }
  };

  const nomeCategoria = categoriaId
    ? categorias.find((c) => c.id === categoriaId)?.name || 'Categoria'
    : 'Todas categorias';
  const nomeEstrelas =
    ESTRELAS_OPCOES.find((o) => o.value === filtroEstrelas)?.label || 'Estrelas';

  return (
    <View style={styles.pagina}>
      <View style={styles.mapaArea}>
        <WebView
          ref={webRef}
          style={StyleSheet.absoluteFill}
          originWhitelist={['*']}
          source={{ html: HTML, baseUrl: 'https://localhost' }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={aoReceberMensagem}
        />
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#007bff" />
          <Text style={styles.btnVoltarText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnLocalizar}
          onPress={() => irParaMinhaLocalizacao(true)}
          disabled={localizando}
        >
          {localizando ? (
            <ActivityIndicator size="small" color="#0066ff" />
          ) : (
            <Ionicons name="locate" size={22} color={origem ? '#0066ff' : '#999'} />
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color="#0066ff" />
          </View>
        )}

        {!loading && pins.length === 0 && (
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>Nenhum profissional encontrado nessa área.</Text>
          </View>
        )}
        {selecionado && (
          <View style={styles.cartao}>
            <View style={styles.cartaoTopo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome} numberOfLines={1}>
                  {selecionado.prof.name}
                  {selecionado.prof.verified ? '  ✔' : ''}
                </Text>
                {selecionado.prof.categories.length > 0 && (
                  <Text style={styles.sub} numberOfLines={1}>
                    {selecionado.prof.categories.map((c) => c.name).join(' • ')}
                  </Text>
                )}
                <Text style={styles.sub} numberOfLines={1}>
                  {[selecionado.loc.neighborhood, selecionado.loc.city].filter(Boolean).join(', ')}
                </Text>
              </View>
              <View style={styles.distanciaBox}>
                <Ionicons name="navigate" size={14} color="#0066ff" />
                <Text style={styles.distancia}>
                  {formatarDistancia(selecionado.loc.distanceKm) ?? '—'}
                </Text>
              </View>
            </View>

            <View style={styles.avaliacaoLinha}>
              <View style={styles.avaliacao}>
                {selecionado.prof.rating != null ? (
                  <>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.nota}>{selecionado.prof.rating.toFixed(1)}</Text>
                  </>
                ) : (
                  <Text style={styles.sub}>Sem avaliação</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.btnVerAvaliacoes}
                onPress={() => abrirAvaliacoes(selecionado.prof.id, selecionado.prof.name)}
              >
                <Ionicons name="chatbubbles-outline" size={14} color="#3b82f6" />
                <Text style={styles.btnVerAvaliacoesText}>Ver avaliações</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.btnPrim}
              onPress={() => navigation.navigate('SolicServico', { profissionalId: selecionado.prof.id })}
            >
              <Text style={styles.btnPrimTexto}>Solicitar Serviço</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.abaFiltros}>
        <Text style={styles.abaTitulo}>
          {loading ? 'Buscando...' : `${pins.length} ${pins.length === 1 ? 'profissional' : 'profissionais'} na sua area`}
        </Text>
        <View style={styles.filtrosLinha}>
          <TouchableOpacity style={styles.selectFiltro} onPress={() => setPicker('categoria')}>
            <Text style={styles.selectFiltroText} numberOfLines={1}>{nomeCategoria}</Text>
            <Ionicons name="chevron-down" size={14} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.selectFiltro} onPress={() => setPicker('estrelas')}>
            <Text style={styles.selectFiltroText} numberOfLines={1}>{nomeEstrelas}</Text>
            <Ionicons name="chevron-down" size={14} color="#666" />
          </TouchableOpacity>

          {origem && (
            <TouchableOpacity style={styles.selectFiltroSmall} onPress={() => setPicker('raio')}>
              <Text style={styles.selectFiltroTextSmall}>{raioKm} km</Text>
              <Ionicons name="chevron-down" size={12} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Modal visible={picker === 'categoria'} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <FlatList
              data={[{ id: 0, name: 'Todas categorias' }, ...categorias]}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => {
                const ativo = (categoriaId ?? 0) === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, ativo && styles.modalItemAtivo]}
                    onPress={() => {
                      setCategoriaId(item.id === 0 ? null : item.id);
                      setPicker(null);
                    }}
                  >
                    <Text style={[styles.modalItemText, ativo && { color: '#fff' }]}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setPicker(null)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={picker === 'estrelas'} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por Avaliação</Text>
            {ESTRELAS_OPCOES.map((op) => (
              <TouchableOpacity
                key={op.value}
                style={[styles.modalItem, filtroEstrelas === op.value && styles.modalItemAtivo]}
                onPress={() => {
                  setFiltroEstrelas(op.value);
                  setPicker(null);
                }}
              >
                <Text style={[styles.modalItemText, filtroEstrelas === op.value && { color: '#fff' }]}>
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setPicker(null)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={picker === 'raio'} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Raio de Busca</Text>
            {RAIO_OPCOES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.modalItem, raioKm === r && styles.modalItemAtivo]}
                onPress={() => {
                  setRaioKm(r);
                  setPicker(null);
                }}
              >
                <Text style={[styles.modalItemText, raioKm === r && { color: '#fff' }]}>{r} km</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setPicker(null)}>
              <Text style={{ color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!modalAvaliacoes}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAvaliacoes(null)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={styles.avaliacoesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                Avaliações de {modalAvaliacoes?.nome}
              </Text>
              <TouchableOpacity onPress={() => setModalAvaliacoes(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {carregandoAvaliacoes ? (
              <ActivityIndicator size="large" color="#0066ff" style={{ marginVertical: 20 }} />
            ) : avaliacoesData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#666', marginVertical: 20 }}>
                Nenhuma avaliação disponível.
              </Text>
            ) : (
              <FlatList
                data={avaliacoesData}
                keyExtractor={(_, idx) => idx.toString()}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <View style={styles.avaliacaoItem}>
                    <View style={styles.avaliacaoItemHeader}>
                      <Ionicons name="person-circle-outline" size={18} color="#333" />
                      <Text style={styles.avaliacaoItemAutor}>
                        {item.anonymous ? 'Anônimo' : item.evaluatingPerson?.name || 'Cliente'}
                      </Text>
                      <View style={styles.avaliacaoItemEstrelas}>
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Ionicons
                            key={st}
                            name="star"
                            size={14}
                            color={st <= item.points ? '#ffcc00' : '#ccc'}
                          />
                        ))}
                      </View>
                    </View>
                    {item.description ? (
                      <Text style={styles.avaliacaoItemDesc}>{item.description}</Text>
                    ) : null}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: '#fff' },
  mapaArea: { flex: 1 },
  btnVoltar: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  btnVoltarText: { fontSize: 15, color: '#007bff', fontWeight: '500' },

  btnLocalizar: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  loading: {
    position: 'absolute',
    top: 50,
    right: 72,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    elevation: 4,
  },
  vazio: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
  },
  vazioTexto: { color: '#666', fontSize: 14 },
  abaFiltros: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  abaTitulo: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 10 },
  filtrosLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 6,
    flex: 1,
    minWidth: 100,
    justifyContent: 'space-between',
  },
  selectFiltroText: { fontSize: 13, color: '#333', flexShrink: 1 },
  selectFiltroSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 4,
  },
  selectFiltroTextSmall: { fontSize: 13, color: '#333' },
  cartao: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cartaoTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nome: { fontSize: 17, fontWeight: '700', color: '#111' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  distanciaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  distancia: { color: '#0066ff', fontWeight: '700', fontSize: 13 },
  avaliacaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  avaliacao: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nota: { fontWeight: '700', fontSize: 15, color: '#111' },
  btnVerAvaliacoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  btnVerAvaliacoesText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  btnPrim: { paddingVertical: 12, borderRadius: 50, backgroundColor: '#0066ff', alignItems: 'center' },
  btnPrimTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalItem: { padding: 14, borderRadius: 10, marginBottom: 6, backgroundColor: '#f8f9fa' },
  modalItemAtivo: { backgroundColor: '#0066ff' },
  modalItemText: { fontSize: 15, color: '#333', textAlign: 'center' },
  btnFecharModal: { alignItems: 'center', padding: 14, marginTop: 6 },
  avaliacoesModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 },
  avaliacaoItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avaliacaoItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avaliacaoItemAutor: { fontWeight: '600', fontSize: 13, color: '#333', flex: 1 },
  avaliacaoItemEstrelas: { flexDirection: 'row', gap: 2 },
  avaliacaoItemDesc: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 18 },
});