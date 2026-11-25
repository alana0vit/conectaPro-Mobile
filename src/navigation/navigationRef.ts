import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Ref singleton: permite navegar e ler a rota atual
// a partir de componentes renderizados FORA do Stack.Navigator
// pro ChatWidget flutuante).
export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();
