import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Definimos os tipos para a propriedade do componente
type BarraNavegacaoProps = {
  telaAtiva: 'home' | 'favoritos' | 'configuracoes';
};

const BarraNavegacao = ({ telaAtiva }: BarraNavegacaoProps) => {
  const router = useRouter();

  // Função para verificar se a aba está ativa e retornar o estilo correto
  const getEstiloTexto = (tela: string) => {
    return telaAtiva === tela ? estilos.textoNavegacaoAtivo : estilos.textoNavegacao;
  };

  const getCorIcone = (tela: string) => {
    return telaAtiva === tela ? '#2196F3' : '#888';
  };

  return (
    <View style={estilos.barraNavegacao}>
      {/* Botão Home */}
      <TouchableOpacity
        style={estilos.iconeNavegacao}
        onPress={() => router.replace('/screens/home')}
      >
        <Ionicons name="home-outline" size={24} color={getCorIcone('home')} />
        <Text style={getEstiloTexto('home')}>Início</Text>
      </TouchableOpacity>

      {/* Botão Favoritos */}
      <TouchableOpacity
        style={estilos.iconeNavegacao}
        onPress={() => router.replace('/screens/telafavoritos')}
      >
        <Ionicons name="heart-outline" size={24} color={getCorIcone('favoritos')} />
        <Text style={getEstiloTexto('favoritos')}>Favoritos</Text>
      </TouchableOpacity>

      {/* Botão Configurações */}
      <TouchableOpacity
        style={estilos.iconeNavegacao}
        onPress={() => router.replace('/screens/telaconfiguracao')}
      >
        <Ionicons name="settings-outline" size={24} color={getCorIcone('configuracoes')} />
        <Text style={getEstiloTexto('configuracoes')}>Config.</Text>
      </TouchableOpacity>
    </View>
  );
};

const estilos = StyleSheet.create({
  barraNavegacao: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  iconeNavegacao: {
    alignItems: 'center',
    flex: 1,
  },
  textoNavegacao: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  textoNavegacaoAtivo: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default BarraNavegacao;
