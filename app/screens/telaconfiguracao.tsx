import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
// Certifique-se de que está importado corretamente

export default function TelaConfiguracao() {
  const handleAlterarNome = () => {
    router.push("/screens/AlterarNome"); // ou o caminho correto para sua rota
  };
  const handleAlterarSenha = () => {
    router.push("/screens/AlterarSenha"); // ou o caminho correto para sua rota
  };

  const handleAlterarEmail = () => {
    router.push("/screens/AlterarEmail"); // ou o caminho correto para sua rota
  };

 const handleDeletarConta = async () => {
  Alert.alert(
    "Confirmar Exclusão",
    "Tem certeza que deseja deletar sua conta? Esta ação é irreversível.",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            const usuario_id = await AsyncStorage.getItem("usuario_id");
            if (!usuario_id) {
              Alert.alert("Erro", "Usuário não encontrado no dispositivo.");
              return;
            }

            const resp = await fetch("http://10.0.2.2:8000/usuario", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario_id: parseInt(usuario_id) }),
            });

            const data = await resp.json();

            if (resp.ok) {
              Alert.alert("Sucesso", data.detail);
              // Limpar dados locais
              await AsyncStorage.clear();
              // Redirecionar para Login
              router.replace("/screens/Login");
            } else {
              Alert.alert("Erro", data.detail || "Falha ao deletar conta");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Não foi possível deletar a conta.");
          }
        },
      },
    ]
  );
};

  return (
    <ScrollView style={styles.container}>
      {/* Título da tela */}
      <Text style={styles.headerTitle}>Configurações</Text>

      {/* Seção de Conta */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Conta</Text>
        <TouchableOpacity style={styles.item} onPress={handleAlterarSenha}>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Alterar Senha</Text>
            <Text style={styles.itemDescription}>Mudar sua senha de acesso</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.item} onPress={handleAlterarEmail}>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Alterar E-mail</Text>
            <Text style={styles.itemDescription}>Atualizar seu endereço de e-mail</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.item} onPress={handleAlterarNome}>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Alterar Nome</Text>
            <Text style={styles.itemDescription}>Atualizar seu nome</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Seção de Ações Perigosas */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Outras Ações</Text>
        <TouchableOpacity
          style={styles.itemRed} // Estilo específico para ação de perigo
          onPress={handleDeletarConta}
        >
          <View style={styles.itemContent}>
            <Text style={styles.itemTitleRed}>Deletar Conta</Text>
            <Text style={styles.itemDescriptionRed}>Excluir permanentemente sua conta</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5", // Fundo geral mais claro
  },
  headerTitle: {
    fontSize: 34, // Título maior
    fontWeight: "bold",
    color: "#1E1E1E", // Cor de texto mais escura
    marginVertical: 20,
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: "#FFFFFF", // Fundo branco para as seções em cascata
    borderRadius: 15, // Bordas arredondadas
    marginHorizontal: 15,
    marginBottom: 20,
    overflow: "hidden", // Garante que o borderRadius funcione com separadores
    elevation: 2, // Sombra suave para efeito de cascata Android
    shadowColor: "#000", // Sombra suave para efeito de cascata iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666", // Cor cinza para o cabeçalho da seção
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row", // Para alinhar possível ícone (mesmo que não usado)
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    marginLeft: 0, // Sem ícone, então sem margem extra
  },
  itemTitle: {
    fontSize: 18,
    color: "#1E1E1E",
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 13,
    color: "#888888",
    marginTop: 2,
  },
  itemRed: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  itemTitleRed: {
    fontSize: 18,
    color: "#FF3B30", // Vermelho para ação de perigo
    fontWeight: "500",
  },
  itemDescriptionRed: {
    fontSize: 13,
    color: "#FF7878", // Vermelho mais claro para descrição de perigo
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEEEEE", // Linha cinza clara como separador
    marginLeft: 20, // Alinha com o texto, deixando uma margem à esquerda
  },
});