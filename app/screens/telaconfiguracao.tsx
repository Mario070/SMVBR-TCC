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
import { API_BASE_URL } from "../config";
import BarraNavegacao from "../components/BarraNavegacao";

export default function TelaConfiguracao() {
  const handleAlterarNome = () => {
    router.push("/screens/AlterarNome");
  };
  const handleAlterarSenha = () => {
    router.push("/screens/AlterarSenha");
  };

  const handleAlterarEmail = () => {
    router.push("/screens/AlterarEmail");
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

            const resp = await fetch(`${API_BASE_URL}/usuario`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario_id: parseInt(usuario_id) }),
            });

            const data = await resp.json();

            if (resp.ok) {
              Alert.alert("Sucesso", data.detail);
              await AsyncStorage.clear();
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
    // Usar um Fragment <> para envolver a ScrollView e a BarraNavegacao
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Configurações</Text>

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

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Outras Ações</Text>
          <TouchableOpacity
            style={styles.itemRed}
            onPress={handleDeletarConta}
          >
            <View style={styles.itemContent}>
              <Text style={styles.itemTitleRed}>Deletar Conta</Text>
              <Text style={styles.itemDescriptionRed}>Excluir permanentemente sua conta</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BarraNavegacao telaAtiva="configuracoes" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    paddingBottom: 100, // Adicionar espaço para a barra de navegação
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    marginLeft: 0,
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
    color: "#FF3B30",
    fontWeight: "500",
  },
  itemDescriptionRed: {
    fontSize: 13,
    color: "#FF7878",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginLeft: 20,
  },
});
