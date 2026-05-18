export type StatusConsulta = 'AGENDADA' | 'FINALIZADA' | 'CANCELADA';

export interface ConsultaModel {
  id?: number;
  pacienteId: number;
  pacienteNome: string;
  dentistaId: number;
  dentistaNome: string;
  usuarioNome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  status: StatusConsulta;
  motivoCancelamento?: string;
}

export interface ConsultaRequestModel {
  pacienteId: number;
  dentistaId: number;
  descricao: string;
  dataInicio: string;
  dataFim: string;
}

export interface ConsultaFiltros {
  pacienteId?: number | null;
  dentistaId?: number | null;
  especialidadeId?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}
