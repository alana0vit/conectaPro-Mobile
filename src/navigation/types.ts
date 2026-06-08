export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Cadastro: undefined;
  DashboardCliente: undefined;
  DashboardProfissional: undefined;
  DetalhesSolicitacao: { id: number };
  EditarDemanda: { id: number };
  EditarPerfil: undefined;
  EsqueceuSenha: undefined;
  FaleConosco: undefined;
  FAQ: undefined;
  ListaProf: undefined;
  PerfilCliente: undefined;
  PerfilProfissional: { id: number };
  SolicServico: { profissionalId: number };
  TermosDeUso: undefined;
};
