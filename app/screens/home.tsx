import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>

        <Image source={require('../../assets/logo-temaClaro.png')} style={{ width: 300, height: 300, alignSelf: 'center', marginBottom: 20 }} />

      <Text style={styles.title}>Bem-vindo App SMVBr!</Text>
      <Text style={styles.subtitle}>aaaaaaaa.</Text>

      {/* Botão de logout */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/Login')}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    },
    title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    },
    subtitle: {
    fontSize: 18,
    color: '#666',
    },
    button: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    },
    buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    },
});