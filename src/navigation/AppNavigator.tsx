import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login';
import Cadastro from '../pages/Cadastro/Cadastro';
import DashboardCliente from '../pages/DashboardCliente/DashboardCliente';
import DashboardProfissional from '../pages/DashboardProfissional/DashboardProfissional';
import DetalhesSolicitacao from '../pages/DetalhesSolicitacao/DetalhesSolicitacao';
import EditarDemanda from '../pages/EditarDemanda/EditarDemanda';
import EditarPerfil from '../pages/EditarPerfil/EditarPerfil';
import FaleConosco from '../pages/FaleConosco/FaleConosco';
import FAQ from '../pages/FAQ/FAQ';
import ListaProf from '../pages/ListaProf/ListaProf';
import PerfilCliente from '../pages/PerfilCliente/PerfilCliente';
import PerfilProfissional from '../pages/PerfilProfissional/PerfilProfissional';
import SolicServico from '../pages/SolicServico/SolicServico';
import TermosDeUso from '../pages/TermosDeUso/TermosDeUso';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="DashboardCliente" component={DashboardCliente} />
      <Stack.Screen name="DashboardProfissional" component={DashboardProfissional} />
      <Stack.Screen name="DetalhesSolicitacao" component={DetalhesSolicitacao} />
      <Stack.Screen name="EditarDemanda" component={EditarDemanda} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
      <Stack.Screen name="FaleConosco" component={FaleConosco} />
      <Stack.Screen name="FAQ" component={FAQ} />
      <Stack.Screen name="ListaProf" component={ListaProf} />
      <Stack.Screen name="PerfilCliente" component={PerfilCliente} />
      <Stack.Screen name="PerfilProfissional" component={PerfilProfissional} />
      <Stack.Screen name="SolicServico" component={SolicServico} />
      <Stack.Screen name="TermosDeUso" component={TermosDeUso} />
    </Stack.Navigator>
  );
}
