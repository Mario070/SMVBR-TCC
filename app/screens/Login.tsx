import React, { useState } from "react";
import { View, StyleSheet, Alert, Image } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { API_BASE_URL } from "../config";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();
      console.log("Resposta do backend:", data);

      if (response.ok) {
        const usuarioNome = Array.isArray(data.nome) ? data.nome[0] : data.nome;
        const message = Array.isArray(data.message) ? data.message[0] : data.message;

        await AsyncStorage.setItem("usuario_id", String(data.usuario_id));
        await AsyncStorage.setItem("usuario_nome", usuarioNome);

        Alert.alert("Sucesso", message || "Login realizado!");
        router.push("/screens/home");
      } else {
        const errorMsg = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        Alert.alert("Erro", errorMsg || "Credenciais inválidas");
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
      <Image
        source={require("../../assets/logo-temaClaro.png")}
        style={styles.logo}
      />

      <Text variant="headlineLarge" style={styles.title}>
        Login
      </Text>

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
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Entrar
      </Button>

      <Button
        onPress={() => router.push("/screens/Cadastro")}
        style={styles.linkButton}
      >
        Não tem conta? Cadastre-se
      </Button>

      <Button
         onPress={async () => {
          try {
            // 🔹 Remove qualquer dado de login antes de continuar sem login
            await AsyncStorage.removeItem("usuario_id");
            await AsyncStorage.removeItem("usuario_nome");
            console.log("Dados do usuário removidos — modo visitante ativo.");
          } catch (error) {
            console.error("Erro ao limpar dados do usuário:", error);
          }

          // Depois redireciona normalmente
          router.push("/screens/home");
        }}
        style={styles.linkButton}
      >
        Continuar sem Login
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
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 20,
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
