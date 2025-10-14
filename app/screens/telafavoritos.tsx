// app/favoritos.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper';

// 🔹 MODELO DE TELA DE FAVORITOS
// Esta tela exibe os carros favoritos em cards e permite selecionar 2 para comparação.
// ➤ Você deve implementar a lógica de:
//    - Carregar os carros favoritos (ex: de AsyncStorage, contexto ou API)
//    - Gerenciar seleção de até 2 carros
//    - Navegar para a tela de comparação com os IDs selecionados

const TelaFavoritos = () => {
  // 🔸 IMPLEMENTAR: estado para carregar favoritos (ex: const [favoritos, setFavoritos] = useState<Carro[]>([]))
  // 🔸 IMPLEMENTAR: estado para carros selecionados (ex: const [selecionados, setSelecionados] = useState<number[]>([]))
  // 🔸 IMPLEMENTAR: estado de carregamento (ex: const [carregando, setCarregando] = useState(true))

  // 🔸 IMPLEMENTAR: função para alternar seleção de um carro (com limite de 2)
  const toggleSelecao = (id: number) => {
    // ➤ Lógica: adicionar/remover ID de 'selecionados'
    // ➤ Alerta se tentar selecionar mais de 2
  };

  // 🔸 IMPLEMENTAR: função para comparar os 2 carros selecionados
  const handleComparar = () => {
    // ➤ Verificar se exatamente 2 carros estão selecionados
    // ➤ Navegar para /comparar com os IDs (ex: router.push(`/comparar?ids=${id1},${id2}`))
  };

  // 🔸 IMPLEMENTAR: dados reais dos favoritos (aqui está um exemplo estático apenas para layout)
  const dadosExemplo = [
    {
      id: 1,
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      preco: 'R$ 120.000',
      imagem: 'https://example.com/corolla.jpg',
    },
    {
      id: 2,
      marca: 'Honda',
      modelo: 'Civic',
      ano: 2022,
      preco: 'R$ 110.000',
      imagem: 'https://example.com/civic.jpg',
    },
  ];

  // 🔸 IMPLEMENTAR: condição real de carregamento
  const carregando = false;

  const renderizarFavorito = ({ item }: { item: any }) => {
    const imagemUri = item.imagem?.trim() || 'https://cdn-icons-png.flaticon.com/512/744/744465.png';

    return (
      <View style={estilos.cartaoCarro}>
        {/* Checkbox para seleção de comparação */}
        <View style={estilos.checkboxContainer}>
          <Checkbox
            status={'unchecked'} // 🔸 IMPLEMENTAR: 'checked' se item.id estiver em 'selecionados'
            onPress={() => toggleSelecao(item.id)}
          />
        </View>

        {/* Card clicável para ver detalhes */}
        <TouchableOpacity
          style={estilos.conteudoCarro}
          onPress={() => {
            // 🔸 IMPLEMENTAR: navegar para /detalhes/[id]
          }}
        >
          <Image source={{ uri: imagemUri }} style={estilos.imagemCarro} />
          <Text style={estilos.nomeCarro}>{item.marca} {item.modelo}</Text>
          <Text style={estilos.precoCarro}>Ano: {item.ano}</Text>
          {item.preco && <Text style={estilos.precoCarro}>Preço: {item.preco}</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Carros Favoritos</Text>

      {carregando ? (
        <View style={estilos.centralizar}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={estilos.textoCarregando}>Carregando...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={dadosExemplo} // 🔸 IMPLEMENTAR: usar o estado real de 'favoritos'
            renderItem={renderizarFavorito}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            contentContainerStyle={estilos.conteudoFlatList}
            ListEmptyComponent={
              <View style={estilos.centralizar}>
                <Text style={estilos.textoVazio}>Nenhum carro favorito ainda.</Text>
              </View>
            }
          />

          {/* Botão de Comparar */}
          <TouchableOpacity
            style={[estilos.botaoComparar,
              // 🔸 IMPLEMENTAR: desativar se selecionados.length !== 2
              { opacity: 0.5 }, // exemplo: ativar apenas quando 2 selecionados
            ]}
            disabled={true} // 🔸 IMPLEMENTAR: true se !== 2 selecionados
            onPress={handleComparar}
          >
            <Ionicons name="swap-horizontal" size={20} color="#fff" />
            <Text style={estilos.textoBotaoComparar}>
              Comparar (0/2) {/* 🔸 IMPLEMENTAR: mostrar contagem real */}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* 👇👇👇 BARRA DE NAVEGAÇÃO INFERIOR */}
            <View style={estilos.barraNavegacao}>
              <TouchableOpacity
                style={estilos.iconeNavegacao}
                onPress={() => {
                  // 🔸 IMPLEMENTAR: navegar para tela de início (ex: router.push('/'))
                  // Como já estamos na tela inicial, pode não fazer nada ou recarregar
                }}
              >
                <Ionicons name="home" size={24} color="#2196F3" />
                <Text style={estilos.textoNavegacaoAtivo} onPress={() => {
                  // 🔸 IMPLEMENTAR: navegar para tela de favoritos
                  router.push('/screens/home');
                }}>Início</Text>
              </TouchableOpacity>
      
              <TouchableOpacity
                style={estilos.iconeNavegacao}
                onPress={() => {
                  // 🔸 IMPLEMENTAR: navegar para tela de favoritos
                  router.push('/screens/telafavoritos');
                }}
              >
                <Ionicons name="heart" size={24} color="#888" />
                <Text style={estilos.textoNavegacao}>Favoritos</Text>
              </TouchableOpacity>
      
              <TouchableOpacity
                style={estilos.iconeNavegacao}
                onPress={() => {
                  // 🔸 IMPLEMENTAR: navegar para tela de perfil
                  
                }}
              >
                <Ionicons name="person" size={24} color="#888" />
                <Text style={estilos.textoNavegacao}>Perfil</Text>
              </TouchableOpacity>
      
              <TouchableOpacity
                style={estilos.iconeNavegacao}
                onPress={() => {
                  // 🔸 IMPLEMENTAR: navegar para tela de configurações
                  
                }}
              >
                <Ionicons name="settings" size={24} color="#888" />
                <Text style={estilos.textoNavegacao}>Config.</Text>
              </TouchableOpacity>
            </View>

    </View>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000',
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
    position: 'relative',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  conteudoCarro: {
    flex: 1,
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
  conteudoFlatList: {
    paddingBottom: 80,
  },
  botaoComparar: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  textoBotaoComparar: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  textoVazio: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },

  // 👇 ESTILOS DA BARRA DE NAVEGAÇÃO INFERIOR
  barraNavegacao: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  iconeNavegacao: {
    alignItems: 'center',
    flex: 1,
  },
  textoNavegacao: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  textoNavegacaoAtivo: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    marginTop: 4,
  },

});

export default TelaFavoritos;