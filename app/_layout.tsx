import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
//Isso diz ao Expo Router (o novo sistema de navegação do Expo) que sua app começa na tela de Login. 
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="screens/Login" options={{ headerShown: false }} />
      <Stack.Screen name="screens/Cadastro" options={{ title: 'Cadastro' }} />
      <Stack.Screen name="screens/home" options={{ title: 'Home' }} />
      <Stack.Screen name="detalhes/[id]" options={{ title: 'Detalhes do carro', headerShown: true }} />
    </Stack>
  );
}