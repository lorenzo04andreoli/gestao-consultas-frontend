import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { ConsultaService } from '../../consultas/consulta';
import { ConsultaModel } from '../../consultas/consulta.model';
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
  consultas = signal<ConsultaModel[]>([]);
  carregando = signal(true);
  salvando = signal(false);
  acaoEmAndamento = signal<number | null>(null);
  modalAberto = signal(false);
  buscandoPreco = signal(false);
  avisoPreco = signal('');
  erro = signal('');
  sucesso = signal('');
  termoBusca = '';
  statusFiltro: FinanceiroLancamentoModel['status'] | '' = '';
  incluirConsultasAntigas = false;

  form = this.criarFormVazio();

  constructor(
    private financeiroService: FinanceiroService,
    private consultaService: ConsultaService,
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
      lancamentos: this.financeiroService.listarLancamentos(),
      consultas: this.consultaService.listar()
    }).subscribe({
      next: ({ resumo, lancamentos, consultas }) => {
        this.resumo.set(resumo);
        this.lancamentos.set(lancamentos);
        this.consultas.set(consultas);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar financeiro.'));
        this.carregando.set(false);
      }
    });
  }

  abrirModalCobranca() {
    this.form = this.criarFormVazio();
    this.incluirConsultasAntigas = false;
    this.avisoPreco.set('');
    this.erro.set('');
    this.sucesso.set('');
    this.modalAberto.set(true);
  }

  fecharModalCobranca() {
    this.modalAberto.set(false);
    this.form = this.criarFormVazio();
    this.incluirConsultasAntigas = false;
    this.avisoPreco.set('');
  }

  criarCobranca() {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.form.consultaId) {
      this.erro.set('Selecione uma consulta.');
      return;
    }

    if (!this.form.descricao.trim()) {
      this.erro.set('Informe a descricao da cobranca.');
      return;
    }

    if (!this.form.valor || this.form.valor <= 0) {
      this.erro.set('Informe um valor maior que zero.');
      return;
    }

    this.salvando.set(true);

    this.financeiroService.criarLancamento({
      consultaId: this.form.consultaId,
      descricao: this.form.descricao.trim(),
      valor: Number(this.form.valor),
      dataVencimento: this.form.dataVencimento || null
    }).subscribe({
      next: () => {
        this.sucesso.set('Cobranca criada com sucesso.');
        this.salvando.set(false);
        this.fecharModalCobranca();
        this.carregarDados();
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao criar cobranca.'));
        this.salvando.set(false);
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

  aoSelecionarConsulta() {
    this.avisoPreco.set('');

    if (!this.form.consultaId) {
      this.form.descricao = '';
      this.form.valor = null;
      return;
    }

    const consulta = this.consultas().find(item => item.id === this.form.consultaId);

    if (!consulta?.dentistaId || !consulta.especialidadeId) {
      this.avisoPreco.set('Consulta sem especialidade vinculada. Informe o valor manualmente.');
      return;
    }

    this.buscandoPreco.set(true);

    this.financeiroService.sugerirPreco(consulta.dentistaId, consulta.especialidadeId).subscribe({
      next: sugestao => {
        this.buscandoPreco.set(false);

        if (!sugestao.encontrado || sugestao.valor == null) {
          this.avisoPreco.set('Nenhum preco cadastrado para esta especialidade. Informe o valor manualmente.');
          return;
        }

        this.form.valor = sugestao.valor;
        this.form.descricao = sugestao.descricao || consulta.descricao || 'Consulta odontologica';
        this.avisoPreco.set(
          sugestao.origem === 'DENTISTA'
            ? 'Valor sugerido pela regra especifica do dentista.'
            : 'Valor sugerido pela regra geral da especialidade.'
        );
      },
      error: err => {
        this.buscandoPreco.set(false);
        this.avisoPreco.set(this.extrairMensagemErro(err, 'Nao foi possivel sugerir o preco.'));
      }
    });
  }

  consultasDisponiveis() {
    const consultasComLancamento = new Set(this.lancamentos().map(lancamento => lancamento.consultaId));
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    return this.consultas()
      .filter(consulta => !!consulta.id)
      .filter(consulta => consulta.status !== 'CANCELADA')
      .filter(consulta => !consultasComLancamento.has(consulta.id!))
      .filter(consulta => this.incluirConsultasAntigas || new Date(consulta.dataInicio) >= inicioHoje)
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
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

  descricaoConsulta(consulta: ConsultaModel) {
    const especialidade = consulta.especialidadeNome ? ` - ${consulta.especialidadeNome}` : '';
    return `${consulta.pacienteNome} - ${consulta.dentistaNome}${especialidade} - ${this.formatarDataHora(consulta.dataInicio)}`;
  }

  private criarFormVazio() {
    return {
      consultaId: null as number | null,
      descricao: '',
      valor: null as number | null,
      dataVencimento: ''
    };
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
