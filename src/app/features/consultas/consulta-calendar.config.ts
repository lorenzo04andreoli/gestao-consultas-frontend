import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

export interface ConsultaEventDropArg {
  event: {
    start: Date | null;
    extendedProps: Record<string, unknown>;
  };
  revert: () => void;
}

export interface ConsultaCalendarHandlers {
  onDateClick: (info: DateClickArg) => void;
  onEventClick: (info: EventClickArg) => void;
  onEventDrop: (info: ConsultaEventDropArg) => void;
}

export function criarConsultaCalendarOptions(handlers: ConsultaCalendarHandlers): CalendarOptions {
  return {
    plugins: [timeGridPlugin, interactionPlugin, dayGridPlugin],
    initialView: 'timeGridWeek',
    locale: ptBrLocale,
    firstDay: 0,
    allDaySlot: false,
    nowIndicator: true,
    editable: true,
    selectable: true,
    expandRows: true,
    height: 'auto',
    slotMinTime: '06:00:00',
    slotMaxTime: '19:00:00',
    slotDuration: '00:30:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    headerToolbar: {
      left: 'today prev,next',
      center: 'title',
      right: 'timeGridWeek,timeGridDay,dayGridMonth'
    },
    buttonText: {
      today: 'Hoje',
      month: 'Mes',
      week: 'Semana',
      day: 'Dia'
    },
    dateClick: handlers.onDateClick,
    eventClick: handlers.onEventClick,
    eventDrop: handlers.onEventDrop,
    eventAllow: (_dropInfo, draggedEvent) => draggedEvent?.extendedProps['status'] === 'AGENDADA'
  };
}
