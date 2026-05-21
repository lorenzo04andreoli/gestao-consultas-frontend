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

  consultas = signal<ConsultaModel[]>([]);
  pacientes = signal<PacienteModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);
  usuarios = signal<UsuarioResponseModel[]>([]);
  carregando = signal(false);
  erro = signal('');

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
      next: (dados) => this.dentistas.set(dados),
      error: () => this.erro.set('Erro ao carregar dentistas.')
    });

    this.especialidadeService.listar().subscribe({
      next: (dados) => this.especialidades.set(dados),
      error: () => this.erro.set('Erro ao carregar especialidades.')
    });

    this.usuarioService.listar().subscribe({
      next: (dados) => this.usuarios.set(dados),
      error: () => this.erro.set('Erro ao carregar usuarios.')
    });
  }

  limparFiltros() {
    this.filtros = {
      pacienteId: null,
      dentistaId: null,
      especialidadeId: null,
      usuarioId: null,
      dataInicio: '',
      dataFim: ''
    };

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

  private contarPorStatus(status: StatusConsulta) {
    return this.consultas().filter(consulta => consulta.status === status).length;
  }
}
