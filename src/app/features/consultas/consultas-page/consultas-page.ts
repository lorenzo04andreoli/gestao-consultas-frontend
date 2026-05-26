import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';
import { ConsultaService } from '../consulta';
import { ConsultaModel, ConsultaRequestModel } from '../consulta.model';

@Component({
  selector: 'app-consultas-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consultas-page.html',
  styleUrl: './consultas-page.scss'
})
export class ConsultasPage implements OnInit {
  private consultaService = inject(ConsultaService);
  private pacienteService = inject(PacienteService);
  private dentistaService = inject(DentistaService);
  private authService = inject(AuthService);

  consultas = signal<ConsultaModel[]>([]);
  pacientes = signal<PacienteModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  modalCadastroAberto = signal(false);
  modalCancelamentoAberto = signal(false);
  modoModal: 'cadastro' | 'edicao' = 'cadastro';
  consultaSelecionadaId: number | null = null;
  dentistaFiltroId: number | null = null;
  consultaArrastada: ConsultaModel | null = null;
  private readonly alturaHoraAgenda = 92;
  horarios = Array.from({ length: 13 }, (_, index) => index + 6);
  diasSemana = this.montarSemana(new Date());

  consultaForm = {
    pacienteId: null as number | null,
    dentistaId: null as number | null,
    descricao: '',
    dataConsulta: '',
    horarioInicio: '',
    duracaoMinutos: 60
  };

  consultaCancelamentoId: number | null = null;
  motivoCancelamento = '';

  ngOnInit() {
    this.carregarConsultas();
    this.carregarPacientes();
    this.carregarDentistas();
  }

  carregarConsultas() {
    this.erro.set('');

    this.consultaService.listar().subscribe({
      next: (dados) => {
        this.consultas.set(dados);
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

  abrirModalCadastro() {
    this.modoModal = 'cadastro';
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

  abrirModalEdicao(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.modoModal = 'edicao';
    this.consultaSelecionadaId = consulta.id;
    this.carregarPacientes();
    this.carregarDentistas();

    const inicio = new Date(consulta.dataInicio);
    const fim = new Date(consulta.dataFim);

    this.consultaForm = {
      pacienteId: consulta.pacienteId,
      dentistaId: consulta.dentistaId,
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

  iniciarArrasteConsulta(event: DragEvent, consulta: ConsultaModel) {
    if (consulta.status !== 'AGENDADA') {
      event.preventDefault();
      return;
    }

    this.consultaArrastada = consulta;
    event.dataTransfer?.setData('text/plain', String(consulta.id ?? ''));
    event.dataTransfer?.setDragImage(event.target as Element, 12, 12);
  }

  finalizarArrasteConsulta() {
    this.consultaArrastada = null;
  }

  permitirSoltarConsulta(event: DragEvent) {
    if (!this.consultaArrastada) return;

    event.preventDefault();
  }

  soltarConsulta(event: DragEvent, data: Date, hora: number) {
    if (!this.consultaArrastada) return;

    event.preventDefault();
    this.finalizarArrasteConsulta();
  }

  fecharModalCadastro() {
    this.modalCadastroAberto.set(false);
    this.modoModal = 'cadastro';
    this.consultaSelecionadaId = null;
    this.limparFormulario();
  }

  abrirModalCancelamento(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.consultaCancelamentoId = consulta.id;
    this.motivoCancelamento = '';
    this.modalCancelamentoAberto.set(true);
  }

  fecharModalCancelamento() {
    this.modalCancelamentoAberto.set(false);
    this.consultaCancelamentoId = null;
    this.motivoCancelamento = '';
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.consultaForm.pacienteId || !this.consultaForm.dentistaId) {
      this.erro.set('Selecione paciente e dentista.');
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
          this.modoModal === 'edicao'
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

  voltarParaHoje() {
    this.diasSemana = this.montarSemana(new Date());
  }

  navegarSemana(direcao: -1 | 1) {
    const referencia = new Date(this.diasSemana[0].data);
    referencia.setDate(referencia.getDate() + direcao * 7);
    this.diasSemana = this.montarSemana(referencia);
  }

  tituloSemana() {
    const primeiroDia = this.diasSemana[0].data;
    const ultimoDia = this.diasSemana[this.diasSemana.length - 1].data;

    return `${this.formatarDiaCurto(primeiroDia)} - ${this.formatarDiaCurto(ultimoDia)}`;
  }

  consultasDoHorario(data: Date, hora: number) {
    return this.consultas()
      .filter(consulta => this.consultaPertenceAoHorario(consulta, data, hora))
      .filter(consulta => !this.dentistaFiltroId || consulta.dentistaId === this.dentistaFiltroId)
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  }

  formatarDiaAgenda(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    }).format(data);
  }

  formatarHoraAgenda(hora: number) {
    return `${String(hora).padStart(2, '0')}:00`;
  }

  formatarIntervalo(consulta: ConsultaModel) {
    const inicio = new Date(consulta.dataInicio);
    const fim = new Date(consulta.dataFim);

    return `${this.formatarHoraMinuto(inicio)} - ${this.formatarHoraMinuto(fim)}`;
  }

  deslocamentoConsulta(consulta: ConsultaModel) {
    const inicio = new Date(consulta.dataInicio);
    return (inicio.getMinutes() / 60) * this.alturaHoraAgenda + 4;
  }

  alturaConsulta(consulta: ConsultaModel) {
    const duracaoMinutos = this.duracaoConsultaMinutos(consulta);

    return Math.max((duracaoMinutos / 60) * this.alturaHoraAgenda - 8, 42);
  }

  duracaoConsultaMinutos(consulta: ConsultaModel) {
    const inicio = new Date(consulta.dataInicio).getTime();
    const fim = new Date(consulta.dataFim).getTime();

    return Math.max((fim - inicio) / 60000, 0);
  }

  consultaCompacta(consulta: ConsultaModel) {
    return this.duracaoConsultaMinutos(consulta) < 60;
  }

  consultaMuitoCurta(consulta: ConsultaModel) {
    return this.duracaoConsultaMinutos(consulta) <= 30;
  }

  resumoConsulta(consulta: ConsultaModel) {
    return `${consulta.pacienteNome} | ${consulta.dentistaNome} | ${this.formatarIntervalo(consulta)}`;
  }

  larguraConsulta(total: number) {
    return `calc(${100 / total}% - 8px)`;
  }

  posicaoConsulta(indice: number, total: number) {
    return `calc(${indice * (100 / total)}% + 4px)`;
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

  private formatarDataParaInput(data: string) {
    return data ? data.slice(0, 16) : '';
  }

  private formatarDataParaInputLocal(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');

    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
  }

  private montarPeriodoConsulta() {
    const dataInicio = `${this.consultaForm.dataConsulta}T${this.consultaForm.horarioInicio}`;
    const fim = new Date(dataInicio);
    fim.setMinutes(fim.getMinutes() + Number(this.consultaForm.duracaoMinutos));

    return {
      dataInicio,
      dataFim: this.formatarDataParaInputLocal(fim)
    };
  }

  private filtrarDentistasPermitidos(dentistas: DentistaResponseModel[]) {
    if (!this.authService.isDentista()) return dentistas;

    const emailUsuario = this.authService.email();
    return dentistas.filter(dentista => dentista.email === emailUsuario);
  }

  private montarSemana(referencia: Date) {
    const inicio = new Date(referencia);
    const diaSemana = inicio.getDay();
    inicio.setDate(inicio.getDate() - diaSemana);
    inicio.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + index);

      return {
        data,
        iso: data.toISOString()
      };
    });
  }

  private consultaPertenceAoHorario(consulta: ConsultaModel, data: Date, hora: number) {
    const inicio = new Date(consulta.dataInicio);

    return inicio.toDateString() === data.toDateString() && inicio.getHours() === hora;
  }

  private formatarDiaCurto(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short'
    }).format(data);
  }

  private formatarHoraMinuto(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }
}
