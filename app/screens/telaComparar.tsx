import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");

// --- Funções Auxiliares ---

const getDynamicColors = (value1: number, value2: number, lowerIsBetter = true) => {
  if (value1 === value2) {
    return { color1: "#FFC107", color2: "#FFC107" }; // Amarelo (Empate)
  }
  if (lowerIsBetter) {
    return value1 < value2
      ? { color1: "#4CAF50", color2: "#F44336" } // Verde (Melhor), Vermelho (Pior)
      : { color1: "#F44336", color2: "#4CAF50" };
  }
  return value1 > value2
    ? { color1: "#4CAF50", color2: "#F44336" }
    : { color1: "#F44336", color2: "#4CAF50" };
};

// --- Componentes ---

const ImagemVeiculo = ({ url }: { url: string }) => {
  const [erro, setErro] = useState(false);
  const imagemUri =
    !erro && url && !url.toLowerCase().includes("nan")
      ? url.startsWith("http")
        ? url
        : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
      : "https://cdn-icons-png.flaticon.com/512/744/744465.png";

  return (
    <Image
      source={{ uri: imagemUri }}
      style={styles.carImage}
      resizeMode="contain"
      onError={() => setErro(true)}
    />
  );
};

const ComparisonBar = ({
  label,
  value,
  color,
  percentage,
}: {
  label: string;
  value: number;
  color: string;
  percentage: number;
}) => (
  <View style={styles.barRow}>
    <Text style={styles.barLabel}>{label}</Text>
    <View style={styles.barContainer}>
      <View style={[styles.bar, { backgroundColor: color, width: `${percentage}%` }]}>
        <Text style={styles.barValueText}>{value.toFixed(2)}</Text>
      </View>
    </View>
  </View>
);

const Card = ({ title, onInfoPress, children }: { title: string; onInfoPress?: () => void; children: React.ReactNode }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      {onInfoPress && (
        <TouchableOpacity onPress={onInfoPress}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// --- Tela Principal ---

const ComparisonScreen = () => {
  const { comparacao } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("pollutants");
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);

  const dados = comparacao ? JSON.parse(comparacao as string) : null;

  if (!dados) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Nenhum dado de comparação disponível.</Text>
      </SafeAreaView>
    );
  }

  const { carro1, carro2 } = dados;
  const scoreColors = getDynamicColors(carro1.scoreFinal, carro2.scoreFinal, true);

  const renderComparisonBars = () => {
    const pollutants = [
      { nome: "CO (g/km)", valor1: carro1.co, valor2: carro2.co, lowerIsBetter: true },
      { nome: "CO₂ (g/km)", valor1: carro1.co2, valor2: carro2.co2, lowerIsBetter: true },
      { nome: "NOx (g/km)", valor1: carro1.nox, valor2: carro2.nox, lowerIsBetter: true },
      { nome: "NMHC (g/km)", valor1: carro1.nmhc, valor2: carro2.nmhc, lowerIsBetter: true },
    ];
    const consumption = [
      { nome: "Rendimento Cidade (km/l)", valor1: carro1.rendimento_cidade, valor2: carro2.rendimento_cidade, lowerIsBetter: false },
      { nome: "Rendimento Estrada (km/l)", valor1: carro1.rendimento_estrada, valor2: carro2.rendimento_estrada, lowerIsBetter: false },
      { nome: "Consumo Energético (MJ/km)", valor1: carro1.consumo_energetico, valor2: carro2.consumo_energetico, lowerIsBetter: true },
    ];

    const items = activeTab === "pollutants" ? pollutants : consumption;

    return items.map((item) => {
      const { color1, color2 } = getDynamicColors(item.valor1, item.valor2, item.lowerIsBetter);
      const maxValor = Math.max(item.valor1, item.valor2);
      const percentage1 = maxValor > 0 ? (item.valor1 / maxValor) * 100 : 0;
      const percentage2 = maxValor > 0 ? (item.valor2 / maxValor) * 100 : 0;

      return (
        <View key={item.nome} style={styles.comparisonGroup}>
          <Text style={styles.comparisonTitle}>{item.nome}</Text>
          <ComparisonBar label={carro1.marca} value={item.valor1} color={color1} percentage={percentage1} />
          <ComparisonBar label={carro2.marca} value={item.valor2} color={color2} percentage={percentage2} />
        </View>
      );
    });
  };

  const infoContent = {
    pollutants: [
      { title: "O que são Poluentes?", text: "São gases nocivos emitidos pelo escapamento. Quanto menor a emissão, menos o carro polui o ar." },
      { title: "CO, NOx, NMHC", text: "São tipos de poluentes. Valores menores são sempre melhores para a qualidade do ar e para a saúde." },
    ],
    consumption: [
      { title: "Rendimento (km/l)", text: "Indica quantos quilômetros o carro anda com 1 litro de combustível. Quanto maior o valor, mais econômico é o carro." },
      { title: "Consumo Energético (MJ/km)", text: "Mede a energia total que o carro gasta para andar 1 km. Quanto menor o valor, mais eficiente ele é." },
    ]
  };

  const renderInfoModal = () => (
    <Modal
      visible={isInfoModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setInfoModalVisible(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setInfoModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Entenda a Comparação</Text>
          {(activeTab === 'pollutants' ? infoContent.pollutants : infoContent.consumption).map(item => (
            <View key={item.title} style={{marginBottom: 10}}>
              <Text style={styles.infoTitle}>{item.title}</Text>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={() => setInfoModalVisible(false)}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comparação de Carros</Text>
        </View>

        <View style={styles.imageRow}>
          <View style={styles.vehicleInfo}>
            <ImagemVeiculo url={carro1.imagem_url} />
            <Text style={styles.vehicleName} numberOfLines={2}>{carro1.marca} {carro1.modelo}</Text>
            <Text style={styles.vehicleDetails}>{carro1.ano} - {carro1.versao}</Text>
          </View>
          <Text style={styles.vs}>VS</Text>
          <View style={styles.vehicleInfo}>
            <ImagemVeiculo url={carro2.imagem_url} />
            <Text style={styles.vehicleName} numberOfLines={2}>{carro2.marca} {carro2.modelo}</Text>
            <Text style={styles.vehicleDetails}>{carro2.ano} - {carro2.versao}</Text>
          </View>
        </View>

        <Card title="Score Final">
          <View style={styles.scoreCardContainer}>
            <View style={styles.scoreItem}>
              <Ionicons name="cloud-outline" size={70} color={scoreColors.color1} />
              <Text style={[styles.scoreText, { color: scoreColors.color1 }]}>{carro1.scoreFinal.toFixed(2)}</Text>
              <Text style={styles.brandName}>{carro1.marca}</Text>
            </View>
            <View style={styles.scoreItem}>
              <Ionicons name="cloud-outline" size={70} color={scoreColors.color2} />
              <Text style={[styles.scoreText, { color: scoreColors.color2 }]}>{carro2.scoreFinal.toFixed(2)}</Text>
              <Text style={styles.brandName}>{carro2.marca}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "pollutants" && styles.activeTab]}
            onPress={() => setActiveTab("pollutants")}
          >
            <Text style={[styles.tabText, activeTab === "pollutants" && styles.activeTabText]}>
              Poluentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "consumption" && styles.activeTab]}
            onPress={() => setActiveTab("consumption")}
          >
            <Text style={[styles.tabText, activeTab === "consumption" && styles.activeTabText]}>
              Consumo
            </Text>
          </TouchableOpacity>
        </View>

        <Card 
          title={activeTab === 'pollutants' ? 'Comparativo de Emissões' : 'Comparativo de Consumo'}
          onInfoPress={() => setInfoModalVisible(true)}
        >
          {renderComparisonBars()}
        </Card>
        <View style={{height: 40}}/>
      </ScrollView>
      {renderInfoModal()}
    </SafeAreaView>
  );
};

export default ComparisonScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  header: { alignItems: "center", marginVertical: 16 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  errorText: { textAlign: "center", marginTop: 50, fontSize: 17, color: "#666" },
  
  imageRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start", marginBottom: 10, paddingHorizontal: 16 },
  vehicleInfo: { width: width * 0.4, alignItems: "center" },
  carImage: { width: "100%", height: 100, borderRadius: 8, backgroundColor: '#FFF' },
  vs: { fontSize: 24, fontWeight: "bold", color: "#BDBDBD", paddingTop: 30 },
  vehicleName: { fontSize: 17, fontWeight: "bold", textAlign: "center", marginTop: 8, color: "#424242" },
  vehicleDetails: { fontSize: 15, color: "#757575", textAlign: "center" },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  scoreCardContainer: { flexDirection: "row", justifyContent: "space-around", alignItems: 'center' },
  scoreItem: { alignItems: "center", position: "relative" },
  scoreText: { position: "absolute", top: "35%", fontSize: 18, fontWeight: "bold" },
  brandName: { fontSize: 15, color: "#616161", marginTop: 4 },

  tabs: { flexDirection: "row", justifyContent: "center", marginHorizontal: 16, marginBottom: 16, backgroundColor: "#E0E0E0", borderRadius: 20 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 20 },
  activeTab: { backgroundColor: "#2196F3" },
  tabText: { color: "#616161", fontWeight: "bold", textAlign: "center", fontSize: 15 },
  activeTabText: { color: "#FFF" },

  comparisonGroup: { marginVertical: 10 },
  comparisonTitle: { fontWeight: "bold", marginBottom: 10, fontSize: 16, color: "#444" },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  barLabel: { width: 80, fontSize: 15, color: "#616161" },
  barContainer: { flex: 1, height: 28, borderRadius: 6, backgroundColor: "#E0E0E0", justifyContent: "center" },
  bar: { height: "100%", borderRadius: 6, justifyContent: "center", alignItems: "flex-end", paddingRight: 8 },
  barValueText: { color: "#FFF", fontSize: 13, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});