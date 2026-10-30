import { Alert, Platform } from 'react-native';

// Alert.alert não funciona no navegador: na web usamos window.alert
export const mostrarAlerta = (titulo, mensagem) => {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
};
