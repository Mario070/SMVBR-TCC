import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from '../config';
import BarraNavegacao from '../components/BarraNavegacao';

const PAGE_STEP = 20;

const TelaInicial = () => {
  const [filtroVisivel, setFiltroVisivel] = useState(false);
  const [textoPesquisa, setTextoPesquisa] = useState('');
  const [carros, setCarros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selectedAno, setSelectedAno] = useState<number | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<string>('');
  const [selectedMotor, setSelectedMotor] = useState<string | null>(null);
  const [selectedTransmissao, setSelectedTransmissao] = useState<string | null>(null);
  const [selectedAr, setSelectedAr] = useState<string | null>(null);
  const [selectedDirecao, setSelectedDirecao] = useState<string | null>(null);
  const [selectedCombustivel, setSelectedCombustivel] = useState<string | null>(null);
  const [visiveis, setVisiveis] = useState(PAGE_STEP);
  const [favoritos, setFavoritos] = useState<Record<string, boolean>>({});

  const buscarCarros = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resp = await fetch(`${API_BASE_URL}/carros`);
      if (!resp.ok) {
        throw new Error(`Erro da API: ${resp.status}`);
      }
      const json = await resp.json();
      const lista = json.carros || json || [];
      setCarros(Array.isArray(lista) ? lista : []);
      setVisiveis(PAGE_STEP);
    } catch (e) {
      console.error(e);
      setErro('Falha ao carregar os carros. Verifique sua conexão.');
    } finally {
      setCarregando(false);
    }
  };

  const buscarCarrosFiltrados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const params = new URLSearchParams();
      if (selectedAno) params.append('ano', selectedAno.toString());
      if (selectedGrupo) params.append('grupo', selectedGrupo);
      if (selectedMarca) params.append('marca', selectedMarca);
      if (selectedMotor) params.append('motor', selectedMotor);
      if (selectedTransmissao) params.append('transmissao', selectedTransmissao);
      if (selectedAr) params.append('ar_condicionado', selectedAr);
      if (selectedDirecao) params.append('direcao_assistida', selectedDirecao);
      if (selectedCombustivel) params.append('combustivel', selectedCombustivel);

      const resp = await fetch(`${API_BASE_URL}/filtro-carros?${params.toString()}`);
      if (!resp.ok) {
        throw new Error(`Erro da API: ${resp.status}`);
      }
      const json = await resp.json();
      const resultados = json.resultados || [];
      setCarros(Array.isArray(resultados) ? resultados : []);
      setVisiveis(PAGE_STEP);
      Alert.alert('Filtros aplicados', 'Os carros foram filtrados com sucesso!');
    } catch (e) {
      console.error(e);
      setErro('Falha ao aplicar filtros.');
    } finally {
      setCarregando(false);
      setFiltroVisivel(false);
    }
  };

  useEffect(() => {
    buscarCarros();
  }, []);

  const getId = (item: any, fallback: number) => String(item?.veiculo_id ?? item?.id ?? fallback);

  const toggleFavorito = async (item: any, fallbackIndex: number) => {
    const usuarioId = await AsyncStorage.getItem("usuario_id");
    if (!usuarioId) {
      Alert.alert("Erro", "Usuário não logado.");
      return;
    }
    try {
      const resposta = await fetch(`${API_BASE_URL}/favoritar/${usuarioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: String(item.codigo) }),
      });
      const data = await resposta.json();
      if (resposta.ok) {
        const msg = Array.isArray(data.mensagem) ? data.mensagem.join("\n") : String(data.mensagem);
        Alert.alert("Sucesso", msg);
      } else {
        const msg = Array.isArray(data.detail) ? data.detail.join("\n") : String(data.detail);
        Alert.alert("Erro", msg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha de conexão com o servidor");
    }
  };

  const carrosFiltrados = useMemo(() => {
    const t = textoPesquisa.trim().toLowerCase();
    return carros.filter((c) => {
      if (!c) return false;
      const marca = (c.marca ?? c.MARCA ?? '').toString().toLowerCase();
      const modelo = (c.modelo ?? c.MODELO ?? '').toString().toLowerCase();
      const nome = (c.nome ?? '').toString().toLowerCase();
      const ano = String(c.ano ?? c.ANO ?? '');
      if (t && !(marca.includes(t) || modelo.includes(t) || nome.includes(t) || ano.includes(t))) {
        return false;
      }
      return true;
    });
  }, [carros, textoPesquisa]);

  const dadosPaginados = useMemo(
    () => carrosFiltrados.slice(0, visiveis),
    [carrosFiltrados, visiveis]
  );

  const carregarMais = () => {
    if (dadosPaginados.length < carrosFiltrados.length) {
      setVisiveis((v) => v + PAGE_STEP);
    }
  };

  const renderizarCarro = ({ item, index }: { item: any; index: number }) => {
    if (!item) {
      return (
        <View style={estilos.cartaoCarro}>
          <Text style={{ padding: 8 }}>Dados do veículo indisponíveis</Text>
        </View>
      );
    }

    const marca = item.marca ?? item.MARCA ?? '';
    const modelo = item.modelo ?? item.MODELO ?? '';
    const ano = item.ano ?? item.ANO ? parseInt(String(item.ano ?? item.ANO), 10) : '';
    const id = getId(item, index);
    const imagemUri = item.imagem_url && item.imagem_url.length > 0
      ? { uri: `${API_BASE_URL}${item.imagem_url}` }
      : { uri: 'https://cdn-icons-png.flaticon.com/512/744/744465.png' };
    const ehFavorito = !!favoritos[id];

    return (
      <View style={estilos.cartaoCarro}>
        <TouchableOpacity
          style={estilos.botaoFavorito}
          onPress={() => toggleFavorito(item, index)}
        >
          <Ionicons
            name={ehFavorito ? 'heart' : 'heart-outline'}
            size={20}
            color={ehFavorito ? '#e91e63' : '#666'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={estilos.conteudoCard}
          onPress={() =>
            router.push({
              pathname: '/detalhes/[id]',
              params: {
                id: String(id),
                carro: encodeURIComponent(JSON.stringify(item)),
              },
            })
          }
        >
          <Image source={imagemUri} style={estilos.imagemCarro} />
          <Text style={estilos.nomeCarro}>{marca} {modelo}</Text>
          <Text style={estilos.precoCarro}>Ano: {ano}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const fecharModal = () => setFiltroVisivel(false);
  const limparFiltros = () => {
    setSelectedAno(null);
    setSelectedGrupo(null);
    setSelectedMarca('');
    setSelectedMotor(null);
    setSelectedTransmissao(null);
    setSelectedAr(null);
    setSelectedDirecao(null);
    setSelectedCombustivel(null);
    buscarCarros(); // recarrega lista padrão
    Alert.alert('Filtros limpos', 'Todos os filtros foram removidos.');
    setFiltroVisivel(false);
  };

  const renderizarFiltroModal = () => (
    <Modal visible={filtroVisivel} animationType="slide" transparent>
      <View style={estilos.sobreposicaoModal}>
        <View style={estilos.conteudoModal}>
          <TouchableOpacity style={estilos.botaoFechar} onPress={fecharModal}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={estilos.tituloModal}>Filtros</Text>

          <ScrollView style={estilos.scrollFiltros}>

            {/* Ano */}
            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Ano</Text>
              <View style={estilos.pickerContainer}>
                <Picker selectedValue={selectedAno} onValueChange={setSelectedAno}>
                  <Picker.Item label="Todos os anos" value={null} />
                  {Array.from({ length: 2025 - 2013 + 1 }, (_, i) => 2013 + i).map((ano) => (
                    <Picker.Item key={ano} label={String(ano)} value={ano} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Grupo */}
            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Grupo</Text>
              {['Pequeno', 'Médio – Grande', 'Utilitário', 'Trabalho', 'Luxo'].map((grupo) => (
                <View key={grupo} style={estilos.checkboxLinha}>
                  <Checkbox
                    status={selectedGrupo === grupo ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setSelectedGrupo(selectedGrupo === grupo ? null : grupo)
                    }
                  />
                  <Text style={estilos.textoCheckbox}>{grupo}</Text>
                </View>
              ))}
            </View>

            {/* Marca */}
            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Marca</Text>
              <TextInput
                style={estilos.inputPesquisa}
                placeholder="Digite a marca"
                placeholderTextColor="#888"
                value={selectedMarca}
                onChangeText={setSelectedMarca}
              />
            </View>

            {/* Motor */}
            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Motor</Text>

              {[
                { label: 'Até 1,5 cilindradas', value: '1' },
                { label: 'De 1,6 até 2,0 cilindradas', value: '2' },
                { label: 'Acima de 2,0 até 2,9 cilindradas', value: '3' },
                { label: 'Acima de 3 cilindradas', value: '4' },
                { label: 'Elétrico', value: '5' },
              ].map((motor) => (
                <View key={motor.value} style={estilos.checkboxLinha}>
                  <Checkbox
                    status={selectedMotor === motor.value ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setSelectedMotor(selectedMotor === motor.value ? null : motor.value)
                    }
                  />
                  <Text style={estilos.textoCheckbox}>{motor.label}</Text>
                </View>
              ))}
            </View>


            {/* Transmissão */}
            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Transmissão</Text>
              {['Automática', 'Semiautomática', 'Manual'].map((trans) => (
                <View key={trans} style={estilos.checkboxLinha}>
                  <Checkbox
                    status={selectedTransmissao === trans ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setSelectedTransmissao(selectedTransmissao === trans ? null : trans)
                    }
                  />
                  <Text style={estilos.textoCheckbox}>{trans}</Text>
                </View>
              ))}
            </View>

            {/* Ar-condicionado */}
            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Ar-condicionado</Text>

              {[
                { label: 'Sim', value: 'S' },
                { label: 'Não', value: 'N' },
              ].map((ar) => (
                <View key={ar.value} style={estilos.checkboxLinha}>
                  <Checkbox
                    status={selectedAr === ar.value ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setSelectedAr(selectedAr === ar.value ? null : ar.value)
                    }
                  />
                  <Text style={estilos.textoCheckbox}>{ar.label}</Text>
                </View>
              ))}
            </View>


            {/* Direção assistida */}
            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Direção assistida</Text>

              {[
                { label: 'Hidráulica', value: 'H' },
                { label: 'Elétrica', value: 'E' },
                { label: 'Eletro-hidráulica', value: 'HE' },
                { label: 'Manual', value: 'M' },
              ].map((dir) => (
                <View key={dir.value} style={estilos.checkboxLinha}>
                  <Checkbox
                    status={selectedDirecao === dir.value ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setSelectedDirecao(selectedDirecao === dir.value ? null : dir.value)
                    }
                  />
                  <Text style={estilos.textoCheckbox}>{dir.label}</Text>
                </View>
              ))}
            </View>


            <View style={estilos.secaoFiltro}>
              <Text style={estilos.labelFiltro}>Combustível</Text>

              {[
                { label: 'Gasolina', value: 'G' },
                { label: 'Etanol', value: 'E' },
                { label: 'Diesel', value: 'D' },
                { label: 'Flex', value: 'F' }
              ].map((comb) => (
                <View key={comb.value} style={estilos.checkboxLinha}>
                  <Checkbox
                    status={selectedCombustivel === comb.value ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setSelectedCombustivel(selectedCombustivel === comb.value ? null : comb.value)
                    }
                  />
                  <Text style={estilos.textoCheckbox}>{comb.label}</Text>
                </View>
              ))}
            </View>

          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[estilos.botaoAplicar, { flex: 1, backgroundColor: '#eee' }]}
              onPress={limparFiltros}
            >
              <Text style={[estilos.textoBotao, { color: '#000' }]}>Limpar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.botaoAplicar, { flex: 1 }]}
              onPress={buscarCarrosFiltrados}
            >
              <Text style={estilos.textoBotao}>Aplicar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );


  return (
    <View style={estilos.container}>
      <Text style={estilos.tituloSecao}>Pesquisar</Text>
      <View style={estilos.containerPesquisaFiltro}>
        <View style={estilos.containerPesquisa}>
          <Ionicons name="search" size={20} color="#888" style={estilos.iconePesquisa} />
          <TextInput
            style={estilos.inputPesquisa}
            placeholder="Buscar carro..."
            placeholderTextColor="#888"
            value={textoPesquisa}
            onChangeText={(txt) => {
              setTextoPesquisa(txt);
              setVisiveis(PAGE_STEP);
            }}
          />
        </View>
        <TouchableOpacity
          style={estilos.botaoFiltroIcone}
          onPress={() => setFiltroVisivel(true)}
        >
          <Ionicons name="filter" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={estilos.centralizar}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={estilos.textoCarregando}>Carregando carros...</Text>
        </View>
      ) : erro ? (
        <View style={estilos.centralizar}>
          <Text style={estilos.textoErro}>{erro}</Text>
        </View>
      ) : (
        <FlatList
          data={dadosPaginados}
          renderItem={renderizarCarro}
          keyExtractor={(item, index) => getId(item, index)}
          numColumns={2}
          contentContainerStyle={estilos.conteudoFlatList}
          ListEmptyComponent={<Text style={estilos.textoVazio}>Nenhum carro encontrado.</Text>}
          onEndReached={carregarMais}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            dadosPaginados.length < carrosFiltrados.length ? (
              <ActivityIndicator size="small" color="#2196F3" style={{ margin: 16 }} />
            ) : null
          }
        />
      )}

      {renderizarFiltroModal()}
      <BarraNavegacao telaAtiva="home" />
    </View>
  );
};

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 100 },
  tituloSecao: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#000' },
  containerPesquisaFiltro: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  containerPesquisa: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  iconePesquisa: { marginRight: 8 },
  inputPesquisa: { flex: 1, fontSize: 16, color: '#000', paddingVertical: 0 },
  botaoFiltroIcone: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  conteudoFlatList: { paddingBottom: 120 },
  cartaoCarro: { width: '45%', margin: '2.5%', backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, position: 'relative' },
  botaoFavorito: { position: 'absolute', top: 8, right: 8, zIndex: 1, padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12 },
  conteudoCard: { flex: 1 },
  imagemCarro: { width: '100%', height: 100 },
  nomeCarro: { padding: 8, fontSize: 14, fontWeight: 'bold', color: '#000' },
  precoCarro: { paddingHorizontal: 8, paddingBottom: 8, fontSize: 14, color: '#2196F3' },
  centralizar: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoCarregando: { marginTop: 10, fontSize: 16, color: '#666' },
  textoErro: { fontSize: 16, color: '#f44336', textAlign: 'center', marginBottom: 10 },
  textoVazio: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#999' },
  sobreposicaoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  conteudoModal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  botaoFechar: { alignSelf: 'flex-end', marginBottom: 10 },
  tituloModal: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#000' },
  secaoFiltro: { marginBottom: 16 },
  labelFiltro: { fontWeight: '600', marginBottom: 8, color: '#000' },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  checkboxLinha: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  textoCheckbox: { marginLeft: 10, fontSize: 16, color: '#000' },
  botaoAplicar: { backgroundColor: '#2196F3', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  scrollFiltros: { maxHeight: 400, marginBottom: 16 },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TelaInicial;
