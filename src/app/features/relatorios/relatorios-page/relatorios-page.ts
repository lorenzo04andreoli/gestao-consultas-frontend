import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaFiltros, ConsultaModel } from '../../consultas/consulta.model';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';

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

  consultas = signal<ConsultaModel[]>([]);
  pacientes = signal<PacienteModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);
  carregando = signal(false);
  erro = signal('');

  filtros: ConsultaFiltros = {
    pacienteId: null,
    dentistaId: null,
    especialidadeId: null,
    dataInicio: '',
    dataFim: ''
  };

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
  }

  limparFiltros() {
    this.filtros = {
      pacienteId: null,
      dentistaId: null,
      especialidadeId: null,
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
}
