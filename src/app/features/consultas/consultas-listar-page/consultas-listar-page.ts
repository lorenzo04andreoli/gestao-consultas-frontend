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

  ngOnInit() {
    this.carregarConsultas();
  }

  carregarConsultas() {
    this.erro.set('');

    this.consultaService.listar().subscribe({
      next: dados => this.consultas.set(dados),
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
    const termo = this.normalizarTexto(this.termoBusca);

    return this.consultas()
      .filter(consulta => !termo || this.consultaContemTermo(consulta, termo))
      .filter(consulta => !this.statusFiltro || consulta.status === this.statusFiltro)
      .filter(consulta => this.consultaDentroDoPeriodo(consulta));
  }

  limparFiltros() {
    this.termoBusca = '';
    this.statusFiltro = '';
    this.dataInicioFiltro = '';
    this.dataFimFiltro = '';
  }

  private extrairMensagemErro(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? 'Erro ao carregar consultas.';
    }

    return 'Erro ao carregar consultas.';
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private consultaContemTermo(consulta: ConsultaModel, termo: string) {
    return [
      consulta.pacienteNome,
      consulta.dentistaNome,
      consulta.descricao,
      consulta.status
    ].some(valor => this.normalizarTexto(valor).includes(termo));
  }

  private consultaDentroDoPeriodo(consulta: ConsultaModel) {
    const inicioConsulta = new Date(consulta.dataInicio).getTime();
    const inicioFiltro = this.dataInicioFiltro
      ? new Date(`${this.dataInicioFiltro}T00:00:00`).getTime()
      : null;
    const fimFiltro = this.dataFimFiltro
      ? new Date(`${this.dataFimFiltro}T23:59:59`).getTime()
      : null;

    if (inicioFiltro && inicioConsulta < inicioFiltro) return false;
    if (fimFiltro && inicioConsulta > fimFiltro) return false;

    return true;
  }
}
