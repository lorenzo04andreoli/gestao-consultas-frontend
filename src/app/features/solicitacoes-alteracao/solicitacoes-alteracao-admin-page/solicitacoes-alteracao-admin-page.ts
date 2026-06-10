import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SolicitacaoAlteracaoResponseModel } from '../solicitacao-alteracao.model';
import { SolicitacaoAlteracaoService } from '../solicitacao-alteracao';

@Component({
  selector: 'app-solicitacoes-alteracao-admin-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './solicitacoes-alteracao-admin-page.html',
  styleUrl: './solicitacoes-alteracao-admin-page.scss'
})
export class SolicitacoesAlteracaoAdminPage implements OnInit {
  solicitacoes = signal<SolicitacaoAlteracaoResponseModel[]>([]);
  solicitacaoSelecionada = signal<SolicitacaoAlteracaoResponseModel | null>(null);
  filtroStatus = signal<'TODAS' | 'PENDENTE' | 'RESPONDIDA'>('TODAS');
  carregando = signal(false);
  erro = signal('');
  sucesso = signal('');
  resposta = '';

  solicitacoesFiltradas = computed(() => {
    const filtro = this.filtroStatus();

    if (filtro === 'TODAS') return this.solicitacoes();

    return this.solicitacoes().filter(solicitacao => solicitacao.status === filtro);
  });

  totalPendentes = computed(() =>
    this.solicitacoes().filter(solicitacao => solicitacao.status === 'PENDENTE').length
  );

  totalRespondidas = computed(() =>
    this.solicitacoes().filter(solicitacao => solicitacao.status === 'RESPONDIDA').length
  );

  constructor(private solicitacaoService: SolicitacaoAlteracaoService) {}

  ngOnInit() {
    this.carregarSolicitacoes();
  }

  carregarSolicitacoes() {
    this.carregando.set(true);
    this.erro.set('');

    this.solicitacaoService.listarAdmin().subscribe({
      next: solicitacoes => {
        this.solicitacoes.set(solicitacoes);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar solicitações.'));
        this.carregando.set(false);
      }
    });
  }

  alterarFiltro(filtro: 'TODAS' | 'PENDENTE' | 'RESPONDIDA') {
    this.filtroStatus.set(filtro);
  }

  abrirResposta(solicitacao: SolicitacaoAlteracaoResponseModel) {
    this.solicitacaoSelecionada.set(solicitacao);
    this.resposta = solicitacao.resposta ?? '';
    this.erro.set('');
    this.sucesso.set('');
  }

  fecharResposta() {
    this.solicitacaoSelecionada.set(null);
    this.resposta = '';
  }

  responder() {
    const solicitacao = this.solicitacaoSelecionada();
    const resposta = this.resposta.trim();

    if (!solicitacao || !resposta) {
      this.erro.set('Informe a resposta para a solicitação.');
      return;
    }

    this.carregando.set(true);
    this.erro.set('');
    this.sucesso.set('');

    this.solicitacaoService.responder(solicitacao.id, { resposta }).subscribe({
      next: solicitacaoAtualizada => {
        this.solicitacoes.update(solicitacoes =>
          solicitacoes.map(item => item.id === solicitacaoAtualizada.id ? solicitacaoAtualizada : item)
        );
        this.sucesso.set('Resposta enviada ao usuário.');
        this.fecharResposta();
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao responder solicitação.'));
        this.carregando.set(false);
      }
    });
  }

  statusLabel(status: string) {
    return status === 'PENDENTE' ? 'Pendente' : 'Respondida';
  }

  assuntoSolicitacao(solicitacao: SolicitacaoAlteracaoResponseModel) {
    return solicitacao.assunto?.trim() || 'Solicitacao de alteracao';
  }

  dataFormatada(data?: string | null) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
