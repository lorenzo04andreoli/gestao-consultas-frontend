import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import { AuthService } from '../../../core/auth/auth';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';
import { ConsultaCancelamentoModal } from '../consulta-cancelamento-modal/consulta-cancelamento-modal';
import { ConsultaService } from '../consulta';
import { ConsultaModel } from '../consulta.model';
import {
  ConsultaEventDropArg,
  criarConsultaCalendarOptions
} from '../consulta-calendar.config';
import { consultasParaEventosCalendario } from '../consulta-calendar.mapper';
import {
  consultaFormParaHorario,
  consultaFormParaRequest,
  consultaParaForm,
  consultaParaFormReagendamento,
  validarConsultaForm
} from '../consulta-form.mapper';
import { especialidadesDoDentista } from '../consulta-options.mapper';
import { ConsultaFormModel, criarConsultaFormVazio } from '../consulta-form.model';
import {
  duracaoConsultaMinutos,
  formatarDataConsulta,
  formatarIntervaloConsulta
} from '../consulta-date.utils';

@Component({
  selector: 'app-consultas-page',
  standalone: true,
  imports: [FormsModule, FullCalendarModule, ConsultaCancelamentoModal],
  templateUrl: './consultas-page.html',
  styleUrl: './consultas-page.scss'
})
export class ConsultasPage implements OnInit {
  @ViewChild('calendar') private calendarComponent?: FullCalendarComponent;

  private consultaService = inject(ConsultaService);
  private pacienteService = inject(PacienteService);
  private dentistaService = inject(DentistaService);
  private especialidadeService = inject(EspecialidadeService);
  private authService = inject(AuthService);

  consultas = signal<ConsultaModel[]>([]);
  pacientes = signal<PacienteModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  modalCadastroAberto = signal(false);
  modalCancelamentoAberto = signal(false);
  modoModal: 'cadastro' | 'edicao' = 'cadastro';
  confirmandoReagendamento = false;
  consultaSelecionadaId: number | null = null;
  dentistaFiltroId: number | null = null;
  calendarEvents: EventInput[] = [];
  calendarOptions: CalendarOptions = criarConsultaCalendarOptions({
    onDateClick: (info) => this.abrirModalHorarioCalendario(info),
    onEventClick: (info) => this.selecionarEventoCalendario(info),
    onEventDrop: (info) => this.reagendarEventoCalendario(info)
  });

  consultaForm: ConsultaFormModel = criarConsultaFormVazio();

  consultaCancelamentoId: number | null = null;
  consultaCancelamento: ConsultaModel | null = null;

  ngOnInit() {
    this.carregarConsultas();
    this.carregarPacientes();
    this.carregarDentistas();
    this.carregarEspecialidades();
  }

  carregarConsultas() {
    this.erro.set('');

    this.consultaService.listar().subscribe({
      next: (dados) => {
        this.consultas.set(dados);
        this.atualizarEventosCalendario();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar consultas.'));
      }
    });
  }

  carregarPacientes() {
    this.pacienteService.listar().subscribe({
      next: (dados) => {
        this.pacientes.set(dados);
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar pacientes.'));
      }
    });
  }

  carregarDentistas() {
    this.dentistaService.listar().subscribe({
      next: (dados) => {
        const dentistasAtivos = dados.filter(dentista => dentista.ativo);
        this.dentistas.set(this.filtrarDentistasPermitidos(dentistasAtivos));
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar dentistas.'));
      }
    });
  }

  carregarEspecialidades() {
    this.especialidadeService.listar().subscribe({
      next: (dados) => {
        this.especialidades.set(dados);
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar especialidades.'));
      }
    });
  }

  abrirModalCadastro() {
    this.modoModal = 'cadastro';
    this.confirmandoReagendamento = false;
    this.consultaSelecionadaId = null;
    this.carregarPacientes();
    this.carregarDentistas();
    this.limparFormulario();
    this.modalCadastroAberto.set(true);
  }

  abrirModalHorario(data: Date, hora: number) {
    const inicio = new Date(data);
    inicio.setHours(hora, 0, 0, 0);

    this.abrirModalCadastro();
    this.consultaForm.dataConsulta = this.formatarDataParaInputLocal(inicio).slice(0, 10);
    this.consultaForm.horarioInicio = this.formatarDataParaInputLocal(inicio).slice(11, 16);
  }

  abrirModalHorarioCalendario(info: DateClickArg) {
    const inicio = new Date(info.date);

    this.abrirModalCadastro();
    this.consultaForm.dataConsulta = this.formatarDataParaInputLocal(inicio).slice(0, 10);
    this.consultaForm.horarioInicio = this.formatarDataParaInputLocal(inicio).slice(11, 16);
  }

  abrirModalEdicao(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.modoModal = 'edicao';
    this.confirmandoReagendamento = false;
    this.consultaSelecionadaId = consulta.id;
    this.carregarPacientes();
    this.carregarDentistas();

    const inicio = new Date(consulta.dataInicio);
    const fim = new Date(consulta.dataFim);

    this.consultaForm = {
      pacienteId: consulta.pacienteId,
      dentistaId: consulta.dentistaId,
      especialidadeId: consulta.especialidadeId ?? null,
      descricao: consulta.descricao,
      dataConsulta: this.formatarDataParaInput(consulta.dataInicio).slice(0, 10),
      horarioInicio: this.formatarDataParaInput(consulta.dataInicio).slice(11, 16),
      duracaoMinutos: Math.max((fim.getTime() - inicio.getTime()) / 60000, 15)
    };

    this.modalCadastroAberto.set(true);
  }

  selecionarConsulta(consulta: ConsultaModel) {
    if (consulta.status !== 'AGENDADA') return;

    this.abrirModalEdicao(consulta);
  }

  abrirModalReagendamento(consulta: ConsultaModel, data: Date, hora: number) {
    if (!consulta.id) return;

    this.modoModal = 'edicao';
    this.confirmandoReagendamento = true;
    this.consultaSelecionadaId = consulta.id;
    this.carregarPacientes();
    this.carregarDentistas();

    const novoInicio = new Date(data);
    novoInicio.setHours(hora, 0, 0, 0);

    this.consultaForm = {
      pacienteId: consulta.pacienteId,
      dentistaId: consulta.dentistaId,
      especialidadeId: consulta.especialidadeId ?? null,
      descricao: consulta.descricao,
      dataConsulta: this.formatarDataParaInputLocal(novoInicio).slice(0, 10),
      horarioInicio: this.formatarDataParaInputLocal(novoInicio).slice(11, 16),
      duracaoMinutos: Math.max(this.duracaoConsultaMinutos(consulta), 15)
    };

    this.modalCadastroAberto.set(true);
  }

  abrirModalReagendamentoCalendario(consulta: ConsultaModel, inicio: Date) {
    if (!consulta.id) return;

    this.modoModal = 'edicao';
    this.confirmandoReagendamento = true;
    this.consultaSelecionadaId = consulta.id;
    this.carregarPacientes();
    this.carregarDentistas();

    this.consultaForm = {
      pacienteId: consulta.pacienteId,
      dentistaId: consulta.dentistaId,
      especialidadeId: consulta.especialidadeId ?? null,
      descricao: consulta.descricao,
      dataConsulta: this.formatarDataParaInputLocal(inicio).slice(0, 10),
      horarioInicio: this.formatarDataParaInputLocal(inicio).slice(11, 16),
      duracaoMinutos: Math.max(this.duracaoConsultaMinutos(consulta), 15)
    };

    this.modalCadastroAberto.set(true);
  }

  fecharModalCadastro() {
    this.modalCadastroAberto.set(false);
    this.modoModal = 'cadastro';
    this.confirmandoReagendamento = false;
    this.consultaSelecionadaId = null;
    this.limparFormulario();
  }

  abrirModalCancelamento(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.erro.set('');
    this.sucesso.set('');
    this.consultaCancelamentoId = consulta.id;
    this.consultaCancelamento = consulta;
    this.motivoCancelamento = '';
    this.modalCancelamentoAberto.set(true);
  }

  cancelarConsultaSelecionada() {
    const consulta = this.consultaEmEdicao();
    if (!consulta) return;

    this.fecharModalCadastro();
    this.abrirModalCancelamento(consulta);
  }

  finalizarConsultaSelecionada() {
    const consulta = this.consultaEmEdicao();
    if (!consulta) return;

    this.fecharModalCadastro();
    this.finalizarConsulta(consulta);
  }

  fecharModalCancelamento() {
    this.modalCancelamentoAberto.set(false);
    this.consultaCancelamentoId = null;
    this.consultaCancelamento = null;
    this.motivoCancelamento = '';
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.consultaForm.pacienteId || !this.consultaForm.dentistaId || !this.consultaForm.especialidadeId) {
      this.erro.set('Selecione paciente, dentista e especialidade.');
      return;
    }

    if (!this.consultaForm.dataConsulta || !this.consultaForm.horarioInicio) {
      this.erro.set('Informe data e horário inicial.');
      return;
    }

    if (!this.consultaForm.duracaoMinutos || this.consultaForm.duracaoMinutos < 15) {
      this.erro.set('Informe uma duração de pelo menos 15 minutos.');
      return;
    }

    if (!this.consultaForm.descricao.trim()) {
      this.erro.set('Informe a descrição da consulta.');
      return;
    }


    const { dataInicio, dataFim } = this.montarPeriodoConsulta();

    const payload: ConsultaRequestModel = {
      pacienteId: this.consultaForm.pacienteId,
      dentistaId: this.consultaForm.dentistaId,
      especialidadeId: this.consultaForm.especialidadeId,
      descricao: this.consultaForm.descricao.trim(),
      dataInicio,
      dataFim
    };

    const request$ = this.modoModal === 'edicao' && this.consultaSelecionadaId
      ? this.consultaService.atualizar(this.consultaSelecionadaId, payload)
      : this.consultaService.criar(payload);

    request$.subscribe({
      next: () => {
        this.sucesso.set(
          this.confirmandoReagendamento
            ? 'Consulta reagendada com sucesso.'
            : this.modoModal === 'edicao'
            ? 'Consulta atualizada com sucesso.'
            : 'Consulta agendada com sucesso.'
        );
        this.fecharModalCadastro();
        this.carregarConsultas();
      },
      error: (err) => {
        this.erro.set(
          this.extrairMensagemErro(
            err,
            this.modoModal === 'edicao'
              ? 'Erro ao atualizar consulta.'
              : 'Erro ao agendar consulta.'
          )
        );
      }
    });
  }

  cancelarConsulta() {
    const motivo = this.motivoCancelamento.trim();

    this.erro.set('');
    this.sucesso.set('');

    if (!this.consultaCancelamentoId) return;

    if (!motivo) {
      this.erro.set('Informe o motivo do cancelamento.');
      return;
    }

    this.consultaService.cancelar(this.consultaCancelamentoId, motivo).subscribe({
      next: () => {
        this.sucesso.set('Consulta cancelada com sucesso.');
        this.fecharModalCancelamento();
        this.carregarConsultas();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao cancelar consulta.'));
      }
    });
  }

  finalizarConsulta(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.erro.set('');
    this.sucesso.set('');

    this.consultaService.finalizar(consulta.id).subscribe({
      next: () => {
        this.sucesso.set('Consulta finalizada com sucesso.');
        this.carregarConsultas();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao finalizar consulta.'));
      }
    });
  }

  formatarIntervalo(consulta: ConsultaModel) {
    const inicio = new Date(consulta.dataInicio);
    const fim = new Date(consulta.dataFim);

    return `${this.formatarHoraMinuto(inicio)} - ${this.formatarHoraMinuto(fim)}`;
  }

  duracaoConsultaMinutos(consulta: ConsultaModel) {
    const inicio = new Date(consulta.dataInicio).getTime();
    const fim = new Date(consulta.dataFim).getTime();

    return Math.max((fim - inicio) / 60000, 0);
  }

  podeExibirAcoesModal() {
    return !!this.consultaEmEdicao() && this.modoModal === 'edicao';
  }

  aoAlterarFiltroDentista() {
    this.atualizarEventosCalendario();
  }

  aoSelecionarDentista() {
    const especialidadesPermitidas = this.especialidadesDoDentistaSelecionado();
    const especialidadeSelecionada = this.consultaForm.especialidadeId;

    if (
      especialidadeSelecionada &&
      !especialidadesPermitidas.some(especialidade => especialidade.id === especialidadeSelecionada)
    ) {
      this.consultaForm.especialidadeId = null;
    }
  }

  especialidadesDoDentistaSelecionado() {
    const dentista = this.dentistas().find(item => item.id === this.consultaForm.dentistaId);

    if (!dentista) return [];

    const nomesDentista = new Set(
      dentista.especialidades.map(nome => this.normalizarTexto(nome))
    );

    return this.especialidades()
      .filter(especialidade => nomesDentista.has(this.normalizarTexto(especialidade.nome)))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  consultaEmEdicao() {
    if (!this.consultaSelecionadaId) return null;

    return this.consultas().find(consulta => consulta.id === this.consultaSelecionadaId) ?? null;
  }

  resumoConsulta(consulta: ConsultaModel) {
    return `${consulta.pacienteNome} | ${consulta.dentistaNome} | ${this.formatarIntervalo(consulta)}`;
  }

  resumoConsultaCancelamento() {
    return this.consultaCancelamento ? this.resumoConsulta(this.consultaCancelamento) : '';
  }

  formatarData(data: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  limparFormulario() {
    this.consultaForm = {
      pacienteId: null,
      dentistaId: null,
      especialidadeId: null,
      descricao: '',
      dataConsulta: '',
      horarioInicio: '',
      duracaoMinutos: 60
    };
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }

  private filtrarDentistasPermitidos(dentistas: DentistaResponseModel[]) {
    if (!this.authService.isDentista()) return dentistas;

    const emailUsuario = this.authService.email();
    return dentistas.filter(dentista => dentista.email === emailUsuario);
  }

  private normalizarTexto(valor: string) {
    return valor
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private formatarHoraMinuto(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }

  private selecionarEventoCalendario(info: EventClickArg) {
    const consulta = info.event.extendedProps['consulta'] as ConsultaModel | undefined;

    if (consulta) {
      this.selecionarConsulta(consulta);
    }
  }

  private reagendarEventoCalendario(info: ConsultaEventDropArg) {
    const consulta = info.event.extendedProps['consulta'] as ConsultaModel | undefined;
    const novoInicio = info.event.start;

    info.revert();

    if (consulta && novoInicio) {
      this.abrirModalReagendamentoCalendario(consulta, novoInicio);
    }
  }

  private atualizarEventosCalendario() {
    const eventos = this.eventosCalendario();
    this.calendarEvents = eventos;

    const calendarApi = this.calendarComponent?.getApi();

    if (calendarApi) {
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(eventos);
      calendarApi.render();
    }
  }

  private eventosCalendario(): EventInput[] {
    return consultasParaEventosCalendario(this.consultas(), this.dentistaFiltroId);
  }
}
