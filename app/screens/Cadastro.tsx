// app/screens/Cadastro.tsx
import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { API_BASE_URL } from "../config";
import { theme } from "../theme";
import { Button, Text, TextInput } from "react-native-paper";

export default function Cadastro() {
  const [nome, setNome] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Conta criada com sucesso!");
        router.push("/screens/Login");
      } else {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.detail || "Erro ao cadastrar");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Cadastro
      </Text>

      <TextInput
        label="Nome completo"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
      />

      <TextInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleCadastro}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor={theme.colors.secondary} // Usando a cor secundária do tema
      >
        Cadastrar
      </Button>

      <Button onPress={() => router.push("/screens/Login")} style={styles.linkButton}>
        Já tem conta? Faça login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    padding: 5,
  },
  linkButton: {
    marginTop: 10,
  },
});
