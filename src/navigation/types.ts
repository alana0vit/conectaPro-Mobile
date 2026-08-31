export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Cadastro: undefined;
  DashboardCliente: undefined;
  DashboardProfissional: undefined;
  DetalhesDemanda: {
    demanda: any;
    modo: 'CLIENTE' | 'PROFISSIONAL';
  };
  EditarDemanda: { id: number };
  EditarPerfil: undefined;
  EsqueceuSenha: undefined;
  RedefinicaoSenha: { token: string };
  FaleConosco: undefined;
  FAQ: undefined;
  ListaProf: undefined;
  PerfilCliente: undefined;
  PerfilProfissional: { id: number };
  SolicServico: { profissionalId: number };
  TermosDeUso: undefined;
};
