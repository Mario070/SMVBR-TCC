import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function AlterarNome() {
  const [nome, setNome] = useState<string>("");
  const [senhaAtual, setSenhaAtual] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchNome = async () => {
      const usuario_nome = await AsyncStorage.getItem("usuario_nome");
      if (usuario_nome) setNome(usuario_nome);
    };
    fetchNome();
  }, []);

  const handleAlterarNome = async () => {
    if (!nome.trim() || !senhaAtual) {
      Alert.alert("Erro", "Preencha o nome e sua senha atual.");
      return;
    }

    try {
      setLoading(true);
      const usuario_id = await AsyncStorage.getItem("usuario_id");
      if (!usuario_id) {
        Alert.alert("Erro", "Usuário não encontrado. Faça login novamente.");
        return;
      }

      const response = await fetch("http://10.0.2.2:8000/usuario/nome", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: parseInt(usuario_id),
          novo_nome: nome.trim(),
          senha: senhaAtual
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erro", data.detail || "Erro ao atualizar nome");
        return;
      }

      Alert.alert("Sucesso", "Nome atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);

      await AsyncStorage.setItem("usuario_nome", nome.trim());

    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Alterar Nome</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Informações da Conta</Text>
          <View style={styles.itemInput}>
            <TextInput
              style={styles.input}
              placeholder="Novo Nome"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.itemInput}>
            <TextInput
              style={styles.input}
              placeholder="Senha atual"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              secureTextEntry
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleAlterarNome}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar novo nome</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5", paddingTop: 20 },
  headerTitle: { fontSize: 34, fontWeight: "bold", color: "#1E1E1E", marginVertical: 20, marginHorizontal: 20 },
  section: { backgroundColor: "#FFFFFF", borderRadius: 15, marginHorizontal: 15, marginBottom: 20, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  sectionHeader: { fontSize: 16, fontWeight: "600", color: "#666666", paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
  itemInput: { paddingHorizontal: 20, paddingVertical: 10 },
  input: { height: 40, fontSize: 17, color: "#1E1E1E", padding: 0 },
  separator: { height: 1, backgroundColor: "#EEEEEE", marginLeft: 20 },
  saveButton: { backgroundColor: "#007AFF", padding: 15, borderRadius: 10, alignItems: "center", marginHorizontal: 15, marginTop: 30, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  saveButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
});
