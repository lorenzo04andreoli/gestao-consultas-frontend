import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

  consultas = signal<ConsultaModel[]>([]);
  erro = signal('');
  termoBusca = '';
  statusFiltro: StatusConsulta | '' = '';
  dataInicioFiltro = '';
  dataFimFiltro = '';

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
