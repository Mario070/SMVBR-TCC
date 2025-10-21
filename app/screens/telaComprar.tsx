import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width } = Dimensions.get('window');

// Dados simulados para os veículos
const vehicles = {
  volkswagen: {
    name: 'Volkswagen T-Cross Highline',
    scoreFinal: 35,
    pollutants: { CO: 75, CO2: 80, NOx: 60, NMHC: 70 },
    consumoEnergetico: 65,
    etanol: { cidade: 8.2, estrada: 9.5 },
    gasolina: { cidade: 11.0, estrada: 13.2 },
  },
  chevrolet: {
    name: 'Chevrolet Tracker Premier',
    scoreFinal: 29,
    pollutants: { CO: 80, CO2: 85, NOx: 65, NMHC: 75 },
    consumoEnergetico: 60,
    etanol: { cidade: 7.8, estrada: 9.0 },
    gasolina: { cidade: 10.5, estrada: 12.8 },
  },
};

const ComparisonScreen = () => {
  const [activeTab, setActiveTab] = useState('pollutants'); // 'pollutants' | 'energy' | 'ethanol' | 'fuel'

  const renderComparisonBars = () => {
    const vw = vehicles.volkswagen;
    const ch = vehicles.chevrolet;

    switch (activeTab) {
      case 'pollutants':
        return (
          <>
            {['CO', 'CO2', 'NOx', 'NMHC'].map((pollutant) => (
              <View key={pollutant} style={styles.pollutantGroup}>
                <Text style={styles.pollutantTitle}>{pollutant}</Text>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>VW</Text>
                  <View style={[styles.bar, styles.blueBar]}>
                    <View style={[styles.fillBar, { width: `${vw.pollutants[pollutant]}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{vw.pollutants[pollutant]}</Text>
                </View>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>CH</Text>
                  <View style={[styles.bar, styles.greenBar]}>
                    <View style={[styles.fillBar, { width: `${ch.pollutants[pollutant]}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{ch.pollutants[pollutant]}</Text>
                </View>
              </View>
            ))}
          </>
        );

      case 'energy':
        return (
          <>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>VW</Text>
              <View style={[styles.bar, styles.blueBar]}>
                <View style={[styles.fillBar, { width: `${vw.consumoEnergetico}%` }]} />
              </View>
              <Text style={styles.barValue}>{vw.consumoEnergetico}</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>CH</Text>
              <View style={[styles.bar, styles.greenBar]}>
                <View style={[styles.fillBar, { width: `${ch.consumoEnergetico}%` }]} />
              </View>
              <Text style={styles.barValue}>{ch.consumoEnergetico}</Text>
            </View>
          </>
        );

      case 'ethanol':
        return (
          <>
            <Text style={styles.fuelType}>Etanol (km/l)</Text>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Cidade</Text>
              <View style={styles.dualBarContainer}>
                <View style={[styles.bar, styles.blueBar]}>
                  <View style={[styles.fillBar, { width: `${(vw.etanol.cidade / 15) * 100}%` }]} />
                </View>
                <View style={[styles.bar, styles.greenBar]}>
                  <View style={[styles.fillBar, { width: `${(ch.etanol.cidade / 15) * 100}%` }]} />
                </View>
              </View>
              <Text style={styles.barValue}>{vw.etanol.cidade} / {ch.etanol.cidade}</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Estrada</Text>
              <View style={styles.dualBarContainer}>
                <View style={[styles.bar, styles.blueBar]}>
                  <View style={[styles.fillBar, { width: `${(vw.etanol.estrada / 15) * 100}%` }]} />
                </View>
                <View style={[styles.bar, styles.greenBar]}>
                  <View style={[styles.fillBar, { width: `${(ch.etanol.estrada / 15) * 100}%` }]} />
                </View>
              </View>
              <Text style={styles.barValue}>{vw.etanol.estrada} / {ch.etanol.estrada}</Text>
            </View>
          </>
        );

      case 'fuel':
        return (
          <>
            <Text style={styles.fuelType}>Gasolina (km/l)</Text>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Cidade</Text>
              <View style={styles.dualBarContainer}>
                <View style={[styles.bar, styles.blueBar]}>
                  <View style={[styles.fillBar, { width: `${(vw.gasolina.cidade / 15) * 100}%` }]} />
                </View>
                <View style={[styles.bar, styles.greenBar]}>
                  <View style={[styles.fillBar, { width: `${(ch.gasolina.cidade / 15) * 100}%` }]} />
                </View>
              </View>
              <Text style={styles.barValue}>{vw.gasolina.cidade} / {ch.gasolina.cidade}</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Estrada</Text>
              <View style={styles.dualBarContainer}>
                <View style={[styles.bar, styles.blueBar]}>
                  <View style={[styles.fillBar, { width: `${(vw.gasolina.estrada / 15) * 100}%` }]} />
                </View>
                <View style={[styles.bar, styles.greenBar]}>
                  <View style={[styles.fillBar, { width: `${(ch.gasolina.estrada / 15) * 100}%` }]} />
                </View>
              </View>
              <Text style={styles.barValue}>{vw.gasolina.estrada} / {ch.gasolina.estrada}</Text>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparação</Text>
        <View style={{ flex: 1 }} />
      </View>

      {/* Seção: Selecione 2 veículos */}
      <View style={styles.section}>
        <View style={styles.vehicleContainer}>
          {/* Veículo 1 */}
          <View style={styles.vehicleCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.vehicleImage}
            />
            <Text style={styles.vehicleName}>Volkswagen T-Cross Highline</Text>
            <View style={styles.checkMark}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>

          {/* Veículo 2 */}
          <View style={styles.vehicleCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.vehicleImage}
            />
            <Text style={styles.vehicleName}>Chevrolet Tracker Premier</Text>
            <View style={styles.checkMark}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Seção: Índice de Sustentabilidade (Score Final) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score Final (Índice de Sustentabilidade)</Text>
        <View style={styles.sustainabilityContainer}>
          <View style={styles.sustainabilityItem}>
            <View style={[styles.circle, styles.blueCircle]}>
              <Text style={styles.circleText}>{vehicles.volkswagen.scoreFinal}</Text>
            </View>
            <Text style={styles.brandName}>Volkswagen</Text>
          </View>

          <View style={styles.sustainabilityItem}>
            <View style={[styles.circle, styles.greenCircle]}>
              <Text style={styles.circleText}>{vehicles.chevrolet.scoreFinal}</Text>
            </View>
            <Text style={styles.brandName}>Chevrolet</Text>
          </View>
        </View>
      </View>

      {/* Seção: Comparação Detalhada */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comparação Detalhada</Text>

        {/* Abas */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'pollutants' && styles.activeTab]} onPress={() => setActiveTab('pollutants')}>
            <Text style={[styles.tabText, activeTab === 'pollutants' && styles.activeTabText]}>Poluentes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'energy' && styles.activeTab]} onPress={() => setActiveTab('energy')}>
            <Text style={[styles.tabText, activeTab === 'energy' && styles.activeTabText]}>Energia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'ethanol' && styles.activeTab]} onPress={() => setActiveTab('ethanol')}>
            <Text style={[styles.tabText, activeTab === 'ethanol' && styles.activeTabText]}>Etanol</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'fuel' && styles.activeTab]} onPress={() => setActiveTab('fuel')}>
            <Text style={[styles.tabText, activeTab === 'fuel' && styles.activeTabText]}>Gasolina</Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo dinâmico */}
        <ScrollView style={styles.comparisonContent}>
          {renderComparisonBars()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    marginRight: 10,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  vehicleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleCard: {
    width: (width - 70) / 2,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  vehicleImage: {
    width: 90,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  vehicleName: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
    color: '#333',
  },
  checkMark: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sustainabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
  },
  sustainabilityItem: {
    alignItems: 'center',
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  blueCircle: {
    borderColor: '#2196F3',
    borderWidth: 4,
  },
  greenCircle: {
    borderColor: '#4CAF50',
    borderWidth: 4,
  },
  circleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  comparisonContent: {
    maxHeight: 300,
  },
  pollutantGroup: {
    marginBottom: 20,
  },
  pollutantTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  fuelType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 70,
    fontSize: 16,
    color: '#333',
  },
  dualBarContainer: {
    flex: 1,
    marginHorizontal: 10,
    gap: 6,
  },
  bar: {
    flex: 1,
    height: 16,
    borderRadius: 5,
    overflow: 'hidden',
  },
  blueBar: {
    backgroundColor: '#BBDEFB',
  },
  greenBar: {
    backgroundColor: '#C8E6C9',
  },
  fillBar: {
    height: '100%',
  },
  barValue: {
    width: 70,
    textAlign: 'right',
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ComparisonScreen;