import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { ConsultaModel, StatusConsulta } from '../consulta.model';
import { ConsultaService } from '../consulta';

@Component({
  selector: 'app-consultas-listar-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consultas-listar-page.html',
  styleUrl: './consultas-listar-page.scss'
})
export class ConsultasListarPage implements OnInit {
  private consultaService = inject(ConsultaService);
  private confirmation = inject(ConfirmationService);

  consultas = signal<ConsultaModel[]>([]);
  erro = signal('');
  sucesso = signal('');
  modalCancelamentoAberto = signal(false);
  termoBusca = '';
  statusFiltro: StatusConsulta | '' = '';
  dataInicioFiltro = '';
  dataFimFiltro = '';
  consultaCancelamentoId: number | null = null;
  motivoCancelamento = '';
  paginaAtual = signal(0);
  itensPorPagina = signal(10);
  totalConsultas = signal(0);
  totalPaginas = signal(0);

  ngOnInit() {
    this.carregarConsultas();
  }

  carregarConsultas() {
    this.erro.set('');

    this.consultaService.listarPaginado(
      this.paginaAtual(),
      this.itensPorPagina(),
      this.filtrosPaginacao()
    ).subscribe({
      next: pagina => {
        this.consultas.set(pagina.content);
        this.totalConsultas.set(pagina.totalElements);
        this.totalPaginas.set(pagina.totalPages);
      },
      error: err => this.erro.set(this.extrairMensagemErro(err))
    });
  }

  async finalizarConsulta(consulta: ConsultaModel) {
    if (!consulta.id) return;

    const confirmar = await this.confirmation.confirmar({
      title: 'Finalizar consulta',
      message: 'A consulta será marcada como finalizada e sairá do fluxo de atendimentos pendentes.',
      confirmLabel: 'Finalizar',
      cancelLabel: 'Cancelar',
      tone: 'primary'
    });

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.consultaService.finalizar(consulta.id).subscribe({
      next: () => {
        this.sucesso.set('Consulta finalizada com sucesso.');
        this.carregarConsultas();
      },
      error: err => this.erro.set(this.extrairMensagemErro(err))
    });
  }

  abrirModalCancelamento(consulta: ConsultaModel) {
    if (!consulta.id) return;

    this.consultaCancelamentoId = consulta.id;
    this.motivoCancelamento = '';
    this.modalCancelamentoAberto.set(true);
  }

  fecharModalCancelamento() {
    this.modalCancelamentoAberto.set(false);
    this.consultaCancelamentoId = null;
    this.motivoCancelamento = '';
  }

  cancelarConsulta() {
    const motivo = this.motivoCancelamento.trim();

    if (!this.consultaCancelamentoId) return;

    if (!motivo) {
      this.erro.set('Informe o motivo do cancelamento.');
      return;
    }

    this.erro.set('');
    this.sucesso.set('');

    this.consultaService.cancelar(this.consultaCancelamentoId, motivo).subscribe({
      next: () => {
        this.sucesso.set('Consulta cancelada com sucesso.');
        this.fecharModalCancelamento();
        this.carregarConsultas();
      },
      error: err => this.erro.set(this.extrairMensagemErro(err))
    });
  }

  formatarData(data: string) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  consultasFiltradas() {
    return this.consultas();
  }

  limparFiltros() {
    this.termoBusca = '';
    this.statusFiltro = '';
    this.dataInicioFiltro = '';
    this.dataFimFiltro = '';
    this.paginaAtual.set(0);
    this.carregarConsultas();
  }

  aoAlterarFiltros() {
    this.paginaAtual.set(0);
    this.carregarConsultas();
  }

  paginas() {
    return Array.from({ length: this.totalPaginas() }, (_, index) => index);
  }

  irParaPagina(pagina: number) {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaAtual()) return;

    this.paginaAtual.set(pagina);
    this.carregarConsultas();
  }

  private extrairMensagemErro(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? 'Erro ao carregar consultas.';
    }

    return 'Erro ao carregar consultas.';
  }

  private filtrosPaginacao() {
    return {
      termo: this.termoBusca.trim(),
      status: this.statusFiltro,
      dataInicio: this.dataInicioFiltro ? `${this.dataInicioFiltro}T00:00:00` : '',
      dataFim: this.dataFimFiltro ? `${this.dataFimFiltro}T23:59:59` : ''
    };
  }
}
