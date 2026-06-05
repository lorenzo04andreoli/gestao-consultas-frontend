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

export interface FinanceiroTabelaPrecoRequestModel {
  nome: string;
  ativo?: boolean;
}

export interface FinanceiroTabelaPrecoModel {
  id: number;
  nome: string;
  ativo: boolean;
  dataCriacao: string;
}

export interface FinanceiroPrecoRequestModel {
  tabelaPrecoId: number;
  especialidadeId: number;
  dentistaId?: number | null;
  descricao: string;
  valor: number;
  ativo?: boolean;
}

export interface FinanceiroPrecoModel {
  id: number;
  tabelaPrecoId: number;
  tabelaPrecoNome: string;
  especialidadeId: number;
  especialidadeNome: string;
  dentistaId?: number | null;
  dentistaNome?: string | null;
  descricao: string;
  valor: number;
  ativo: boolean;
  dataCriacao: string;
}

export interface FinanceiroPrecoSugestaoModel {
  encontrado: boolean;
  precoId?: number | null;
  valor?: number | null;
  descricao?: string | null;
  origem?: 'DENTISTA' | 'ESPECIALIDADE' | null;
}
