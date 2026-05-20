import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsultaFiltros } from '../../consultas/consulta.model';
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
  private pacienteService = inject(PacienteService);
  private dentistaService = inject(DentistaService);
  private especialidadeService = inject(EspecialidadeService);

  pacientes = signal<PacienteModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);
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
  }
}
