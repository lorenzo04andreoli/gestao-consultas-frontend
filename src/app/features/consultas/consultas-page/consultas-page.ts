import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventApi, EventClickArg, EventInput } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import { AuthService } from '../../../core/auth/auth';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';
import { ConsultaCancelamentoModal } from '../consulta-cancelamento-modal/consulta-cancelamento-modal';
import { ConsultaFormModal } from '../consulta-form-modal/consulta-form-modal';
import { ConsultaService } from '../consulta';
import { ConsultaModel } from '../consulta.model';
import {
  ConsultaEventChangeArg,
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
  imports: [FormsModule, FullCalendarModule, ConsultaCancelamentoModal, ConsultaFormModal],
  templateUrl: './consultas-page.html',
  styleUrl: './consultas-page.scss'
})
export class ConsultasPage implements OnInit, AfterViewInit {
  @ViewChild('calendar') private calendarComponent?: FullCalendarComponent;

  private consultaService = inject(ConsultaService);
  private pacienteService = inject(PacienteService);
  private dentistaService = inject(DentistaService);
  private especialidadeService = inject(EspecialidadeService);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private changeDetector = inject(ChangeDetectorRef);

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
  private reverterReagendamentoPendente: (() => void) | null = null;
  private chaveReagendamentoPendente: string | null = null;
  calendarEvents: EventInput[] = [];
  calendarOptions: CalendarOptions = criarConsultaCalendarOptions({
    onDateClick: (info) => this.executarNaZonaAngular(() => this.abrirModalHorarioCalendario(info)),
    onEventClick: (info) => this.executarNaZonaAngular(() => this.selecionarEventoCalendario(info)),
    onEventDrop: (info) => this.executarNaZonaAngular(() => this.reagendarEventoCalendario(info)),
    onEventChange: (info) => this.executarNaZonaAngular(() => this.reagendarEventoAlteradoCalendario(info))
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

  ngAfterViewInit() {
    this.agendarRecalculoCalendario();
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
    this.consultaForm = consultaFormParaHorario(inicio);
  }

  abrirModalHorarioCalendario(info: DateClickArg) {
    const inicio = new Date(info.date);

    this.abrirModalCadastro();
    this.consultaForm = consultaFormParaHorario(inicio);
  }

  abrirModalEdicao(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.modoModal = 'edicao';
    this.confirmandoReagendamento = false;
    this.consultaSelecionadaId = consulta.id;
    this.carregarPacientes();
    this.carregarDentistas();

    this.consultaForm = consultaParaForm(consulta);

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

    this.consultaForm = consultaParaFormReagendamento(consulta, novoInicio);

    this.modalCadastroAberto.set(true);
  }

  abrirModalReagendamentoCalendario(consulta: ConsultaModel, inicio: Date) {
    if (!consulta.id) return;

    this.modoModal = 'edicao';
    this.confirmandoReagendamento = true;
    this.consultaSelecionadaId = consulta.id;
    this.carregarPacientes();
    this.carregarDentistas();

    this.consultaForm = consultaParaFormReagendamento(consulta, inicio);

    this.modalCadastroAberto.set(true);
  }

  fecharModalCadastro() {
    this.reverterReagendamentoPendente?.();
    this.reverterReagendamentoPendente = null;
    this.chaveReagendamentoPendente = null;
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
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    const erroFormulario = validarConsultaForm(this.consultaForm);

    if (erroFormulario) {
      this.erro.set(erroFormulario);
      return;
    }

    const payload = consultaFormParaRequest(this.consultaForm);

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
        this.reverterReagendamentoPendente = null;
        this.chaveReagendamentoPendente = null;
        this.fecharModalCadastro();
        this.carregarConsultas();
      },
      error: (err) => {
        this.reverterReagendamentoPendente?.();
        this.reverterReagendamentoPendente = null;
        this.chaveReagendamentoPendente = null;
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

  cancelarConsulta(motivo: string) {
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
    return formatarIntervaloConsulta(consulta);
  }

  duracaoConsultaMinutos(consulta: ConsultaModel) {
    return duracaoConsultaMinutos(consulta);
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
    return especialidadesDoDentista(
      this.consultaForm.dentistaId,
      this.dentistas(),
      this.especialidades()
    );
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
    return formatarDataConsulta(data);
  }

  limparFormulario() {
    this.consultaForm = criarConsultaFormVazio();
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

  private selecionarEventoCalendario(info: EventClickArg) {
    const consulta = this.consultaDoEvento(info.event);

    if (consulta) {
      this.selecionarConsulta(consulta);
    }
  }

  private reagendarEventoCalendario(info: ConsultaEventDropArg) {
    this.processarReagendamentoCalendario(info);
  }

  private reagendarEventoAlteradoCalendario(info: ConsultaEventChangeArg) {
    this.processarReagendamentoCalendario(info);
  }

  private atualizarEventosCalendario() {
    const eventos = this.eventosCalendario();
    this.calendarEvents = [...eventos];
    this.changeDetector.detectChanges();
    this.agendarRecalculoCalendario();
  }

  private eventosCalendario(): EventInput[] {
    return consultasParaEventosCalendario(this.consultas(), this.dentistaFiltroId);
  }

  private executarNaZonaAngular(acao: () => void) {
    this.ngZone.run(() => {
      acao();
      this.changeDetector.detectChanges();
    });
  }

  private consultaDoEvento(evento: Pick<EventApi, 'id' | 'extendedProps'>) {
    const consulta = evento.extendedProps['consulta'] as ConsultaModel | undefined;

    if (consulta) return consulta;

    const consultaId = Number(evento.id);
    return this.consultas().find(item => item.id === consultaId);
  }

  private processarReagendamentoCalendario(info: ConsultaEventDropArg | ConsultaEventChangeArg) {
    const consulta = this.consultaDoEvento(info.event);
    const novoInicio = info.event.start;

    if (!consulta || !novoInicio) {
      info.revert();
      return;
    }

    const chave = `${info.event.id}-${novoInicio.toISOString()}`;

    if (this.chaveReagendamentoPendente === chave) return;

    this.chaveReagendamentoPendente = chave;
    this.reverterReagendamentoPendente = info.revert;

    window.setTimeout(() => {
      this.executarNaZonaAngular(() => this.abrirModalReagendamentoCalendario(consulta, novoInicio));
    });
  }

  private agendarRecalculoCalendario() {
    [0, 80, 180].forEach(atraso => {
      window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          const calendarApi = this.calendarComponent?.getApi();

          if (!calendarApi) return;

          calendarApi.updateSize();
          calendarApi.render();
        });
      }, atraso);
    });
  }
}
