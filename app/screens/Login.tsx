// app/screens/Login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    try {
      const response = await fetch("http://10.0.2.2:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert("Sucesso", data.message || "Login realizado!");
      router.push("/screens/home");
      }else {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.detail || "Credenciais inválidas");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo-temaClaro.png")}
        style={{ width: 150, height: 150, alignSelf: "center", marginBottom: 20 }}
      />

      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/screens/Cadastro")}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/screens/home")}>
        <Text style={styles.link}>Continuar sem Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 30, color: "#333" },
  input: { height: 50, backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: "#ddd" },
  button: { backgroundColor: "#007BFF", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 15 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  link: { textAlign: "center", color: "#007BFF", fontSize: 16 },
});
