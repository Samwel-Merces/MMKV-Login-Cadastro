import { MMKV } from 'react-native-mmkv';

// Instância única do MMKV (usada somente nas telas de Login e de Cadastro)
export const storage = new MMKV({ id: 'samuca-sorvetto-storage' });
