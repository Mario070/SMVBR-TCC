import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TelaFavoritos = () => {
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);

  // 🔹 Busca os favoritos do usuário logado
  useEffect(() => {
    const carregarFavoritos = async () => {
      try {
        setCarregando(true);
        const usuarioId = await AsyncStorage.getItem("usuario_id");

        if (!usuarioId) {
          Alert.alert("Erro", "Usuário não identificado!");
          setCarregando(false);
          return;
        }

        const response = await fetch(
          `http://10.0.2.2:8000/veiculos_favoritos/${usuarioId}`
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar veículos favoritos");
        }

        const data = await response.json();
        setFavoritos(data);
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        Alert.alert("Erro", "Não foi possível carregar os favoritos.");
      } finally {
        setCarregando(false);
      }
    };

    carregarFavoritos();
  }, []);

  // 🔹 Alterna a seleção de carros (máx. 2)
  const toggleSelecao = (id: number) => {
    setSelecionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      } else {
        Alert.alert("Limite atingido", "Você só pode comparar até 2 carros.");
        return prev;
      }
    });
  };

  // 🔹 Navega para a tela de comparação
  const handleComparar = () => {
    if (selecionados.length !== 2) {
      Alert.alert("Seleção inválida", "Selecione exatamente 2 carros.");
      return;
    }

  };

  // 🔹 Renderiza cada card de veículo
  const renderizarFavorito = ({ item }: { item: any }) => {
    const imagemUri =
      item.imagem?.trim() || "https://cdn-icons-png.flaticon.com/512/744/744465.png";

    return (
      <View style={estilos.cartaoCarro}>
        <View style={estilos.checkboxContainer}>
          <Checkbox
            status={selecionados.includes(item.veiculo_id) ? "checked" : "unchecked"}
            onPress={() => toggleSelecao(item.veiculo_id)}
          />
        </View>

        <TouchableOpacity
          style={estilos.conteudoCarro}
          onPress={() => router.push(`/detalhes/${item.veiculo_id}`)}
        >
          <Image source={{ uri: imagemUri }} style={estilos.imagemCarro} />
          <Text style={estilos.nomeCarro}>
            {item.marca} {item.modelo}
          </Text>
          <Text style={estilos.precoCarro}>Ano: {item.ano}</Text>
          {item.tipo_combustivel && (
            <Text style={estilos.precoCarro}>
              Combustível: {item.tipo_combustivel}
            </Text>
          )}
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
            data={favoritos}
            renderItem={renderizarFavorito}
            keyExtractor={(item) => String(item.veiculo_id)}
            numColumns={2}
            contentContainerStyle={estilos.conteudoFlatList}
            ListEmptyComponent={
              <View style={estilos.centralizar}>
                <Text style={estilos.textoVazio}>Nenhum carro favorito ainda.</Text>
              </View>
            }
          />

          {/* 🔹 Botão de Comparar */}
          <TouchableOpacity
            style={[
              estilos.botaoComparar,
              { opacity: selecionados.length === 2 ? 1 : 0.5 },
            ]}
            disabled={selecionados.length !== 2}
            onPress={handleComparar}
          >
            <Ionicons name="swap-horizontal" size={20} color="#fff" />
            <Text style={estilos.textoBotaoComparar}>
              Comparar ({selecionados.length}/2)
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* 🔹 Barra de Navegação Inferior */}
      <View style={estilos.barraNavegacao}>
        <TouchableOpacity
          style={estilos.iconeNavegacao}
          onPress={() => router.push("/screens/home")}
        >
          <Ionicons name="home" size={24} color="#2196F3" />
          <Text style={estilos.textoNavegacaoAtivo}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.iconeNavegacao}
          onPress={() => router.push("/screens/telafavoritos")}
        >
          <Ionicons name="heart" size={24} color="#888" />
          <Text style={estilos.textoNavegacao}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.iconeNavegacao}>
          <Ionicons name="person" size={24} color="#888" />
          <Text style={estilos.textoNavegacao}>Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.iconeNavegacao}>
          <Ionicons name="settings" size={24} color="#888" />
          <Text style={estilos.textoNavegacao}>Config.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TelaFavoritos;

// ✅ Usa exatamente seus estilos originais
const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#000",
  },
  cartaoCarro: {
    width: "45%",
    margin: "2.5%",
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: "relative",
  },
  checkboxContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  conteudoCarro: {
    flex: 1,
  },
  imagemCarro: {
    width: "100%",
    height: 100,
  },
  nomeCarro: {
    padding: 8,
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  precoCarro: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontSize: 14,
    color: "#2196F3",
  },
  conteudoFlatList: {
    paddingBottom: 80,
  },
  botaoComparar: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  textoBotaoComparar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  centralizar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textoCarregando: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  textoVazio: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  barraNavegacao: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  iconeNavegacao: {
    alignItems: "center",
    flex: 1,
  },
  textoNavegacao: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  textoNavegacaoAtivo: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "bold",
    marginTop: 4,
  },
});
