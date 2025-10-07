// Importações necessárias do React e do React Native
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Componente principal da tela inicial
const TelaInicial = () => {
  // Estados
  const [filtroVisivel, setFiltroVisivel] = useState(false);
  const [filtroAno, setFiltroAno] = useState(false);
  const [textoPesquisa, setTextoPesquisa] = useState('');

  // Dados dos carros vindos do backend
  const [carros, setCarros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // 🔁 Busca os carros do backend FastAPI
  useEffect(() => {
    const buscarCarrosDoBanco = async () => {
      try {
        setCarregando(true);
        setErro(null);

        const resposta = await fetch("http://10.0.2.2:8000/carros");

        if (!resposta.ok) {
          throw new Error(`Erro da API: ${resposta.status}`);
        }

        const dados = await resposta.json();
        console.log('Resposta da API /carros:', dados);

        setCarros(dados.carros || dados);
      } catch (erro: any) {
        console.error('Erro ao buscar carros:', erro);
        setErro('Falha ao carregar os carros. Verifique sua conexão.');
      } finally {
        setCarregando(false);
      }
    };

    buscarCarrosDoBanco();
  }, []);

  // 🔍 Filtra os carros localmente
  const carrosFiltrados = carros.filter((carro) => {
    const texto = textoPesquisa.toLowerCase();
    return (
      carro?.marca?.toLowerCase().includes(texto) ||
      carro?.modelo?.toLowerCase().includes(texto) ||
      carro?.nome?.toLowerCase().includes(texto) ||
      carro?.ano?.toString().includes(texto)
    );
  });

  // 🧩 Renderização dos cards
  const renderizarCarro = ({ item }: { item: any }) => {
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
    const imagemUri =
      typeof item.imagem === 'string' && item.imagem.length > 0
        ? item.imagem
        : 'https://cdn-icons-png.flaticon.com/512/744/744465.png';

    return (
      <View style={estilos.cartaoCarro}>
        <Image source={{ uri: imagemUri }} style={estilos.imagemCarro} />
        <Text style={estilos.nomeCarro}>{marca} {modelo}</Text>
        <Text style={estilos.precoCarro}>Ano: {ano}</Text>
        {preco && <Text style={estilos.precoCarro}>Preço: {preco}</Text>}
      </View>
    );
  };

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
            onChangeText={setTextoPesquisa}
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
              setCarregando(true);
              setErro(null);
            }}
            style={estilos.botaoTentarNovamente}
          >
            <Text style={estilos.textoBotao}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={carrosFiltrados}
          renderItem={renderizarCarro}
          keyExtractor={(item, index) =>
            item?.veiculo_id ? String(item.veiculo_id) : String(index)
          }
          numColumns={2}
          contentContainerStyle={estilos.conteudoFlatList}
          ListEmptyComponent={
            <Text style={estilos.textoVazio}>Nenhum carro encontrado.</Text>
          }
        />
      )}

      {/* Modal de filtros */}
      <Modal visible={filtroVisivel} animationType="slide" transparent>
        <View style={estilos.sobreposicaoModal}>
          <View style={estilos.conteudoModal}>
            <TouchableOpacity
              style={estilos.botaoFechar}
              onPress={() => setFiltroVisivel(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={estilos.tituloModal}>Filtros</Text>
            <View style={estilos.opcaoFiltro}>
              <Text>Ano</Text>
              <Switch value={filtroAno} onValueChange={setFiltroAno} />
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔽 Barra de navegação inferior (copiada do outro código) */}
      <View style={estilos.barraNavegacaoInferior}>
        <TouchableOpacity style={estilos.itemNavegacao}>
          <Ionicons name="home" size={24} color="#2196F3" />
          <Text style={[estilos.textoNavegacao, { color: '#2196F3' }]}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.itemNavegacao}>
          <Ionicons name="bookmark-outline" size={24} color="#666" />
          <Text style={estilos.textoNavegacao}>Salvos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.itemNavegacao}>
          <Ionicons name="swap-horizontal" size={24} color="#666" />
          <Text style={estilos.textoNavegacao}>Comparar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.itemNavegacao}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={estilos.textoNavegacao}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 💅 Estilos
const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  containerPesquisaFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  containerPesquisa: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  iconePesquisa: {
    marginRight: 8,
  },
  inputPesquisa: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  botaoFiltroIcone: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudoFlatList: {
    paddingBottom: 80, // espaço para a barra inferior
  },
  cartaoCarro: {
    width: '45%',
    margin: '2.5%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imagemCarro: {
    width: '100%',
    height: 100,
  },
  nomeCarro: {
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  precoCarro: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontSize: 14,
    color: '#2196F3',
  },
  centralizar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCarregando: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  textoErro: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 10,
  },
  botaoTentarNovamente: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textoVazio: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  sobreposicaoModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  conteudoModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  botaoFechar: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  tituloModal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  opcaoFiltro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // 🔽 Estilos da barra de navegação inferior
  barraNavegacaoInferior: {
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
  },
  itemNavegacao: {
    alignItems: 'center',
  },
  textoNavegacao: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
});

export default TelaInicial;
