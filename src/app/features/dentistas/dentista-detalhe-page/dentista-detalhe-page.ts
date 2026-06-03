import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaModel, StatusConsulta } from '../../consultas/consulta.model';
import { DentistaResponseModel } from '../dentista.model';
import { DentistaService } from '../dentista';

@Component({
  selector: 'app-dentista-detalhe-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dentista-detalhe-page.html',
  styleUrl: './dentista-detalhe-page.scss'
})
export class DentistaDetalhePage implements OnInit {
  dentista = signal<DentistaResponseModel | null>(null);
  consultas = signal<ConsultaModel[]>([]);
  carregando = signal(true);
  carregandoConsultas = signal(true);
  erro = signal('');
  voltarPara = '/dentistas/pesquisar';

  constructor(
    private route: ActivatedRoute,
    private dentistaService: DentistaService,
    private consultaService: ConsultaService
  ) {}

  ngOnInit() {
    this.definirRetorno();
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.erro.set('Dentista não encontrado.');
      this.carregando.set(false);
      this.carregandoConsultas.set(false);
      return;
    }

    this.dentistaService.buscarPorId(id).subscribe({
      next: dados => {
        this.dentista.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dentista.');
        this.carregando.set(false);
      }
    });

    this.carregarConsultas(id);
  }

  carregarConsultas(dentistaId: number) {
    this.carregandoConsultas.set(true);

    this.consultaService.relatorios({ dentistaId }).subscribe({
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

  especialidadesFormatadas(dentista: DentistaResponseModel) {
    return dentista.especialidades.join(', ') || '-';
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
      this.voltarPara = '/dentistas/listar';
      return;
    }

    if (origem === 'arquivados') {
      this.voltarPara = '/dentistas/arquivados';
      return;
    }

    if (origem === 'dashboard') {
      this.voltarPara = '/dashboard';
      return;
    }

    this.voltarPara = '/dentistas/pesquisar';
  }

  private formatarHora(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }
}
