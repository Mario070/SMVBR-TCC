import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF', // Azul principal
    secondary: '#28a745', // Verde para cadastro
    background: '#F0F2F5', // Fundo da maioria das telas
    surface: '#FFFFFF', // Cor de fundo para 'cards' e seções
    text: '#1E1E1E', // Cor de texto principal
    placeholder: '#A0A0A0', // Cor para placeholders
    error: '#FF3B30', // Vermelho para erros
  },
};