import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { PacienteModel } from '../../pacientes/paciente.model';
import { ConsultaFormModel } from '../consulta-form.model';

@Component({
  selector: 'app-consulta-form-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consulta-form-modal.html',
  styleUrl: './consulta-form-modal.scss'
})
export class ConsultaFormModal implements OnChanges {
  @Input({ required: true }) form!: ConsultaFormModel;
  @Input() modo: 'cadastro' | 'edicao' = 'cadastro';
  @Input() confirmandoReagendamento = false;
  @Input() podeExibirAcoes = false;
  @Input() pacientes: PacienteModel[] = [];
  @Input() dentistas: DentistaResponseModel[] = [];
  @Input() especialidades: EspecialidadeModel[] = [];

  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<void>();
  @Output() dentistaAlterado = new EventEmitter<void>();
  @Output() finalizar = new EventEmitter<void>();
  @Output() cancelarConsulta = new EventEmitter<void>();

  buscaPaciente = signal('');
  pacientesAbertos = signal(false);
  buscaDentista = signal('');
  dentistasAbertos = signal(false);

  pacientesFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.buscaPaciente());
    const pacientesAtivos = this.pacientes.filter(paciente => paciente.ativo !== false);

    if (!termo) return pacientesAtivos.slice(0, 12);

    return pacientesAtivos
      .filter(paciente => this.pacienteContemTermo(paciente, termo))
      .slice(0, 12);
  });

  dentistasFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.buscaDentista());
    const dentistasAtivos = this.dentistas.filter(dentista => dentista.ativo !== false);

    if (!termo) return dentistasAtivos.slice(0, 12);

    return dentistasAtivos
      .filter(dentista => this.dentistaContemTermo(dentista, termo))
      .slice(0, 12);
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['form'] || changes['pacientes']) {
      this.sincronizarPacienteSelecionado();
    }

    if (changes['form'] || changes['dentistas']) {
      this.sincronizarDentistaSelecionado();
    }
  }

  titulo() {
    if (this.confirmandoReagendamento) return 'Confirmar novo horario';
    return this.modo === 'edicao' ? 'Editar consulta' : 'Agendar consulta';
  }

  subtitulo() {
    return this.confirmandoReagendamento
      ? 'Confira os dados antes de salvar a alteracao.'
      : 'Selecione paciente, dentista e horario da consulta.';
  }

  textoBotaoPrincipal() {
    return this.modo === 'edicao' ? 'Salvar' : 'Agendar';
  }

  alterarDentista(dentistaId: number | null) {
    this.form.dentistaId = dentistaId;
    this.dentistaAlterado.emit();
  }

  pesquisarDentista(valor: string) {
    this.buscaDentista.set(valor);
    this.form.dentistaId = null;
    this.form.especialidadeId = null;
    this.dentistasAbertos.set(true);
    this.dentistaAlterado.emit();
  }

  abrirDentistas() {
    this.dentistasAbertos.set(true);
  }

  fecharDentistas() {
    window.setTimeout(() => this.dentistasAbertos.set(false), 120);
  }

  selecionarDentista(dentista: DentistaResponseModel) {
    this.form.dentistaId = dentista.id;
    this.buscaDentista.set(this.nomeDentista(dentista));
    this.dentistasAbertos.set(false);
    this.dentistaAlterado.emit();
  }

  pesquisarPaciente(valor: string) {
    this.buscaPaciente.set(valor);
    this.form.pacienteId = null;
    this.pacientesAbertos.set(true);
  }

  abrirPacientes() {
    this.pacientesAbertos.set(true);
  }

  fecharPacientes() {
    window.setTimeout(() => this.pacientesAbertos.set(false), 120);
  }

  selecionarPaciente(paciente: PacienteModel) {
    if (!paciente.id) return;

    this.form.pacienteId = paciente.id;
    this.buscaPaciente.set(paciente.nome);
    this.pacientesAbertos.set(false);
  }

  pacienteSelecionado() {
    return this.pacientes.find(paciente => paciente.id === this.form.pacienteId) ?? null;
  }

  dentistaSelecionado() {
    return this.dentistas.find(dentista => dentista.id === this.form.dentistaId) ?? null;
  }

  inicialPaciente(paciente: PacienteModel) {
    return paciente.nome.trim().charAt(0).toUpperCase() || 'P';
  }

  inicialDentista(dentista: DentistaResponseModel) {
    return dentista.nome.trim().charAt(0).toUpperCase() || 'D';
  }

  especialidadesDentista(dentista: DentistaResponseModel) {
    return dentista.especialidades?.join(', ') || 'Sem especialidade';
  }

  nomeDentista(dentista: DentistaResponseModel) {
    return `${dentista.nome} - ${dentista.cro}`;
  }

  private sincronizarPacienteSelecionado() {
    const paciente = this.pacienteSelecionado();

    if (paciente) {
      this.buscaPaciente.set(paciente.nome);
    }
  }

  private sincronizarDentistaSelecionado() {
    const dentista = this.dentistaSelecionado();

    if (dentista) {
      this.buscaDentista.set(this.nomeDentista(dentista));
    }
  }

  private pacienteContemTermo(paciente: PacienteModel, termo: string) {
    return [paciente.nome, paciente.email, paciente.cpf, paciente.telefone]
      .filter((valor): valor is string => Boolean(valor))
      .some(valor => this.normalizarTexto(valor).includes(termo));
  }

  private dentistaContemTermo(dentista: DentistaResponseModel, termo: string) {
    return [
      dentista.nome,
      dentista.email,
      dentista.cpf,
      dentista.cro,
      dentista.especialidades?.join(' ')
    ]
      .filter((valor): valor is string => Boolean(valor))
      .some(valor => this.normalizarTexto(valor).includes(termo));
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
