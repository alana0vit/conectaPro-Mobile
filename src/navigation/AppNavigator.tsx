import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import Login from '../pages/Login/Login';
import Cadastro from '../pages/Cadastro/Cadastro';
import Home from '../pages/Home/Home';
import DashboardCliente from '../pages/DashboardCliente/DashboardCliente';
import DashboardProfissional from '../pages/DashboardProfissional/DashboardProfissional';
import EditarPerfil from '../pages/EditarPerfil/EditarPerfil';
import EditarDemanda from '../pages/EditarDemanda/EditarDemanda';
import ListaProf from '../pages/ListaProf/ListaProf';
import SolicServico from '../pages/SolicServico/SolicServico';
import DetalhesDemanda from '../pages/DetalhesDemanda/DetalhesDemanda';
import FAQ from '../pages/FAQ/FAQ';
import FaleConosco from '../pages/FaleConosco/FaleConosco';
import TermosDeUso from '../pages/TermosDeUso/TermosDeUso';
import EsqueceuSenha from '../pages/EsqueceuSenha/EsqueceuSenha';
import RedefinicaoSenha from '../pages/RedefinicaoSenha/RedefinicaoSenha';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="DashboardCliente" component={DashboardCliente} />
      <Stack.Screen name="DashboardProfissional" component={DashboardProfissional} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
      <Stack.Screen name="EditarDemanda" component={EditarDemanda} />
      <Stack.Screen name="ListaProf" component={ListaProf} />
      <Stack.Screen name="SolicServico" component={SolicServico} />
      <Stack.Screen name="DetalhesDemanda" component={DetalhesDemanda} />
      <Stack.Screen name="FAQ" component={FAQ} />
      <Stack.Screen name="FaleConosco" component={FaleConosco} />
      <Stack.Screen name="TermosDeUso" component={TermosDeUso} />
      <Stack.Screen name="EsqueceuSenha" component={EsqueceuSenha} />
      <Stack.Screen name="RedefinicaoSenha" component={RedefinicaoSenha} />
    </Stack.Navigator>
  );
}
