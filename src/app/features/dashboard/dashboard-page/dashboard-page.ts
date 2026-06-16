import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaModel, StatusConsulta } from '../../consultas/consulta.model';
import { PacienteService } from '../../pacientes/paciente';
import { PacienteModel } from '../../pacientes/paciente.model';

Chart.register(...registerables);

interface RankingEspecialidade {
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
  @ViewChild('especialidadesChart') especialidadesChartRef?: ElementRef<HTMLCanvasElement>;
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
  rankingEspecialidades = signal<RankingEspecialidade[]>([]);
  proximasConsultas = signal<ConsultaModel[]>([]);

  private consultas: ConsultaModel[] = [];
  private graficosProntos = false;
  private statusChart?: Chart;
  private especialidadesChart?: Chart;
  private mensalChart?: Chart;
  private cancelamentosChart?: Chart;

  constructor(
    private pacienteService: PacienteService,
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
    this.especialidadesChart?.destroy();
    this.mensalChart?.destroy();
    this.cancelamentosChart?.destroy();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set('');

    forkJoin({
      pacientes: this.pacienteService.listar(),
      consultas: this.consultaService.listar()
    }).subscribe({
      next: ({ pacientes, consultas }) => {
        this.consultas = consultas;
        this.atualizarResumo(pacientes, consultas);
        this.carregando.set(false);
        this.renderizarGraficos();
      },
      error: () => {
        this.erro.set('Erro ao carregar dados do dashboard.');
        this.carregando.set(false);
      }
    });
  }

  private atualizarResumo(pacientes: PacienteModel[], consultas: ConsultaModel[]) {
    this.atualizarIndicadores(pacientes, consultas);
    this.atualizarListas(pacientes, consultas);
  }

  private atualizarIndicadores(pacientes: PacienteModel[], consultas: ConsultaModel[]) {
    this.totalPacientes.set(pacientes.length);
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

  private atualizarListas(pacientes: PacienteModel[], consultas: ConsultaModel[]) {
    this.pacientesRecentes.set(this.montarPacientesRecentes(pacientes));
    this.rankingEspecialidades.set(this.montarRankingEspecialidades(consultas));
    this.proximasConsultas.set(this.montarProximasConsultas(consultas));
  }

  formatarDataPaciente(data?: string) {
    if (!data) return 'Sem data';

    return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
  }

  inicialPessoa(nome?: string) {
    return nome?.trim().charAt(0).toUpperCase() || '?';
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
    this.renderizarGraficoEspecialidades();
    this.renderizarGraficoMensal();
    this.renderizarGraficoCancelamentos();
  }

  private renderizarGraficoStatus() {
    const canvas = this.statusChartRef?.nativeElement;
    if (!canvas) return;

    this.statusChart?.destroy();
    const primaryColor = this.corPrimaria();
    const textColor = this.corTextoGrafico();

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
            backgroundColor: [primaryColor, '#dc2626', '#16a34a'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor
            }
          }
        }
      }
    };

    this.statusChart = new Chart(canvas, config);
  }

  private renderizarGraficoEspecialidades() {
    const canvas = this.especialidadesChartRef?.nativeElement;
    if (!canvas) return;

    this.especialidadesChart?.destroy();
    const primaryColor = this.corPrimaria();
    const textColor = this.corTextoGrafico();
    const gridColor = this.corGradeGrafico();

    const totaisPorEspecialidade = this.rankingEspecialidades();

    const labels = totaisPorEspecialidade.length
      ? totaisPorEspecialidade.map(item => item.nome)
      : ['Sem consultas'];

    const dados = totaisPorEspecialidade.length
      ? totaisPorEspecialidade.map(item => item.total)
      : [0];

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Consultas',
            data: dados,
            backgroundColor: primaryColor,
            borderRadius: 6,
            categoryPercentage: 0.7,
            barPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: textColor,
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
              callback: (_value, index) => this.abreviarRotulo(labels[index] ?? '')
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: itens => labels[itens[0]?.dataIndex ?? 0] ?? ''
            }
          }
        }
      }
    };

    this.especialidadesChart = new Chart(canvas, config);
  }

  private renderizarGraficoMensal() {
    const canvas = this.mensalChartRef?.nativeElement;
    if (!canvas) return;

    this.mensalChart?.destroy();
    const primaryColor = this.corPrimaria();
    const textColor = this.corTextoGrafico();
    const gridColor = this.corGradeGrafico();

    const meses = this.montarUltimosMeses(6);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: meses.map(mes => mes.rotulo),
        datasets: [
          {
            label: 'Agendadas',
            data: meses.map(mes => this.contarConsultasNoMes(mes.data, 'AGENDADA')),
            backgroundColor: primaryColor,
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
            stacked: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor
            }
          },
          y: {
            beginAtZero: true,
            stacked: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor
            }
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
    const textColor = this.corTextoGrafico();
    const gridColor = this.corGradeGrafico();

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
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
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

  private montarRankingEspecialidades(consultas: ConsultaModel[]) {
    const totais = new Map<string, number>();

    consultas.forEach(consulta => {
      const nome = consulta.especialidadeNome?.trim();
      if (!nome) return;

      totais.set(nome, (totais.get(nome) ?? 0) + 1);
    });

    return Array.from(totais.entries())
      .map(([nome, total]) => ({ nome, total }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
      .slice(0, 6);
  }

  private abreviarRotulo(valor: string, limite = 18) {
    return valor.length > limite ? `${valor.slice(0, limite - 3)}...` : valor;
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

  private corPrimaria() {
    return getComputedStyle(document.body)
      .getPropertyValue('--color-primary')
      .trim() || '#0284c7';
  }

  private corTextoGrafico() {
    return getComputedStyle(document.body)
      .getPropertyValue('--color-muted')
      .trim() || '#64748b';
  }

  private corGradeGrafico() {
    return getComputedStyle(document.body)
      .getPropertyValue('--color-border')
      .trim() || '#dce7ec';
  }
}
