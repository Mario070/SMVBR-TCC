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
import { API_BASE_URL } from "../config";
import BarraNavegacao from "../components/BarraNavegacao";

const TelaFavoritos = () => {
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Mover para dentro para ter acesso aos estilos dinâmicos se necessário no futuro
  const ImagemVeiculo = ({ url }: { url: string }) => {
    const [erro, setErro] = useState(false);
    const imagemUri = !erro && url && url.toLowerCase() !== "imgs/nan" && url.toLowerCase() !== "imagens/nan"
        ? `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
        : "https://cdn-icons-png.flaticon.com/512/744/744465.png";

    return (
      <Image
        source={{ uri: imagemUri }}
        style={styles.imagemCarro}
        resizeMode="cover"
        onError={() => setErro(true)}
      />
    );
  };

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
        const response = await fetch(`${API_BASE_URL}/veiculos_favoritos/${usuarioId}`);
        if (!response.ok) throw new Error("Erro ao buscar veículos favoritos");
        const data = await response.json();
        setFavoritos(data);
      } catch (error) {
        console.error(error);
        Alert.alert("Erro", "Não foi possível carregar os favoritos.");
      } finally {
        setCarregando(false);
      }
    };
    carregarFavoritos();
  }, []);

  const toggleSelecao = (id: number) => {
    setSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) {
        Alert.alert("Limite atingido", "Você só pode comparar até 2 carros.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleComparar = async () => {
    if (selecionados.length !== 2) {
      Alert.alert("Seleção inválida", "Selecione exatamente 2 carros.");
      return;
    }
    try {
      setCarregando(true);
      const [id1, id2] = selecionados;
      const response = await fetch(`${API_BASE_URL}/comparar-carros?id1=${id1}&id2=${id2}`);
      if (!response.ok) throw new Error("Erro ao comparar carros");
      const dadosComparacao = await response.json();
      router.push({
        pathname: "/screens/telaComparar",
        params: { comparacao: JSON.stringify(dadosComparacao) },
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível comparar os carros.");
    } finally {
      setCarregando(false);
    }
  };

  const renderizarFavorito = ({ item }: { item: any }) => {
    return (
      <View style={styles.cartaoCarro}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={selecionados.includes(item.veiculo_id) ? "checked" : "unchecked"}
            onPress={() => toggleSelecao(item.veiculo_id)}
          />
        </View>
        <TouchableOpacity
          style={styles.conteudoCarro}
          onPress={() => {
            const carroPadronizado = { ...item, imagem_url: item.imagem_url && item.imagem_url.toLowerCase() !== "imgs/nan" && item.imagem_url.toLowerCase() !== "imagens/nan" ? `${API_BASE_URL}${item.imagem_url.startsWith("/") ? "" : "/"}${item.imagem_url}` : "https://cdn-icons-png.flaticon.com/512/744/744465.png" };
            const carroString = encodeURIComponent(JSON.stringify(carroPadronizado));
            router.push({ pathname: "/detalhes/[id]", params: { id: String(item.veiculo_id), carro: carroString } });
          }}
        >
          <ImagemVeiculo url={item.imagem_url} />
          <Text style={styles.nomeCarro}>{item.marca} {item.modelo}</Text>
          <Text style={styles.precoCarro}>Ano: {item.ano}</Text>
          {item.tipo_combustivel && (<Text style={styles.precoCarro}>Combustível: {item.tipo_combustivel}</Text>)}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Carros Favoritos</Text>
      {carregando ? (
        <View style={styles.centralizar}><ActivityIndicator size="large" color="#2196F3" /><Text style={styles.textoCarregando}>Carregando...</Text></View>
      ) : (
        <>
          <FlatList data={favoritos} renderItem={renderizarFavorito} keyExtractor={(item) => String(item.veiculo_id)} numColumns={2} contentContainerStyle={styles.conteudoFlatList} ListEmptyComponent={<View style={styles.centralizar}><Text style={styles.textoVazio}>Nenhum carro favorito ainda.</Text></View>} />
          <TouchableOpacity style={[styles.botaoComparar, { opacity: selecionados.length === 2 ? 1 : 0.5 }]} disabled={selecionados.length !== 2} onPress={handleComparar}>
            <Ionicons name="swap-horizontal" size={20} color="#fff" />
            <Text style={styles.textoBotaoComparar}>Comparar ({selecionados.length}/2)</Text>
          </TouchableOpacity>
        </>
      )}
      <BarraNavegacao telaAtiva="favoritos" />
    </View>
  );
};

export default TelaFavoritos;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 16, paddingBottom: 100 },
  titulo: { fontSize: 20, fontWeight: "bold", marginBottom: 16, textAlign: "center", color: "#000" },
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
  checkboxContainer: { position: "absolute", top: 8, right: 8, zIndex: 1 },
  conteudoCarro: { flex: 1 },
  imagemCarro: { width: "100%", height: 100, backgroundColor: "#f0f0f0" },
  nomeCarro: { padding: 8, fontSize: 14, fontWeight: "bold", color: "#000" },
  precoCarro: { paddingHorizontal: 8, paddingBottom: 8, fontSize: 14, color: "#2196F3" },
  conteudoFlatList: { paddingBottom: 80 },
  botaoComparar: {
    position: "absolute",
    bottom: 100, // Ajustado para ficar acima da barra de navegação
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
  textoBotaoComparar: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  centralizar: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoCarregando: { marginTop: 10, fontSize: 16, color: "#666" },
  textoVazio: { fontSize: 16, color: "#999", textAlign: "center" },
});