import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SolicitacaoAlteracaoResponseModel } from '../solicitacao-alteracao.model';
import { SolicitacaoAlteracaoService } from '../solicitacao-alteracao';

@Component({
  selector: 'app-minhas-solicitacoes-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './minhas-solicitacoes-page.html',
  styleUrl: './minhas-solicitacoes-page.scss'
})
export class MinhasSolicitacoesPage implements OnInit {
  solicitacoes = signal<SolicitacaoAlteracaoResponseModel[]>([]);
  solicitacaoSelecionada = signal<SolicitacaoAlteracaoResponseModel | null>(null);
  modalNovaSolicitacaoAberto = signal(false);
  filtroStatus = signal<'TODAS' | 'PENDENTE' | 'RESPONDIDA'>('TODAS');
  carregando = signal(false);
  enviando = signal(false);
  erro = signal('');
  sucesso = signal('');
  assunto = '';
  descricao = '';

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

    this.solicitacaoService.listarMinhas().subscribe({
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

  abrirNovaSolicitacao() {
    this.assunto = '';
    this.descricao = '';
    this.erro.set('');
    this.sucesso.set('');
    this.modalNovaSolicitacaoAberto.set(true);
  }

  fecharNovaSolicitacao() {
    this.modalNovaSolicitacaoAberto.set(false);
  }

  enviarSolicitacao() {
    const assunto = this.assunto.trim();
    const descricao = this.descricao.trim();

    if (!assunto) {
      this.erro.set('Informe o assunto da solicitação.');
      return;
    }

    if (!descricao) {
      this.erro.set('Descreva quais dados precisam ser alterados.');
      return;
    }

    this.enviando.set(true);
    this.erro.set('');
    this.sucesso.set('');

    this.solicitacaoService.criar({ assunto, descricao }).subscribe({
      next: solicitacao => {
        this.solicitacoes.update(solicitacoes => [solicitacao, ...solicitacoes]);
        this.fecharNovaSolicitacao();
        this.sucesso.set('Solicitação enviada ao administrador.');
        this.enviando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao enviar solicitação.'));
        this.enviando.set(false);
      }
    });
  }

  abrirDetalhe(solicitacao: SolicitacaoAlteracaoResponseModel) {
    this.solicitacaoSelecionada.set(solicitacao);
  }

  fecharDetalhe() {
    this.solicitacaoSelecionada.set(null);
  }

  statusLabel(status: string) {
    return status === 'PENDENTE' ? 'Pendente' : 'Respondida';
  }

  assuntoSolicitacao(solicitacao: SolicitacaoAlteracaoResponseModel) {
    return solicitacao.assunto?.trim() || 'Solicitação de alteração';
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
