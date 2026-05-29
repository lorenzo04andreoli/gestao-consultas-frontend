import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaModel, StatusConsulta } from '../../consultas/consulta.model';
import { DentistaService } from '../../dentistas/dentista';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';

Chart.register(...registerables);

interface RankingDentista {
  id?: number;
  nome: string;
  total: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart') statusChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('dentistasChart') dentistasChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('mensalChart') mensalChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cancelamentosChart') cancelamentosChartRef?: ElementRef<HTMLCanvasElement>;

  carregando = signal(true);
  erro = signal('');

  totalPacientes = signal(0);
  pacientesAdicionadosMes = signal(0);
  consultasHoje = signal(0);
  consultasCanceladasMes = signal(0);
  consultasAgendadas = signal(0);
  consultasCanceladas = signal(0);
  consultasFinalizadas = signal(0);
  pacientesRecentes = signal<PacienteModel[]>([]);
  rankingDentistas = signal<RankingDentista[]>([]);
  proximasConsultas = signal<ConsultaModel[]>([]);

  private consultas: ConsultaModel[] = [];
  private graficosProntos = false;
  private statusChart?: Chart;
  private dentistasChart?: Chart;
  private mensalChart?: Chart;
  private cancelamentosChart?: Chart;

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
    this.mensalChart?.destroy();
    this.cancelamentosChart?.destroy();
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
    this.pacientesRecentes.set(this.montarPacientesRecentes(pacientes));
    this.rankingDentistas.set(this.montarRankingDentistas(dentistas, consultas));
    this.proximasConsultas.set(this.montarProximasConsultas(consultas));
    this.pacientesAdicionadosMes.set(
      pacientes.filter(paciente => this.dataNoMesAtual(paciente.dataCriacao)).length
    );
    this.consultasHoje.set(
      consultas.filter(consulta =>
        this.dataHoje(consulta.dataInicio) &&
        ['AGENDADA', 'FINALIZADA'].includes(consulta.status)
      ).length
    );
    this.consultasCanceladasMes.set(
      consultas.filter(consulta =>
        consulta.status === 'CANCELADA' && this.dataNoMesAtual(consulta.dataInicio)
      ).length
    );
    this.consultasAgendadas.set(this.contarConsultasPorStatus(consultas, 'AGENDADA'));
    this.consultasCanceladas.set(this.contarConsultasPorStatus(consultas, 'CANCELADA'));
    this.consultasFinalizadas.set(this.contarConsultasPorStatus(consultas, 'FINALIZADA'));
  }

  formatarDataPaciente(data?: string) {
    if (!data) return 'Sem data';

    return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
  }

  formatarDataConsulta(data?: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(data));
  }

  private contarConsultasPorStatus(consultas: ConsultaModel[], status: StatusConsulta) {
    return consultas.filter(consulta => consulta.status === status).length;
  }

  private dataHoje(data?: string) {
    if (!data) return false;

    const hoje = new Date();
    const referencia = new Date(data);

    return hoje.toDateString() === referencia.toDateString();
  }

  private dataNoMesAtual(data?: string) {
    if (!data) return false;

    const hoje = new Date();
    const referencia = new Date(data);

    return (
      hoje.getFullYear() === referencia.getFullYear() &&
      hoje.getMonth() === referencia.getMonth()
    );
  }

  private renderizarGraficos() {
    if (!this.graficosProntos || this.carregando()) return;

    this.renderizarGraficoStatus();
    this.renderizarGraficoDentistas();
    this.renderizarGraficoMensal();
    this.renderizarGraficoCancelamentos();
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

    const totaisPorDentista = this.rankingDentistas();

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

  private renderizarGraficoMensal() {
    const canvas = this.mensalChartRef?.nativeElement;
    if (!canvas) return;

    this.mensalChart?.destroy();

    const meses = this.montarUltimosMeses(6);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: meses.map(mes => mes.rotulo),
        datasets: [
          {
            label: 'Agendadas',
            data: meses.map(mes => this.contarConsultasNoMes(mes.data, 'AGENDADA')),
            backgroundColor: '#2563eb',
            borderRadius: 6
          },
          {
            label: 'Finalizadas',
            data: meses.map(mes => this.contarConsultasNoMes(mes.data, 'FINALIZADA')),
            backgroundColor: '#16a34a',
            borderRadius: 6
          },
          {
            label: 'Canceladas',
            data: meses.map(mes => this.contarConsultasNoMes(mes.data, 'CANCELADA')),
            backgroundColor: '#dc2626',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true
          },
          y: {
            beginAtZero: true,
            stacked: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    this.mensalChart = new Chart(canvas, config);
  }

  private renderizarGraficoCancelamentos() {
    const canvas = this.cancelamentosChartRef?.nativeElement;
    if (!canvas) return;

    this.cancelamentosChart?.destroy();

    const dias = this.montarUltimosDias(7);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: dias.map(dia => dia.rotulo),
        datasets: [
          {
            label: 'Cancelamentos',
            data: dias.map(dia => this.contarCancelamentosNoDia(dia.data)),
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#dc2626',
            pointRadius: 4
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

    this.cancelamentosChart = new Chart(canvas, config);
  }

  private montarRankingDentistas(dentistas: DentistaResponseModel[], consultas: ConsultaModel[]) {
    return dentistas
      .map(dentista => ({
        id: dentista.id,
        nome: dentista.nome,
        total: consultas.filter(consulta => consulta.dentistaId === dentista.id).length
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
      .slice(0, 6);
  }

  private montarPacientesRecentes(pacientes: PacienteModel[]) {
    return [...pacientes]
      .sort((a, b) => this.timestampData(b.dataCriacao) - this.timestampData(a.dataCriacao))
      .slice(0, 5);
  }

  private montarProximasConsultas(consultas: ConsultaModel[]) {
    const agora = new Date().getTime();

    return consultas
      .filter(consulta =>
        consulta.status === 'AGENDADA' &&
        this.timestampData(consulta.dataInicio) >= agora
      )
      .sort((a, b) => this.timestampData(a.dataInicio) - this.timestampData(b.dataInicio))
      .slice(0, 5);
  }

  private timestampData(data?: string) {
    return data ? new Date(data).getTime() : 0;
  }

  private montarUltimosMeses(quantidade: number) {
    const hoje = new Date();

    return Array.from({ length: quantidade }, (_, index) => {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - (quantidade - 1 - index), 1);

      return {
        data,
        rotulo: new Intl.DateTimeFormat('pt-BR', {
          month: 'short',
          year: '2-digit'
        }).format(data)
      };
    });
  }

  private montarUltimosDias(quantidade: number) {
    const hoje = new Date();

    return Array.from({ length: quantidade }, (_, index) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - (quantidade - 1 - index));

      return {
        data,
        rotulo: new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit'
        }).format(data)
      };
    });
  }

  private contarConsultasNoMes(data: Date, status: StatusConsulta) {
    return this.consultas.filter(consulta => {
      const inicio = new Date(consulta.dataInicio);

      return (
        consulta.status === status &&
        inicio.getFullYear() === data.getFullYear() &&
        inicio.getMonth() === data.getMonth()
      );
    }).length;
  }

  private contarCancelamentosNoDia(data: Date) {
    return this.consultas.filter(consulta => {
      const inicio = new Date(consulta.dataInicio);

      return consulta.status === 'CANCELADA' && inicio.toDateString() === data.toDateString();
    }).length;
  }
}
