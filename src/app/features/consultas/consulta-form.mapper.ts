import { ConsultaModel, ConsultaRequestModel } from './consulta.model';
import { ConsultaFormModel, criarConsultaFormVazio } from './consulta-form.model';
import {
  duracaoConsultaMinutos,
  formatarDataParaInput,
  formatarDataParaInputLocal,
  montarPeriodoConsulta
} from './consulta-date.utils';

export function consultaFormParaHorario(inicio: Date): ConsultaFormModel {
  const form = criarConsultaFormVazio();
  const valorLocal = formatarDataParaInputLocal(inicio);

  return {
    ...form,
    dataConsulta: valorLocal.slice(0, 10),
    horarioInicio: valorLocal.slice(11, 16)
  };
}

export function consultaParaForm(consulta: ConsultaModel): ConsultaFormModel {
  const inicio = new Date(consulta.dataInicio);
  const fim = new Date(consulta.dataFim);

  return {
    pacienteId: consulta.pacienteId,
    dentistaId: consulta.dentistaId,
    especialidadeId: consulta.especialidadeId ?? null,
    descricao: consulta.descricao,
    dataConsulta: formatarDataParaInput(consulta.dataInicio).slice(0, 10),
    horarioInicio: formatarDataParaInput(consulta.dataInicio).slice(11, 16),
    duracaoMinutos: Math.max((fim.getTime() - inicio.getTime()) / 60000, 15)
  };
}

export function consultaParaFormReagendamento(consulta: ConsultaModel, inicio: Date): ConsultaFormModel {
  const valorLocal = formatarDataParaInputLocal(inicio);

  return {
    pacienteId: consulta.pacienteId,
    dentistaId: consulta.dentistaId,
    especialidadeId: consulta.especialidadeId ?? null,
    descricao: consulta.descricao,
    dataConsulta: valorLocal.slice(0, 10),
    horarioInicio: valorLocal.slice(11, 16),
    duracaoMinutos: Math.max(duracaoConsultaMinutos(consulta), 15)
  };
}

export function validarConsultaForm(form: ConsultaFormModel) {
  if (!form.pacienteId || !form.dentistaId || !form.especialidadeId) {
    return 'Selecione paciente, dentista e especialidade.';
  }

  if (!form.dataConsulta || !form.horarioInicio) {
    return 'Informe data e horario inicial.';
  }

  if (!form.duracaoMinutos || form.duracaoMinutos < 15) {
    return 'Informe uma duracao de pelo menos 15 minutos.';
  }

  if (!form.descricao.trim()) {
    return 'Informe a descricao da consulta.';
  }

  return '';
}

export function consultaFormParaRequest(form: ConsultaFormModel): ConsultaRequestModel {
  const { dataInicio, dataFim } = montarPeriodoConsulta(form);

  return {
    pacienteId: form.pacienteId as number,
    dentistaId: form.dentistaId as number,
    especialidadeId: form.especialidadeId as number,
    descricao: form.descricao.trim(),
    dataInicio,
    dataFim
  };
}
