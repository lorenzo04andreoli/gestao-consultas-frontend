import { EventInput } from '@fullcalendar/core';
import { ConsultaModel } from './consulta.model';

export function consultasParaEventosCalendario(
  consultas: ConsultaModel[],
  dentistaFiltroId: number | null
): EventInput[] {
  return consultas
    .filter(consulta => consulta.status !== 'CANCELADA')
    .filter(consulta => !dentistaFiltroId || consulta.dentistaId === dentistaFiltroId)
    .map(consulta => ({
      id: String(consulta.id),
      title: `${consulta.pacienteNome} - ${consulta.dentistaNome}`,
      start: consulta.dataInicio,
      end: consulta.dataFim,
      editable: consulta.status === 'AGENDADA',
      classNames: classesEventoConsulta(consulta),
      extendedProps: {
        consulta,
        status: consulta.status
      }
    }));
}

function classesEventoConsulta(consulta: ConsultaModel) {
  return [
    'appointment-event',
    consulta.status === 'FINALIZADA' ? 'done' : ''
  ].filter(Boolean);
}
