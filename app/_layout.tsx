import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from './theme';

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack>
        <Stack.Screen name="screens/Login" options={{ headerShown: false }} />
        <Stack.Screen name="screens/Cadastro" options={{ title: 'Cadastro' }} />
        <Stack.Screen name="screens/home" options={{ title: 'Home' }} />
        <Stack.Screen name="screens/telafavoritos" options={{ title: 'Favoritos' }} />
        <Stack.Screen name="detalhes/[id]" options={{ title: 'Detalhes do carro', headerShown: true }} />
      </Stack>
    </PaperProvider>
  );
}