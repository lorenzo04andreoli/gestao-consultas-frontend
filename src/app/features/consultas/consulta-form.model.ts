export interface ConsultaFormModel {
  pacienteId: number | null;
  dentistaId: number | null;
  especialidadeId: number | null;
  descricao: string;
  dataConsulta: string;
  horarioInicio: string;
  duracaoMinutos: number;
  valor: number | null;
}

export function criarConsultaFormVazio(): ConsultaFormModel {
  return {
    pacienteId: null,
    dentistaId: null,
    especialidadeId: null,
    descricao: '',
    dataConsulta: '',
    horarioInicio: '',
    duracaoMinutos: 60,
    valor: null
  };
}
