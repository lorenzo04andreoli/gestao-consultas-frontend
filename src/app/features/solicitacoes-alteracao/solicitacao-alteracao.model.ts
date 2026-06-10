export type StatusSolicitacaoAlteracao = 'PENDENTE' | 'RESPONDIDA';

export interface SolicitacaoAlteracaoResponseModel {
  id: number;
  solicitanteId: number;
  solicitanteNome: string;
  solicitanteEmail: string;
  assunto?: string | null;
  descricao: string;
  status: StatusSolicitacaoAlteracao;
  resposta?: string | null;
  respondidaPorId?: number | null;
  respondidaPorNome?: string | null;
  dataCriacao: string;
  dataResposta?: string | null;
}

export interface SolicitacaoAlteracaoRequestModel {
  assunto: string;
  descricao: string;
}

export interface SolicitacaoAlteracaoRespostaRequestModel {
  resposta: string;
}
