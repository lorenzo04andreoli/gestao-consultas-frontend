import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaFiltros, ConsultaModel, StatusConsulta } from '../../consultas/consulta.model';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';
import { UsuarioService } from '../../usuarios/usuario';
import { UsuarioResponseModel } from '../../usuarios/usuario.model';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-relatorios-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './relatorios-page.html',
  styleUrl: './relatorios-page.scss'
})
export class RelatoriosPage implements OnInit {
  private consultaService = inject(ConsultaService);
  private pacienteService = inject(PacienteService);
  private dentistaService = inject(DentistaService);
  private especialidadeService = inject(EspecialidadeService);
  private usuarioService = inject(UsuarioService);
  authService = inject(AuthService);

  consultas = signal<ConsultaModel[]>([]);
  pacientes = signal<PacienteModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);
  usuarios = signal<UsuarioResponseModel[]>([]);
  carregando = signal(false);
  erro = signal('');
  buscaPaciente = signal('');
  pacientesAbertos = signal(false);
  buscaDentista = signal('');
  dentistasAbertos = signal(false);

  filtros: ConsultaFiltros = {
    pacienteId: null,
    dentistaId: null,
    especialidadeId: null,
    usuarioId: null,
    dataInicio: '',
    dataFim: ''
  };

  totalConsultas = computed(() => this.consultas().length);
  consultasAgendadas = computed(() => this.contarPorStatus('AGENDADA'));
  consultasCanceladas = computed(() => this.contarPorStatus('CANCELADA'));
  consultasFinalizadas = computed(() => this.contarPorStatus('FINALIZADA'));
  pacientesFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.buscaPaciente());
    const pacientesAtivos = this.pacientes().filter(paciente => paciente.ativo !== false);

    if (!termo) return pacientesAtivos.slice(0, 12);

    return pacientesAtivos
      .filter(paciente => this.pacienteContemTermo(paciente, termo))
      .slice(0, 12);
  });
  dentistasFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.buscaDentista());
    const dentistasAtivos = this.dentistas().filter(dentista => dentista.ativo !== false);

    if (!termo) return dentistasAtivos.slice(0, 12);

    return dentistasAtivos
      .filter(dentista => this.dentistaContemTermo(dentista, termo))
      .slice(0, 12);
  });

  ngOnInit() {
    this.carregarFiltros();
    this.filtrar();
  }

  carregarFiltros() {
    this.pacienteService.listar().subscribe({
      next: (dados) => this.pacientes.set(dados),
      error: () => this.erro.set('Erro ao carregar pacientes.')
    });

    this.dentistaService.listar().subscribe({
      next: (dados) => this.dentistas.set(this.filtrarDentistasPermitidos(dados)),
      error: () => this.erro.set('Erro ao carregar dentistas.')
    });

    this.especialidadeService.listar().subscribe({
      next: (dados) => this.especialidades.set(dados),
      error: () => this.erro.set('Erro ao carregar especialidades.')
    });

    if (this.authService.isAdmin()) {
      this.usuarioService.listar().subscribe({
        next: (dados) => this.usuarios.set(dados),
        error: () => this.erro.set('Erro ao carregar usuarios.')
      });
    }
  }

  limparFiltros() {
    this.filtros = {
      pacienteId: null,
      dentistaId: null,
      especialidadeId: null,
      usuarioId: this.authService.isAdmin() ? null : undefined,
      dataInicio: '',
      dataFim: ''
    };
    this.buscaPaciente.set('');
    this.buscaDentista.set('');

    this.filtrar();
  }

  filtrar() {
    this.carregando.set(true);
    this.erro.set('');

    this.consultaService.relatorios(this.filtros).subscribe({
      next: (dados) => {
        this.consultas.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar relatorio.');
        this.carregando.set(false);
      }
    });
  }

  formatarData(data: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  pesquisarPaciente(valor: string) {
    this.buscaPaciente.set(valor);
    this.filtros.pacienteId = null;
    this.pacientesAbertos.set(true);
  }

  abrirPacientes() {
    this.pacientesAbertos.set(true);
  }

  fecharPacientes() {
    window.setTimeout(() => this.pacientesAbertos.set(false), 120);
  }

  selecionarTodosPacientes() {
    this.filtros.pacienteId = null;
    this.buscaPaciente.set('');
    this.pacientesAbertos.set(false);
  }

  selecionarPaciente(paciente: PacienteModel) {
    if (!paciente.id) return;

    this.filtros.pacienteId = paciente.id;
    this.buscaPaciente.set(paciente.nome);
    this.pacientesAbertos.set(false);
  }

  pesquisarDentista(valor: string) {
    this.buscaDentista.set(valor);
    this.filtros.dentistaId = null;
    this.dentistasAbertos.set(true);
  }

  abrirDentistas() {
    this.dentistasAbertos.set(true);
  }

  fecharDentistas() {
    window.setTimeout(() => this.dentistasAbertos.set(false), 120);
  }

  selecionarTodosDentistas() {
    this.filtros.dentistaId = null;
    this.buscaDentista.set('');
    this.dentistasAbertos.set(false);
  }

  selecionarDentista(dentista: DentistaResponseModel) {
    this.filtros.dentistaId = dentista.id;
    this.buscaDentista.set(this.nomeDentista(dentista));
    this.dentistasAbertos.set(false);
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

  private contarPorStatus(status: StatusConsulta) {
    return this.consultas().filter(consulta => consulta.status === status).length;
  }

  private filtrarDentistasPermitidos(dentistas: DentistaResponseModel[]) {
    if (!this.authService.isDentista()) return dentistas;

    const emailUsuario = this.authService.email();
    return dentistas.filter(dentista => dentista.email === emailUsuario);
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
