import { ConsultaModel } from './consulta.model';
import { ConsultaFormModel } from './consulta-form.model';

export function formatarDataParaInput(data: string) {
  return data ? data.slice(0, 16) : '';
}

export function formatarDataParaInputLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');

  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

export function montarPeriodoConsulta(form: ConsultaFormModel) {
  const dataInicio = `${form.dataConsulta}T${form.horarioInicio}`;
  const fim = new Date(dataInicio);
  fim.setMinutes(fim.getMinutes() + Number(form.duracaoMinutos));

  return {
    dataInicio,
    dataFim: formatarDataParaInputLocal(fim)
  };
}

export function duracaoConsultaMinutos(consulta: ConsultaModel) {
  const inicio = new Date(consulta.dataInicio).getTime();
  const fim = new Date(consulta.dataFim).getTime();

  return Math.max((fim - inicio) / 60000, 0);
}

export function formatarHoraMinuto(data: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
}

export function formatarIntervaloConsulta(consulta: ConsultaModel) {
  const inicio = new Date(consulta.dataInicio);
  const fim = new Date(consulta.dataFim);

  return `${formatarHoraMinuto(inicio)} - ${formatarHoraMinuto(fim)}`;
}

export function formatarDataConsulta(data: string) {
  if (!data) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(data));
}
