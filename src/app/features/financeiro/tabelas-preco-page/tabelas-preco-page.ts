import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { DentistaService } from '../../dentistas/dentista';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { FinanceiroService } from '../financeiro';
import {
  FinanceiroPrecoModel,
  FinanceiroTabelaPrecoModel
} from '../financeiro.model';

@Component({
  selector: 'app-tabelas-preco-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tabelas-preco-page.html',
  styleUrl: './tabelas-preco-page.scss'
})
export class TabelasPrecoPage implements OnInit {
  tabelas = signal<FinanceiroTabelaPrecoModel[]>([]);
  precos = signal<FinanceiroPrecoModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);
  dentistas = signal<DentistaResponseModel[]>([]);
  tabelaSelecionadaId = signal<number | null>(null);
  carregando = signal(true);
  carregandoPrecos = signal(false);
  salvandoTabela = signal(false);
  salvandoPreco = signal(false);
  acaoEmAndamento = signal<number | null>(null);
  erro = signal('');
  sucesso = signal('');

  tabelaForm = {
    nome: ''
  };

  precoForm = this.criarPrecoFormVazio();

  constructor(
    private financeiroService: FinanceiroService,
    private especialidadeService: EspecialidadeService,
    private dentistaService: DentistaService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set('');

    forkJoin({
      tabelas: this.financeiroService.listarTabelasPreco(),
      especialidades: this.especialidadeService.listar(),
      dentistas: this.dentistaService.listar()
    }).subscribe({
      next: ({ tabelas, especialidades, dentistas }) => {
        this.tabelas.set(tabelas);
        this.especialidades.set(especialidades);
        this.dentistas.set(dentistas);
        this.selecionarTabelaInicial(tabelas);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar tabelas de preco.'));
        this.carregando.set(false);
      }
    });
  }

  selecionarTabela(id: number | null) {
    this.tabelaSelecionadaId.set(id);
    this.precoForm.tabelaPrecoId = id;

    if (!id) {
      this.precos.set([]);
      return;
    }

    this.carregarPrecos(id);
  }

  criarTabela() {
    const nome = this.tabelaForm.nome.trim();
    this.limparMensagens();

    if (!nome) {
      this.erro.set('Informe o nome da tabela de precos.');
      return;
    }

    this.salvandoTabela.set(true);

    this.financeiroService.criarTabelaPreco({ nome, ativo: true }).subscribe({
      next: tabela => {
        this.sucesso.set('Tabela de precos criada com sucesso.');
        this.tabelaForm.nome = '';
        this.salvandoTabela.set(false);
        this.tabelas.update(tabelas => [...tabelas, tabela].sort((a, b) => a.nome.localeCompare(b.nome)));
        this.selecionarTabela(tabela.id);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao criar tabela de preco.'));
        this.salvandoTabela.set(false);
      }
    });
  }

  criarPreco() {
    this.limparMensagens();

    if (!this.precoForm.tabelaPrecoId) {
      this.erro.set('Selecione uma tabela de precos.');
      return;
    }

    if (!this.precoForm.especialidadeId) {
      this.erro.set('Selecione uma especialidade.');
      return;
    }

    if (!this.precoForm.descricao.trim()) {
      this.erro.set('Informe uma descricao para o preco.');
      return;
    }

    if (!this.precoForm.valor || this.precoForm.valor <= 0) {
      this.erro.set('Informe um valor maior que zero.');
      return;
    }

    this.salvandoPreco.set(true);

    this.financeiroService.criarPreco({
      tabelaPrecoId: this.precoForm.tabelaPrecoId,
      especialidadeId: this.precoForm.especialidadeId,
      dentistaId: this.precoForm.dentistaId || null,
      descricao: this.precoForm.descricao.trim(),
      valor: Number(this.precoForm.valor),
      ativo: true
    }).subscribe({
      next: () => {
        this.sucesso.set('Preco cadastrado com sucesso.');
        this.salvandoPreco.set(false);
        this.precoForm = this.criarPrecoFormVazio(this.tabelaSelecionadaId());
        this.carregarPrecos(this.tabelaSelecionadaId());
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao cadastrar preco.'));
        this.salvandoPreco.set(false);
      }
    });
  }

  async desativarTabela(tabela: FinanceiroTabelaPrecoModel) {
    const confirmar = await this.confirmation.confirmar({
      title: 'Desativar tabela',
      message: `Desativar a tabela ${tabela.nome}? Ela deixara de ser usada para novas sugestoes.`,
      confirmLabel: 'Desativar',
      cancelLabel: 'Voltar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.executarAcao(tabela.id, () => this.financeiroService.desativarTabelaPreco(tabela.id), () => {
      this.sucesso.set('Tabela desativada com sucesso.');
      this.carregarDados();
    });
  }

  async desativarPreco(preco: FinanceiroPrecoModel) {
    const confirmar = await this.confirmation.confirmar({
      title: 'Desativar preco',
      message: `Desativar o preco de ${preco.especialidadeNome}?`,
      confirmLabel: 'Desativar',
      cancelLabel: 'Voltar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.executarAcao(preco.id, () => this.financeiroService.desativarPreco(preco.id), () => {
      this.sucesso.set('Preco desativado com sucesso.');
      this.carregarPrecos(this.tabelaSelecionadaId());
    });
  }

  tabelaSelecionada() {
    return this.tabelas().find(tabela => tabela.id === this.tabelaSelecionadaId()) ?? null;
  }

  tabelasAtivas() {
    return this.tabelas().filter(tabela => tabela.ativo);
  }

  formatarMoeda(valor?: number | null) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor ?? 0);
  }

  statusLabel(ativo: boolean) {
    return ativo ? 'Ativa' : 'Inativa';
  }

  private carregarPrecos(tabelaPrecoId: number | null) {
    if (!tabelaPrecoId) return;

    this.carregandoPrecos.set(true);

    this.financeiroService.listarPrecos(tabelaPrecoId).subscribe({
      next: precos => {
        this.precos.set(precos);
        this.carregandoPrecos.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar precos.'));
        this.carregandoPrecos.set(false);
      }
    });
  }

  private selecionarTabelaInicial(tabelas: FinanceiroTabelaPrecoModel[]) {
    const selecionadaAtual = tabelas.find(
      tabela => tabela.id === this.tabelaSelecionadaId() && tabela.ativo
    );
    const proximaTabela = selecionadaAtual ?? tabelas.find(tabela => tabela.ativo) ?? tabelas[0] ?? null;
    this.selecionarTabela(proximaTabela?.id ?? null);
  }

  private executarAcao(
    id: number,
    acao: () => Observable<unknown>,
    onSuccess: () => void
  ) {
    this.limparMensagens();
    this.acaoEmAndamento.set(id);

    acao().subscribe({
      next: () => {
        this.acaoEmAndamento.set(null);
        onSuccess();
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao atualizar registro.'));
        this.acaoEmAndamento.set(null);
      }
    });
  }

  private criarPrecoFormVazio(tabelaPrecoId: number | null = null) {
    return {
      tabelaPrecoId,
      especialidadeId: null as number | null,
      dentistaId: null as number | null,
      descricao: '',
      valor: null as number | null
    };
  }

  private limparMensagens() {
    this.erro.set('');
    this.sucesso.set('');
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
