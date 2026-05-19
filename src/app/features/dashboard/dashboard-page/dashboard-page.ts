import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaModel, StatusConsulta } from '../../consultas/consulta.model';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart') statusChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('dentistasChart') dentistasChartRef?: ElementRef<HTMLCanvasElement>;

  carregando = signal(true);
  erro = signal('');

  totalPacientes = signal(0);
  totalDentistasAtivos = signal(0);
  totalConsultas = signal(0);
  consultasAgendadas = signal(0);
  consultasCanceladas = signal(0);
  consultasFinalizadas = signal(0);

  private consultas: ConsultaModel[] = [];
  private dentistas: DentistaResponseModel[] = [];
  private graficosProntos = false;
  private statusChart?: Chart;
  private dentistasChart?: Chart;

  constructor(
    private pacienteService: PacienteService,
    private dentistaService: DentistaService,
    private consultaService: ConsultaService
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  ngAfterViewInit() {
    this.graficosProntos = true;
    this.renderizarGraficos();
  }

  ngOnDestroy() {
    this.statusChart?.destroy();
    this.dentistasChart?.destroy();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set('');

    forkJoin({
      pacientes: this.pacienteService.listar(),
      dentistas: this.dentistaService.listar(),
      consultas: this.consultaService.listar()
    }).subscribe({
      next: ({ pacientes, dentistas, consultas }) => {
        this.consultas = consultas;
        this.dentistas = dentistas;
        this.atualizarResumo(pacientes, dentistas, consultas);
        this.carregando.set(false);
        this.renderizarGraficos();
      },
      error: () => {
        this.erro.set('Erro ao carregar dados do dashboard.');
        this.carregando.set(false);
      }
    });
  }

  private atualizarResumo(
    pacientes: PacienteModel[],
    dentistas: DentistaResponseModel[],
    consultas: ConsultaModel[]
  ) {
    this.totalPacientes.set(pacientes.length);
    this.totalDentistasAtivos.set(dentistas.filter(dentista => dentista.ativo).length);
    this.totalConsultas.set(consultas.length);
    this.consultasAgendadas.set(this.contarConsultasPorStatus(consultas, 'AGENDADA'));
    this.consultasCanceladas.set(this.contarConsultasPorStatus(consultas, 'CANCELADA'));
    this.consultasFinalizadas.set(this.contarConsultasPorStatus(consultas, 'FINALIZADA'));
  }

  private contarConsultasPorStatus(consultas: ConsultaModel[], status: StatusConsulta) {
    return consultas.filter(consulta => consulta.status === status).length;
  }

  private renderizarGraficos() {
    if (!this.graficosProntos || this.carregando()) return;

    this.renderizarGraficoStatus();
    this.renderizarGraficoDentistas();
  }

  private renderizarGraficoStatus() {
    const canvas = this.statusChartRef?.nativeElement;
    if (!canvas) return;

    this.statusChart?.destroy();

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Agendadas', 'Canceladas', 'Finalizadas'],
        datasets: [
          {
            data: [
              this.consultasAgendadas(),
              this.consultasCanceladas(),
              this.consultasFinalizadas()
            ],
            backgroundColor: ['#2563eb', '#dc2626', '#16a34a'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    this.statusChart = new Chart(canvas, config);
  }

  private renderizarGraficoDentistas() {
    const canvas = this.dentistasChartRef?.nativeElement;
    if (!canvas) return;

    this.dentistasChart?.destroy();

    const totaisPorDentista = this.dentistas
      .map(dentista => ({
        nome: dentista.nome,
        total: this.consultas.filter(consulta => consulta.dentistaId === dentista.id).length
      }))
      .filter(item => item.total > 0)
      .slice(0, 6);

    const labels = totaisPorDentista.length
      ? totaisPorDentista.map(item => item.nome)
      : ['Sem consultas'];

    const dados = totaisPorDentista.length
      ? totaisPorDentista.map(item => item.total)
      : [0];

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Consultas',
            data: dados,
            backgroundColor: '#2563eb',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    this.dentistasChart = new Chart(canvas, config);
  }
}
