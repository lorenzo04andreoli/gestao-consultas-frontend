import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { FinanceiroService } from '../financeiro';
import { FinanceiroLancamentoModel, FinanceiroResumoModel } from '../financeiro.model';

@Component({
  selector: 'app-financeiro-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './financeiro-page.html',
  styleUrl: './financeiro-page.scss'
})
export class FinanceiroPage implements OnInit {
  resumo = signal<FinanceiroResumoModel | null>(null);
  lancamentos = signal<FinanceiroLancamentoModel[]>([]);
  carregando = signal(true);
  acaoEmAndamento = signal<number | null>(null);
  erro = signal('');
  sucesso = signal('');
  termoBusca = '';
  statusFiltro: FinanceiroLancamentoModel['status'] | '' = '';

  constructor(
    private financeiroService: FinanceiroService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set('');

    forkJoin({
      resumo: this.financeiroService.resumo(),
      lancamentos: this.financeiroService.listarLancamentos()
    }).subscribe({
      next: ({ resumo, lancamentos }) => {
        this.resumo.set(this.montarResumoDaListagem(resumo, lancamentos));
        this.lancamentos.set(lancamentos);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar financeiro.'));
        this.carregando.set(false);
      }
    });
  }

  async marcarComoPago(lancamento: FinanceiroLancamentoModel) {
    const confirmar = await this.confirmation.confirmar({
      title: 'Marcar como pago',
      message: `Confirmar pagamento de ${this.formatarMoeda(lancamento.valor)} para ${lancamento.pacienteNome}?`,
      confirmLabel: 'Marcar como pago',
      cancelLabel: 'Cancelar',
      tone: 'primary'
    });

    if (!confirmar) return;

    this.executarAcaoLancamento(
      lancamento.id,
      () => this.financeiroService.marcarComoPago(lancamento.id),
      'Cobranca marcada como paga.'
    );
  }

  async cancelarLancamento(lancamento: FinanceiroLancamentoModel) {
    const confirmar = await this.confirmation.confirmar({
      title: 'Cancelar cobranca',
      message: `Cancelar a cobranca de ${lancamento.pacienteNome}? Ela deixara de contar nos valores a receber.`,
      confirmLabel: 'Cancelar cobranca',
      cancelLabel: 'Voltar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.executarAcaoLancamento(
      lancamento.id,
      () => this.financeiroService.cancelar(lancamento.id),
      'Cobranca cancelada com sucesso.'
    );
  }

  podeMarcarComoPago(lancamento: FinanceiroLancamentoModel) {
    return lancamento.status === 'PENDENTE';
  }

  podeCancelar(lancamento: FinanceiroLancamentoModel) {
    return lancamento.status === 'PENDENTE';
  }

  lancamentosFiltrados() {
    const termo = this.normalizarTexto(this.termoBusca);

    return this.lancamentos()
      .filter(lancamento => !this.statusFiltro || lancamento.status === this.statusFiltro)
      .filter(lancamento => !termo || this.lancamentoContemTermo(lancamento, termo));
  }

  limparFiltros() {
    this.termoBusca = '';
    this.statusFiltro = '';
  }

  formatarMoeda(valor?: number | null) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor ?? 0);
  }

  formatarData(data?: string | null) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR').format(new Date(`${data}T00:00:00`));
  }

  formatarDataHora(data?: string | null) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  statusLabel(status: FinanceiroLancamentoModel['status']) {
    const labels = {
      PENDENTE: 'Pendente',
      PAGO: 'Pago',
      CANCELADO: 'Cancelado'
    };

    return labels[status] ?? status;
  }

  statusClass(status: FinanceiroLancamentoModel['status']) {
    return status.toLowerCase();
  }

  private executarAcaoLancamento(
    id: number,
    acao: () => ReturnType<FinanceiroService['marcarComoPago']>,
    mensagemSucesso: string
  ) {
    this.erro.set('');
    this.sucesso.set('');
    this.acaoEmAndamento.set(id);

    acao().subscribe({
      next: () => {
        this.sucesso.set(mensagemSucesso);
        this.acaoEmAndamento.set(null);
        this.carregarDados();
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao atualizar cobranca.'));
        this.acaoEmAndamento.set(null);
      }
    });
  }

  private montarResumoDaListagem(
    resumo: FinanceiroResumoModel,
    lancamentos: FinanceiroLancamentoModel[]
  ): FinanceiroResumoModel {
    const pendentes = lancamentos.filter(lancamento => lancamento.status === 'PENDENTE');
    const pagas = lancamentos.filter(lancamento => lancamento.status === 'PAGO');
    const canceladas = lancamentos.filter(lancamento => lancamento.status === 'CANCELADO');

    return {
      ...resumo,
      aReceber: pendentes.reduce((total, lancamento) => total + lancamento.valor, 0),
      pendentes: pendentes.length,
      pagas: pagas.length,
      canceladas: canceladas.length
    };
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private lancamentoContemTermo(lancamento: FinanceiroLancamentoModel, termo: string) {
    return [
      lancamento.pacienteNome,
      lancamento.dentistaNome,
      lancamento.descricao,
      lancamento.status,
      this.formatarMoeda(lancamento.valor)
    ].some(valor => this.normalizarTexto(valor).includes(termo));
  }
}
