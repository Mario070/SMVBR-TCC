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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const ComparisonScreen = () => {
  const { comparacao } = useLocalSearchParams();
  const router = useRouter();

  const dados = comparacao ? JSON.parse(comparacao as string) : null;

  if (!dados) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Nenhum dado de comparação disponível.
        </Text>
      </View>
    );
  }

  const { carro1, carro2 } = dados;
  const [activeTab, setActiveTab] = useState("pollutants");

  const renderComparisonBars = () => {
    switch (activeTab) {
      case "pollutants":
        const poluentes = [
          { nome: "CO", valor1: carro1.co, valor2: carro2.co },
          { nome: "CO₂", valor1: carro1.co2, valor2: carro2.co2 },
          { nome: "NOx", valor1: carro1.nox, valor2: carro2.nox },
          { nome: "NMHC", valor1: carro1.nmhc, valor2: carro2.nmhc },
        ];

        return (
          <>
            {poluentes.map((p) => (
              <View key={p.nome} style={styles.pollutantGroup}>
                <Text style={styles.pollutantTitle}>{p.nome}</Text>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{carro1.marca}</Text>
                  <View style={[styles.bar, styles.blueBar]}>
                    <View
                      style={[
                        styles.fillBar,
                        { width: `${Math.min(p.valor1 * 10, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{p.valor1}</Text>
                </View>

                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{carro2.marca}</Text>
                  <View style={[styles.bar, styles.greenBar]}>
                    <View
                      style={[
                        styles.fillBar,
                        { width: `${Math.min(p.valor2 * 10, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{p.valor2}</Text>
                </View>
              </View>
            ))}
          </>
        );

      case "consumption":
        const consumo = [
          {
            nome: "Rendimento na Cidade (km/l)",
            valor1: carro1.rendimento_cidade,
            valor2: carro2.rendimento_cidade,
          },
          {
            nome: "Rendimento na Estrada (km/l)",
            valor1: carro1.rendimento_estrada,
            valor2: carro2.rendimento_estrada,
          },
          {
            nome: "Consumo Energético (MJ/km)",
            valor1: carro1.consumo_energetico,
            valor2: carro2.consumo_energetico,
          },
        ];

        return (
          <>
            {consumo.map((c) => (
              <View key={c.nome} style={styles.pollutantGroup}>
                <Text style={styles.pollutantTitle}>{c.nome}</Text>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{carro1.marca}</Text>
                  <View style={[styles.bar, styles.blueBar]}>
                    <View
                      style={[
                        styles.fillBar,
                        { width: `${Math.min(c.valor1 * 5, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{c.valor1}</Text>
                </View>

                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{carro2.marca}</Text>
                  <View style={[styles.bar, styles.greenBar]}>
                    <View
                      style={[
                        styles.fillBar,
                        { width: `${Math.min(c.valor2 * 5, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{c.valor2}</Text>
                </View>
              </View>
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comparação de Carros</Text>
        </View>

        {/* Fotos genéricas dos carros */}
        <View style={styles.imageRow}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/744/744465.png" }}
            style={styles.carImage}
          />
          <Text style={styles.vs}>VS</Text>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/744/744465.png" }}
            style={styles.carImage}
          />
        </View>

        {/* Informações principais */}
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {carro1.marca} {carro1.modelo}
            </Text>
            <Text style={styles.vehicleDetails}>
              {carro1.ano} - {carro1.versao}
            </Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {carro2.marca} {carro2.modelo}
            </Text>
            <Text style={styles.vehicleDetails}>
              {carro2.ano} - {carro2.versao}
            </Text>
          </View>
        </View>

        {/* Score Final */}
        <Text style={styles.sectionTitle}>Score Final (Índice de Sustentabilidade)</Text>
        <View style={styles.sustainabilityContainer}>
          <View style={styles.sustainabilityItem}>
            <View style={[styles.circle, styles.blueCircle]}>
              <Text style={styles.circleText}>{carro1.scoreFinal}</Text>
            </View>
            <Text style={styles.brandName}>{carro1.marca}</Text>
          </View>

          <View style={styles.sustainabilityItem}>
            <View style={[styles.circle, styles.greenCircle]}>
              <Text style={styles.circleText}>{carro2.scoreFinal}</Text>
            </View>
            <Text style={styles.brandName}>{carro2.marca}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "pollutants" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("pollutants")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pollutants" && styles.activeTabText,
              ]}
            >
              Poluentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "consumption" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("consumption")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "consumption" && styles.activeTabText,
              ]}
            >
              Consumo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comparação dinâmica */}
        {renderComparisonBars()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ComparisonScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
  },
  carImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  vs: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  vehicleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  vehicleInfo: {
    width: width * 0.42,
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  vehicleDetails: {
    fontSize: 14,
    color: "#555",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  sustainabilityContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  sustainabilityItem: {
    alignItems: "center",
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  blueCircle: {
    backgroundColor: "#cce5ff",
  },
  greenCircle: {
    backgroundColor: "#ccffcc",
  },
  circleText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  brandName: {
    fontSize: 14,
    color: "#333",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  activeTab: {
    borderColor: "#2196F3",
  },
  tabText: {
    color: "#777",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#2196F3",
  },
  pollutantGroup: {
    marginVertical: 10,
  },
  pollutantTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 16,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  barLabel: {
    width: 60,
  },
  bar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#eee",
    marginHorizontal: 10,
    overflow: "hidden",
  },
  fillBar: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#2196F3",
  },
  blueBar: {
    backgroundColor: "#d0e6ff",
  },
  greenBar: {
    backgroundColor: "#d6f5d6",
  },
  barValue: {
    width: 50,
    textAlign: "right",
  },
});
