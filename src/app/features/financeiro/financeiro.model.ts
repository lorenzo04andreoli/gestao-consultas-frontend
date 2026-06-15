export type StatusLancamentoFinanceiro = 'PENDENTE' | 'PAGO' | 'CANCELADO';
export type TipoLancamentoFinanceiro = 'RECEITA' | 'DESPESA';

export interface FinanceiroLancamentoRequestModel {
  consultaId: number;
  descricao: string;
  valor: number;
  dataVencimento?: string | null;
}

export interface FinanceiroLancamentoModel {
  id: number;
  consultaId: number;
  pacienteId: number;
  pacienteNome: string;
  dentistaId: number;
  dentistaNome: string;
  descricao: string;
  valor: number;
  tipo: TipoLancamentoFinanceiro;
  status: StatusLancamentoFinanceiro;
  dataVencimento?: string | null;
  dataPagamento?: string | null;
  dataCriacao: string;
}

export interface FinanceiroResumoModel {
  recebidoMes: number;
  aReceber: number;
  pendentes: number;
  pagas: number;
  canceladas: number;
}
