import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

const PAGE_STEP = 20;

const TelaInicial = () => {
  // UI / filtros
  const [filtroVisivel, setFiltroVisivel] = useState(false);
  const [textoPesquisa, setTextoPesquisa] = useState('');

  // filtros selecionados (controlados)
  const [selectedAno, setSelectedAno] = useState<number | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);

  // opções de filtros (estáticas por enquanto)
  const [opcoesFiltros] = useState({
    categorias: ['SUV', 'Sedan', 'Hatch', 'Pickup'],
    marcas: ['Ford', 'Fiat', 'Chevrolet', 'Toyota'],
    combustiveis: ['Gasolina', 'Etanol', 'Diesel', 'Flex'],
    transmissoes: ['Manual', 'Automática'],
  });

  // dados
  const [carros, setCarros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // paginação no cliente
  const [visiveis, setVisiveis] = useState(PAGE_STEP);

  // favoritos (local)
  const [favoritos, setFavoritos] = useState<Record<string, boolean>>({});

  // buscar carros do backend
  useEffect(() => {
    const buscarCarros = async () => {
      try {
        setCarregando(true);
        setErro(null);
        const resp = await fetch('http://10.0.2.2:8000/carros');
        if (!resp.ok) throw new Error(`Erro da API: ${resp.status}`);
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
    buscarCarros();
  }, []);

  // utilitário para extrair id consistente
  const getId = (item: any, fallback: number) =>
    String(item?.veiculo_id ?? item?.id ?? fallback);

  // toggle favorito
  const toggleFavorito = (item: any, fallbackIndex: number) => {
    const id = getId(item, fallbackIndex);
    setFavoritos((prev) => {
      const novo = { ...prev };
      if (novo[id]) delete novo[id];
      else novo[id] = true;
      return novo;
    });
  };

  // filtro local baseado em busca e filtros selecionados
  const carrosFiltrados = useMemo(() => {
    const t = textoPesquisa.trim().toLowerCase();

    return carros.filter((c) => {
      if (!c) return false;

      const marca = (c.marca ?? c.MARCA ?? '').toString().toLowerCase();
      const modelo = (c.modelo ?? c.MODELO ?? '').toString().toLowerCase();
      const nome = (c.nome ?? '').toString().toLowerCase();
      const ano = String(c.ano ?? c.ANO ?? '');

      // busca de texto
      if (
        t &&
        !(
          marca.includes(t) ||
          modelo.includes(t) ||
          nome.includes(t) ||
          ano.includes(t)
        )
      ) {
        return false;
      }

      // filtro por ano
      if (selectedAno && String(selectedAno) !== ano) return false;

      // categoria (se houver campo categoria no item)
      if (selectedCategoria && String(c.categoria ?? '').toLowerCase() !== selectedCategoria.toLowerCase()) return false;

      // marcas selecionadas (se houver seleção e item não for de uma marca selecionada)
      if (selectedMarcas.length > 0) {
        if (!selectedMarcas.map(m => m.toLowerCase()).includes(marca)) return false;
      }

      return true;
    });
  }, [carros, textoPesquisa, selectedAno, selectedCategoria, selectedMarcas]);

  // dados paginados (cliente)
  const dadosPaginados = useMemo(
    () => carrosFiltrados.slice(0, visiveis),
    [carrosFiltrados, visiveis]
  );

  const carregarMais = () => {
    if (dadosPaginados.length < carrosFiltrados.length) {
      setVisiveis((v) => v + PAGE_STEP);
    }
  };

  // render item
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
    const ano = item.ano ?? item.ANO ?? '';
    const preco = item.preco ?? item.PRECO ?? '';
    const id = getId(item, index);
    const imagemUri =
      typeof item.imagem === 'string' && item.imagem.length > 0
        ? item.imagem
        : 'https://cdn-icons-png.flaticon.com/512/744/744465.png';

    const ehFavorito = !!favoritos[id];

    return (
      <View style={estilos.cartaoCarro}>
        <TouchableOpacity
          style={estilos.botaoFavorito}
          onPress={() => toggleFavorito(item, index)}
        >
          <Ionicons name={ehFavorito ? 'heart' : 'heart-outline'} size={20} color={ehFavorito ? '#e91e63' : '#666'} />
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
          <Image source={{ uri: imagemUri }} style={estilos.imagemCarro} />
          <Text style={estilos.nomeCarro}>{marca} {modelo}</Text>
          <Text style={estilos.precoCarro}>Ano: {ano}</Text>
          {preco ? <Text style={estilos.precoCarro}>Preço: {preco}</Text> : null}
        </TouchableOpacity>
      </View>
    );
  };

  // helper para alternar marcas selecionadas
  const toggleMarcaSelecionada = (marca: string) => {
    setSelectedMarcas((prev) => {
      if (prev.includes(marca)) return prev.filter((m) => m !== marca);
      return [...prev, marca];
    });
  };

  // reset filtros visuais ao fechar modal, se quiser manter removível.
  const fecharModal = () => setFiltroVisivel(false);

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
              setVisiveis(PAGE_STEP); // reset paginação quando pesquisa muda
            }}
          />
        </View>

        <TouchableOpacity
          style={estilos.botaoFiltroIcone}
          onPress={() => setFiltroVisivel(true)}
          accessibilityLabel="Abrir filtros avançados"
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
          <TouchableOpacity
            onPress={() => {
              setErro(null);
              setCarregando(true);
              setVisiveis(PAGE_STEP);
              (async () => {
                try {
                  const resp = await fetch('http://10.0.2.2:8000/carros');
                  const json = await resp.json();
                  setCarros(json.carros || json || []);
                } catch {
                  setErro('Falha ao carregar os carros. Verifique sua conexão.');
                } finally {
                  setCarregando(false);
                }
              })();
            }}
            style={estilos.botaoTentarNovamente}
          >
            <Text style={estilos.textoBotao}>Tentar novamente</Text>
          </TouchableOpacity>
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

      {/* Modal de filtros */}
      <Modal visible={filtroVisivel} animationType="slide" transparent>
        <View style={estilos.sobreposicaoModal}>
          <View style={estilos.conteudoModal}>
            <TouchableOpacity style={estilos.botaoFechar} onPress={fecharModal}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={estilos.tituloModal}>Filtros</Text>

            <ScrollView style={estilos.scrollFiltros}>
              <Text style={{ textAlign: 'center', color: '#999', marginBottom: 12 }}>
                Use os filtros para refinar a busca (visual por enquanto).
              </Text>

              <View style={estilos.secaoFiltro}>
                <Text style={estilos.labelFiltro}>Ano</Text>
                <View style={estilos.pickerContainer}>
                  <Picker
                    selectedValue={selectedAno}
                    onValueChange={(val) => setSelectedAno(val)}
                    style={estilos.picker}
                  >
                    <Picker.Item label="Todos os anos" value={null} />
                    {Array.from({ length: 2025 - 2010 + 1 }, (_, i) => 2025 - i).map((ano) => (
                      <Picker.Item key={ano} label={String(ano)} value={ano} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={estilos.secaoFiltro}>
                <Text style={estilos.labelFiltro}>Categoria</Text>
                <View style={estilos.pickerContainer}>
                  <Picker
                    selectedValue={selectedCategoria}
                    onValueChange={(val) => setSelectedCategoria(val)}
                    style={estilos.picker}
                  >
                    <Picker.Item label="Todas" value={null} />
                    {opcoesFiltros.categorias.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={estilos.secaoFiltro}>
                <Text style={estilos.labelFiltro}>Marcas</Text>
                {opcoesFiltros.marcas.map((marca) => {
                  const checked = selectedMarcas.includes(marca);
                  return (
                    <View key={marca} style={estilos.checkboxLinha}>
                      <Checkbox
                        status={checked ? 'checked' : 'unchecked'}
                        onPress={() => toggleMarcaSelecionada(marca)}
                      />
                      <Text style={estilos.textoCheckbox}>{marca}</Text>
                    </View>
                  );
                })}
                {opcoesFiltros.marcas.length === 0 && (
                  <Text style={estilos.textoSemOpcao}>Nenhuma marca disponível</Text>
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[estilos.botaoAplicar, { flex: 1, backgroundColor: '#eee' }]}
                onPress={() => {
                  // limpar filtros
                  setSelectedAno(null);
                  setSelectedCategoria(null);
                  setSelectedMarcas([]);
                }}
              >
                <Text style={[estilos.textoBotao, { color: '#000' }]}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.botaoAplicar, { flex: 1 }]}
                onPress={() => {
                  // aplicar — na versão atual os filtros já são reativos, então só fechar o modal
                  setVisiveis(PAGE_STEP);
                  setFiltroVisivel(false);
                }}
              >
                <Text style={estilos.textoBotao}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barra de navegação inferior */}
      <View style={estilos.barraNavegacao}>
        <TouchableOpacity
          style={estilos.iconeNavegacao}
          onPress={() => router.push('/screens/home')}
        >
          <Ionicons name="home" size={24} color="#2196F3" />
          <Text style={estilos.textoNavegacaoAtivo}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.iconeNavegacao}
          onPress={() => router.push('/screens/telafavoritos')}
        >
          <Ionicons name="heart" size={24} color="#888" />
          <Text style={estilos.textoNavegacao}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.iconeNavegacao}
          
        >
          <Ionicons name="person" size={24} color="#888" />
          <Text style={estilos.textoNavegacao}>Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.iconeNavegacao}
          
        >
          <Ionicons name="settings" size={24} color="#888" />
          <Text style={estilos.textoNavegacao}>Config.</Text>
        </TouchableOpacity>
      </View>
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
  botaoTentarNovamente: { backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 5 },
  textoBotao: { color: '#fff', fontWeight: 'bold' },
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
  textoSemOpcao: { fontStyle: 'italic', color: '#888', marginLeft: 30 },
  botaoAplicar: { backgroundColor: '#2196F3', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  scrollFiltros: { maxHeight: 400, marginBottom: 16 },

  barraNavegacao: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  iconeNavegacao: { alignItems: 'center', flex: 1 },
  textoNavegacao: { fontSize: 12, color: '#888', marginTop: 4 },
  textoNavegacaoAtivo: { fontSize: 12, color: '#2196F3', fontWeight: 'bold', marginTop: 4 },
});

export default TelaInicial;
