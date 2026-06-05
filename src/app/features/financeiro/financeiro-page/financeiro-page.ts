import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FinanceiroService } from '../financeiro';
import { FinanceiroResumoModel } from '../financeiro.model';

@Component({
  selector: 'app-financeiro-page',
  standalone: true,
  templateUrl: './financeiro-page.html',
  styleUrl: './financeiro-page.scss'
})
export class FinanceiroPage implements OnInit {
  resumo = signal<FinanceiroResumoModel | null>(null);
  carregando = signal(true);
  erro = signal('');

  constructor(private financeiroService: FinanceiroService) {}

  ngOnInit() {
    this.carregarResumo();
  }

  carregarResumo() {
    this.carregando.set(true);
    this.erro.set('');

    this.financeiroService.resumo().subscribe({
      next: resumo => {
        this.resumo.set(resumo);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar resumo financeiro.'));
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

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
