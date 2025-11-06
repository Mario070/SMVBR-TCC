// O nome do arquivo deve ser AlterarEmail.tsx
import React, { useState } from "react";
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
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AlterarEmail() {
  const [novoEmail, setNovoEmail] = useState<string>("");
  const [confirmarSenha, setConfirmarSenha] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAlterarEmail = async () => {
    if (!novoEmail || !confirmarSenha) {
      Alert.alert("Erro", "Preencha o novo e-mail e sua senha atual.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(novoEmail)) {
      Alert.alert("Erro", "O e-mail inserido não é válido.");
      return;
    }

    try {
      setLoading(true);

      const usuario_id = await AsyncStorage.getItem("usuario_id");
      if (!usuario_id) {
        Alert.alert("Erro", "Usuário não encontrado. Faça login novamente.");
        return;
      }

      const response = await fetch("http://10.0.2.2:8000/usuario/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: parseInt(usuario_id),
          novo_email: novoEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erro", data.detail || "Erro ao atualizar e-mail");
        return;
      }

      Alert.alert("Sucesso", data.detail || "E-mail atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);

      // Se estiver armazenando o email no AsyncStorage, atualiza
      await AsyncStorage.setItem("usuario_email", novoEmail.trim());

    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Erro de conexão com o servidor.");
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
        <Text style={styles.headerTitle}>Alterar E-mail</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Informações da Conta</Text>
          <View style={styles.itemInput}>
            <TextInput
              style={styles.input}
              placeholder="Novo E-mail"
              value={novoEmail}
              onChangeText={setNovoEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.itemInput}>
            <TextInput
              style={styles.input}
              placeholder="Confirme sua senha atual"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleAlterarEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar novo e-mail</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    paddingTop: 20,
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
  itemInput: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  input: {
    height: 40,
    fontSize: 17,
    color: "#1E1E1E",
    padding: 0,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginLeft: 20,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});