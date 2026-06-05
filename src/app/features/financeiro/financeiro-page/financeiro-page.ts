import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { FinanceiroService } from '../financeiro';
import { FinanceiroLancamentoModel, FinanceiroResumoModel } from '../financeiro.model';

@Component({
  selector: 'app-financeiro-page',
  standalone: true,
  templateUrl: './financeiro-page.html',
  styleUrl: './financeiro-page.scss'
})
export class FinanceiroPage implements OnInit {
  resumo = signal<FinanceiroResumoModel | null>(null);
  lancamentos = signal<FinanceiroLancamentoModel[]>([]);
  carregando = signal(true);
  erro = signal('');

  constructor(private financeiroService: FinanceiroService) {}

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
        this.resumo.set(resumo);
        this.lancamentos.set(lancamentos);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar financeiro.'));
        this.carregando.set(false);
      }
    });
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

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
