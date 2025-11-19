import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../config';

// --- Componente de Card Interno ---
// Para não criar arquivos, definimos um componente auxiliar aqui mesmo
const Card = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <View style={estilos.card}>
    <Text style={estilos.tituloSecao}>{titulo}</Text>
    {children}
  </View>
);

// --- Componente de Linha com Seta Interno ---
const LinhaComSeta = ({ rotulo, valor, unidade, direcao }: { rotulo: string; valor: any; unidade: string; direcao: 'up' | 'down' }) => {
  const isUp = direcao === 'up';
  // Se for pra cima (melhor), verde. Se for pra baixo (pior), vermelho.
  // Para poluentes, a lógica é invertida (menor é melhor).
  const corSeta = isUp ? '#4CAF50' : '#F44336';
  const iconeSeta = isUp ? 'arrow-up-circle' : 'arrow-down-circle';

  return (
    <View style={estilos.linhaDetalhe}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={estilos.valorContainer}>
        <Ionicons name={iconeSeta} size={20} color={corSeta} style={{ marginRight: 8 }} />
        <Text style={estilos.valor}>{valor ?? 'N/A'} {unidade}</Text>
      </View>
    </View>
  );
};


const DetalhesCarro = () => {
  const { id, carro: carroParam } = useLocalSearchParams<{ id?: string; carro?: string }>();
  const router = useRouter();

  const [carro, setCarro] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isFavorito, setIsFavorito] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setCarregando(true);
        setErro(null);

        if (carroParam) {
          try {
            const parsed = JSON.parse(decodeURIComponent(String(carroParam)));
            const normalizado = Object.keys(parsed).reduce((acc: any, key) => {
              acc[key.toLowerCase()] = parsed[key];
              return acc;
            }, {});
            setCarro(normalizado);
            return;
          } catch (e) {
            console.warn('Falha ao parsear carro dos params:', e);
          }
        }

        if (id) {
          const resp = await fetch(`${API_BASE_URL}/carros/${id}`);
          if (!resp.ok) throw new Error(`Erro: ${resp.status}`);
          const json = await resp.json();
          setCarro(json);
        } else {
          setErro('Carro não encontrado.');
        }
      } catch (e: any) {
        console.error(e);
        setErro(e.message || 'Não foi possível carregar os detalhes do carro.');
      } finally {
        setCarregando(false);
      }
    };
    init();
  }, [id, carroParam]);

  const getImagemVeiculo = () => {
    const urlBanco = carro?.imagem_url;
    const urlPlanilha = carro?.imagem_planilha;
    const isInvalida = (url?: string) => !url || url.trim().toLowerCase().includes('nan');

    let finalUrl = 'https://cdn-icons-png.flaticon.com/512/744/744465.png';
    if (!isInvalida(urlBanco)) finalUrl = urlBanco!;
    else if (!isInvalida(urlPlanilha)) finalUrl = urlPlanilha!;
    
    return finalUrl.startsWith('http') ? finalUrl : `${API_BASE_URL}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
  };

  const campos = {
   ano: carro?.ano ?? 'N/A',
    categoria: carro?.categoria ?? 'N/A',
    marca: carro?.marca ?? 'N/A',
    modelo: carro?.modelo ?? 'N/A',
    versao: carro?.versao ?? 'N/A',
    motor: carro?.motor ?? 'N/A',
    transmissao: carro?.['transmissão'] ?? carro?.transmissao ?? 'N/A',
    direcaoAssistida: carro?.['direçao assistida'] ?? carro?.direcao_assistida ?? carro?.direcaoAssistida ??'N/A',
    arCondicionado: carro?.['ar-condicionado'] ?? carro?.ar_condicionado ?? 'N/A',
    combustivel: carro?.combustivel ?? carro?.combustível ?? 'N/A',
    nmhc: carro?.['emissao_nmhc'] ?? carro?.['emissão de nmhc (g/km)'] ?? 'N/A',
    co: carro?.['emissao_co'] ?? carro?.['emissão de co (g/km)'] ?? 'N/A',
    nox: carro?.['emissao_nox'] ?? carro?.['emissão de nox (g/km)'] ?? 'N/A',
    co2: carro?.['emissao_co2'] ?? carro?.['emissão de co2 (g/km)'] ?? 'N/A',
    rendEtanolCidade: carro?.['rendimento_cidade'] ?? carro?.['rendimento do etanol na cidade (km/l)'] ?? 'N/A',
    rendEtanolEstrada: carro?.['rendimento_estrada'] ?? carro?.['rendimento do etanol na estrada (km/l)'] ?? 'N/A',
    rendGasCidade: carro?.['rendimento_cidade'] ?? carro?.['rendimento da gasolina ou diesel na cidade (km/l)'] ?? 'N/A',
    rendGasEstrada: carro?.['rendimento_estrada'] ?? carro?.['rendimento da gasolina ou diesel estrada (km/l)'] ?? 'N/A',
    consumoEnergetico: carro?.['consumo_energetico'] ?? carro?.['consumo energético (mj/km)'] ?? 'N/A',
    score: carro?.score_sustentabilidade ?? 9.5, // Valor de exemplo
  };

  const traduzirDirecao = (valor: string) => {
    switch (valor?.toUpperCase()) {
      case 'H': return 'Hidráulica';
      case 'E': return 'Elétrica';
      case 'H-E': return 'Eletro-hidráulica';
      case 'M': return 'Mecânica';
      default: return valor || 'N/A';
    }
  };

  const traduzirCombustivel = (valor: string) => {
    switch (valor?.toUpperCase()) {
      case 'G': return 'Gasolina';
      case 'E': return 'Etanol';
      case 'D': return 'Diesel';
      case 'F': return 'Flex';
      default: return valor || 'N/A';
    }
  };

  if (carregando) {
    return (
      <View style={estilos.containerCentrado}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={estilos.textoStatus}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (erro || !carro) {
    return (
      <View style={estilos.containerCentrado}>
        <Text style={estilos.textoStatus}>{erro || 'Carro não encontrado.'}</Text>
        <TouchableOpacity style={estilos.botaoVoltar} onPress={() => router.back()}>
          <Text style={estilos.textoBotao}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getScoreColor = () => {
    if (campos.score >= 7) return '#4CAF50'; // Verde
    if (campos.score >= 4) return '#FFC107'; // Amarelo
    return '#F44336'; // Vermelho
  };

  return (
    <View style={{flex: 1}}>

      <ScrollView style={estilos.container}>
        <View style={estilos.imagemContainer}>
          <Image source={{ uri: getImagemVeiculo() }} style={estilos.imagemGrande} resizeMode="contain" />
          <TouchableOpacity style={estilos.botaoFavorito} onPress={() => setIsFavorito(!isFavorito)}>
            <Ionicons name={isFavorito ? "heart" : "heart-outline"} size={24} color="#FF453A" />
          </TouchableOpacity>
        </View>

        {/* --- Info Gerais e Score --- */}
        <View style={estilos.infoGeraisContainer}>
          <View style={estilos.infoPrincipal}>
            <Text style={estilos.nomeCarro}>{campos.marca} {campos.modelo}</Text>
            <Text style={estilos.versaoCarro}>{campos.versao}</Text>
            <Text style={estilos.subtituloCarro}>{campos.categoria} - {campos.ano}</Text>
          </View>
          <View style={estilos.scoreContainer}>
            <Ionicons name="cloud-outline" size={40} color={getScoreColor()} />
            <Text style={[estilos.scoreTexto, { color: getScoreColor() }]}>{campos.score?.toFixed(1)}</Text>
            <Text style={estilos.scoreLabel}>Score</Text>
          </View>
        </View>

        {/* --- Caixa 1: Especificações Técnicas --- */}
        <Card titulo="Especificações Técnicas">
          <View style={estilos.linhaDetalhe}><Text style={estilos.rotulo}>Motor:</Text><Text style={estilos.valor}>{campos.motor}</Text></View>
          <View style={estilos.linhaDetalhe}><Text style={estilos.rotulo}>Transmissão:</Text><Text style={estilos.valor}>{campos.transmissao}</Text></View>
          <View style={estilos.linhaDetalhe}><Text style={estilos.rotulo}>Ar-condicionado:</Text><Text style={estilos.valor}>{campos.arCondicionado}</Text></View>
          <View style={estilos.linhaDetalhe}><Text style={estilos.rotulo}>Direção:</Text><Text style={estilos.valor}>{traduzirDirecao(campos.direcaoAssistida)}</Text></View>
          <View style={estilos.linhaDetalhe}><Text style={estilos.rotulo}>Combustível:</Text><Text style={estilos.valor}>{traduzirCombustivel(campos.combustivel)}</Text></View>
        </Card>

        {/* --- Caixa 2: Poluentes --- */}
        <Card titulo="Emissões de Poluentes">
          <LinhaComSeta rotulo="NMHC" valor={campos.nmhc} unidade="g/km" direcao="down" />
          <LinhaComSeta rotulo="CO" valor={campos.co} unidade="g/km" direcao="down" />
          <LinhaComSeta rotulo="NOx" valor={campos.nox} unidade="g/km" direcao="down" />
          <LinhaComSeta rotulo="CO₂" valor={campos.co2} unidade="g/km" direcao="down" />
        </Card>

        {/* --- Caixa 3: Rendimento --- */}
        <Card titulo="Rendimento e Consumo">
          <LinhaComSeta rotulo="Etanol (Cidade)" valor={campos.rendEtanolCidade} unidade="km/l" direcao="up" />
          <LinhaComSeta rotulo="Etanol (Estrada)" valor={campos.rendEtanolEstrada} unidade="km/l" direcao="up" />
          <LinhaComSeta rotulo="Gasolina (Cidade)" valor={campos.rendGasCidade} unidade="km/l" direcao="up" />
          <LinhaComSeta rotulo="Gasolina (Estrada)" valor={campos.rendGasEstrada} unidade="km/l" direcao="up" />
          <LinhaComSeta rotulo="Consumo Energético" valor={campos.consumoEnergetico} unidade="MJ/km" direcao="down" />
        </Card>
        
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  // --- Containers e Barras ---
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 16,
  },
  containerCentrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 16,
  },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tituloBarra: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  // --- Imagem e Favorito ---
  imagemContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagemGrande: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  botaoFavorito: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  // --- Info Gerais e Score ---
  infoGeraisContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoPrincipal: {
    flex: 1,
  },
  nomeCarro: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  versaoCarro: {
    fontSize: 16,
    color: '#555',
    marginTop: 2,
  },
  subtituloCarro: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: 16,
  },
  scoreTexto: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: -2,
  },
  // --- Card e Detalhes ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  linhaDetalhe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rotulo: {
    color: '#666',
    fontSize: 15,
  },
  valor: {
    color: '#000',
    fontSize: 15,
    fontWeight: '500',
  },
  valorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // --- Status e Botões ---
  textoStatus: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  textoCarregando: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  textoErro: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#f44336',
  },
  botaoVoltar: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DetalhesCarro;