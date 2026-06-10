export interface NotificacaoResponseModel {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string | null;
  lida: boolean;
  dataCriacao: string;
  dataLeitura?: string | null;
}

export interface NotificacoesNaoLidasResponse {
  total: number;
}
