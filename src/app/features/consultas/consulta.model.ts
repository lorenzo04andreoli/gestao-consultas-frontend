export type StatusConsulta = 'AGENDADA' | 'FINALIZADA' | 'CANCELADA';

export interface ConsultaModel {
  id?: number;
  pacienteId: number;
  pacienteNome: string;
  pacienteTelefone?: string | null;
  dentistaId: number;
  dentistaNome: string;
  especialidadeId?: number | null;
  especialidadeNome?: string | null;
  usuarioNome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  valor?: number | null;
  status: StatusConsulta;
  motivoCancelamento?: string;
  paciente?: {
    id?: number;
    nome?: string;
  };
  dentista?: {
    id?: number;
    nome?: string;
  };
  usuario?: {
    nome?: string;
  };
}

export interface ConsultaRequestModel {
  pacienteId: number;
  dentistaId: number;
  especialidadeId: number;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  valor?: number | null;
}

export interface ConsultaFiltros {
  pacienteId?: number | null;
  dentistaId?: number | null;
  especialidadeId?: number | null;
  usuarioId?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}
