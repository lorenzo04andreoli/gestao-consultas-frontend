import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaModel, StatusConsulta } from '../../consultas/consulta.model';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-paciente-detalhe-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './paciente-detalhe-page.html',
  styleUrl: './paciente-detalhe-page.scss'
})
export class PacienteDetalhePage implements OnInit {
  paciente = signal<PacienteModel | null>(null);
  consultas = signal<ConsultaModel[]>([]);
  carregando = signal(true);
  carregandoConsultas = signal(true);
  erro = signal('');
  voltarPara = '/pacientes/pesquisar';

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PacienteService,
    private consultaService: ConsultaService
  ) {}

  ngOnInit() {
    this.definirRetorno();
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.erro.set('Paciente não encontrado.');
      this.carregando.set(false);
      this.carregandoConsultas.set(false);
      return;
    }

    this.pacienteService.buscarPorId(id).subscribe({
      next: dados => {
        this.paciente.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar paciente.');
        this.carregando.set(false);
      }
    });

    this.carregarConsultas(id);
  }

  carregarConsultas(pacienteId: number) {
    this.carregandoConsultas.set(true);

    this.consultaService.relatorios({ pacienteId }).subscribe({
      next: dados => {
        this.consultas.set(
          dados.sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
        );
        this.carregandoConsultas.set(false);
      },
      error: () => {
        this.carregandoConsultas.set(false);
      }
    });
  }

  totalConsultas() {
    return this.consultas().length;
  }

  consultasAgendadas() {
    return this.consultas().filter(consulta => consulta.status === 'AGENDADA').length;
  }

  ultimaConsulta() {
    return this.consultas()[0] ?? null;
  }

  formatarData(data?: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  formatarIntervalo(consulta: ConsultaModel) {
    const inicio = new Date(consulta.dataInicio);
    const fim = new Date(consulta.dataFim);

    return `${this.formatarHora(inicio)} - ${this.formatarHora(fim)}`;
  }

  labelStatus(status: StatusConsulta) {
    const labels: Record<StatusConsulta, string> = {
      AGENDADA: 'Agendada',
      FINALIZADA: 'Finalizada',
      CANCELADA: 'Cancelada'
    };

    return labels[status];
  }

  private definirRetorno() {
    const origem = this.route.snapshot.queryParamMap.get('origem');

    if (origem === 'listar') {
      this.voltarPara = '/pacientes/listar';
      return;
    }

    if (origem === 'dashboard') {
      this.voltarPara = '/dashboard';
      return;
    }

    this.voltarPara = '/pacientes/pesquisar';
  }

  private formatarHora(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }
}
