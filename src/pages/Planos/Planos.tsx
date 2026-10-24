import React from "react";
import { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/api";
import { getUserId, getUserType } from "../../services/auth";
import { Toast } from "react-native-toast-message/lib/src/Toast";

export default function Planos() {
  const navigation = useNavigation<any>();
  const [planos, setPlanos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [contratando, setContratando] = useState<number | null>(null);
  const [pagamento, setPagamento] = useState<any>(null);
  const [planoEscolhido, setPlanoEscolhido] = useState<any>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    api
      .get("/api/subscriptions/plans")
      .then((res) => setPlanos(Array.isArray(res.data) ? res.data : []))
      .catch(() =>
        Toast.show({
          type: "error",
          text1: "Não foi possível carregar os planos.",
        }),
      )
      .finally(() => setCarregando(false));
  }, []);

  const planoPorNome = (nome: string) =>
    planos.find((p: any) => String(p.name).toLowerCase() === nome);

  const contratar = async (plan: any) => {
    if (!plan) return;

    const userId = await getUserId();
    const userType = await getUserType();

    if (!userId) {
      navigation.navigate("Login");
      return;
    }
    if (userType !== "PROFESSIONAL") {
      Toast.show({
        type: "info",
        text1: "Os planos de verificação estão disponíveis para profissionais.",
      });
      return;
    }
    try {
      setContratando(plan.id);
      const res = await api.post(
        `/api/subscriptions/professional/${userId}/plan/${plan.id}/checkout`,
      );
      const payment = res.data?.payment;
      if (!payment?.id) throw new Error("Checkout não retornado.");
      setPlanoEscolhido(plan);
      setPagamento(payment);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Não foi possível iniciar a contratação.",
      });
    } finally {
      setContratando(null);
    }
  };

  const fecharModal = () => {
    if (processando) return;
    setPagamento(null);
    setPlanoEscolhido(null);
  };

  const responderPagamento = async (acao: "aprovar" | "recusar") => {
    if (!pagamento) return;
    try {
      setProcessando(true);
      await api.post(`/api/payments/${pagamento.id}/${acao}`);
      setProcessando(false);
      setPagamento(null);
      setPlanoEscolhido(null);
      if (acao === "aprovar") {
        Toast.show({ type: "success", text1: "Plano contratado com sucesso!" });
        navigation.navigate("DashboardProfissional");
      } else {
        Toast.show({ type: "info", text1: "Pagamento recusado." });
      }
    } catch (error) {
      setProcessando(false);
      Toast.show({
        type: "error",
        text1: "Não foi possível concluir o pagamento.",
      });
    }
  };

  const valorModal = () => {
    const valor = Number(pagamento?.amount ?? planoEscolhido?.price ?? 0);
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={20} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Planos</Text>
      </View>
      <View>
        <View style={styles.body}>
          <View style={styles.info}>
            <Ionicons name="checkmark-circle" size={40} color={"#3b82f6"} />
            <View style={{ flexDirection: "column", gap: 5 }}>
              <Text
                style={{ fontSize: 20, fontWeight: "bold", color: "#2979f8" }}
              >
                Escolha seu plano profissional
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", width: 280 }}>
                Tenha o selo de verificad, mais prioridade na busca e condicoes
                diferentes de taxa por plano
              </Text>
            </View>
          </View>
          <View style={styles.cards}>
            <View style={styles.headerCard}>
              <View style={styles.image}>
                <Ionicons name="diamond" size={30} color={"#3b82f6"} />
              </View>
              <View>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "#3b82f6" }}
                >
                  Bronze
                </Text>
                <Text style={{ fontSize: 13, color: "#6b7280" }}>
                  Selo de verificado e prioridade basica na busca
                </Text>
              </View>
            </View>
            <View style={styles.bodyCard}>
              <View style={{ gap: 5 }}>
                <Text style={styles.textH}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={"#3b82f6"}
                  />{" "}
                  Selo verificado
                </Text>
                <Text style={styles.textH}>
                  <Ionicons name="arrow-up" size={20} color={"#3b82f6"} />{" "}
                  Prioridade 1 na busca
                </Text>
                <Text style={styles.textH}>
                  <Ionicons name="cash" size={20} color={"#3b82f6"} /> Taxa nas
                  demandas: 10%
                </Text>
              </View>
              <View style={{ alignItems: "center", gap: 5 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                    R$ 19,90
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>/mês</Text>
                </View>
                <TouchableOpacity
                  style={styles.button}
                  disabled={contratando !== null}
                  onPress={() => contratar(planoPorNome("bronze"))}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Contratar plano
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.cardSilver}>
            <View style={styles.headerCard}>
              <View style={styles.image}>
                <Ionicons name="diamond" size={30} color={"#6b7280"} />
              </View>
              <View>
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", color: "#6b7280" }}
                >
                  Prata
                </Text>
                <Text style={{ fontSize: 13, color: "#6b7280" }}>
                  Mais prioridade na busca e taxa reduzida
                </Text>
              </View>
            </View>
            <View style={styles.bodyCard}>
              <View style={{ gap: 5 }}>
                <Text style={styles.textH}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={"#6b7280"}
                  />{" "}
                  Selo verificado Prata
                </Text>
                <Text style={styles.textH}>
                  <Ionicons name="arrow-up" size={20} color={"#6b7280"} />{" "}
                  Prioridade 2 na busca
                </Text>
                <Text style={styles.textH}>
                  <Ionicons name="cash" size={20} color={"#6b7280"} /> Taxa nas
                  demandas: 5%
                </Text>
              </View>
              <View style={{ alignItems: "center", gap: 5 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                    R$ 39,90
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>/mês</Text>
                </View>
                <TouchableOpacity
                  style={styles.buttonSilver}
                  disabled={contratando !== null}
                  onPress={() => contratar(planoPorNome("prata"))}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Contratar plano
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.cardGold}>
            <View style={styles.headerCard}>
              <View style={styles.image}>
                <Ionicons name="diamond" size={30} color={"#f59e0b"} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>Ouro</Text>
                <Text style={{ fontSize: 13, color: "#6b7280", width: 250 }}>
                  Prioridade maxima na busca e taxa de plataforma zerada
                </Text>
              </View>
            </View>
            <View style={styles.bodyCard}>
              <View style={{ gap: 5 }}>
                <Text style={styles.textH}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={"#f59e0b"}
                  />{" "}
                  Selo verificado Ouro
                </Text>
                <Text style={styles.textH}>
                  <Ionicons name="arrow-up" size={20} color={"#f59e0b"} />{" "}
                  Prioridade 3 na busca
                </Text>
                <Text style={styles.textH}>
                  <Ionicons name="cash" size={20} color={"#f59e0b"} /> Taxa nas
                  demandas: 0%
                </Text>
              </View>
              <View style={{ alignItems: "center", gap: 5 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                    R$ 69,90
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>/mês</Text>
                </View>
                <TouchableOpacity
                  style={styles.buttonGold}
                  disabled={contratando !== null}
                  onPress={() => contratar(planoPorNome("ouro"))}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Contratar plano
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={!!pagamento}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.overlay}>
          <View style={styles.box}>
            <Text style={styles.badge}>
              MODO SIMULADO — nenhum dinheiro real será cobrado
            </Text>
            <Text style={styles.title}>Confirmar contratação</Text>
            <Text style={styles.plano}>Plano {planoEscolhido?.name}</Text>
            <Text style={styles.valor}>{valorModal()}</Text>
            <Text style={styles.pergunta}>
              Deseja aprovar o pagamento deste plano?
            </Text>
            <TouchableOpacity
              style={[styles.botao, styles.aprovar]}
              disabled={processando}
              onPress={() => responderPagamento("aprovar")}
            >
              <Text style={styles.botaoTexto}>
                {processando ? "Processando..." : "Aprovar pagamento"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botao, styles.recusar]}
              disabled={processando}
              onPress={() => responderPagamento("recusar")}
            >
              <Text style={styles.botaoTexto}>Recusar pagamento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    gap: 10,
  },
  body: {
    flex: 1,
    marginTop: 20,
  },
  info: {
    height: 80,
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#a8c8fd",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cards: {
    height: 180,
    marginHorizontal: 20,
    marginTop: 22,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#3b82f6",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 15,
  },
  cardSilver: {
    height: 180,
    marginHorizontal: 20,
    marginTop: 22,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#6b7280",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 15,
  },
  cardGold: {
    height: 180,
    marginHorizontal: 20,
    marginTop: 22,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#f59e0b",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 15,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  bodyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  button: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3b82f6",
    borderRadius: 5,
  },
  buttonGold: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f59e0b",
    borderRadius: 5,
  },
  buttonSilver: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#6b7280",
    borderRadius: 5,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 100,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  textH: {
    fontSize: 14,
    fontWeight: "medium",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  box: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 12,
    textAlign: "center",
  },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 6 },
  plano: { fontSize: 16, color: "#6b7280" },
  valor: { fontSize: 32, fontWeight: "bold", marginVertical: 6 },
  pergunta: { fontSize: 14, color: "#6b7280", marginBottom: 6 },
  botao: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  aprovar: { backgroundColor: "#16a34a" },
  recusar: { backgroundColor: "#dc2626" },
  botaoTexto: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
