/** Tipagem das rotas de navegação. */
export type RootStackParamList = {
  Tabs: undefined;
  Chat: { matchId: string; title?: string };
  Login: undefined;
  RegisterAccount: undefined;
  RegisterPet: undefined;
};

export type TabParamList = {
  Descobrir: undefined;
  Matches: undefined;
  Perfil: undefined;
};
