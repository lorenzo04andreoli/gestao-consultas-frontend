import { Component, OnInit, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { DentistaResponseModel } from '../dentista.model';
import { DentistaService } from '../dentista';

@Component({
  selector: 'app-dentistas-pesquisar-page',
  standalone: true,
  imports: [FormsModule, RouterLink, NgTemplateOutlet],
  templateUrl: './dentistas-pesquisar-page.html',
  styleUrl: './dentistas-pesquisar-page.scss'
})
export class DentistasPesquisarPage implements OnInit {
  dentistas = signal<DentistaResponseModel[]>([]);
  carregando = signal(false);
  erro = signal('');
  termoBusca = signal('');
  resultadosAbertos = signal(false);

  dentistasFiltrados = computed(() => {
    const termo = this.normalizarTexto(this.termoBusca());

    if (!termo) return this.dentistas().slice(0, 8);

    return this.dentistas()
      .filter(dentista => this.dentistaContemTermo(dentista, termo))
      .slice(0, 12);
  });

  constructor(
    public authService: AuthService,
    private dentistaService: DentistaService
  ) {}

  ngOnInit() {
    this.carregarDentistas();
  }

  carregarDentistas() {
    this.carregando.set(true);
    this.erro.set('');

    this.dentistaService.listar().subscribe({
      next: dados => {
        this.dentistas.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar dentistas.');
        this.carregando.set(false);
      }
    });
  }

  atualizarBusca(valor: string) {
    this.termoBusca.set(valor);
    this.resultadosAbertos.set(true);
  }

  limparBusca() {
    this.termoBusca.set('');
    this.resultadosAbertos.set(true);
  }

  abrirResultados() {
    this.resultadosAbertos.set(true);
  }

  fecharResultados() {
    window.setTimeout(() => this.resultadosAbertos.set(false), 150);
  }

  inicialDentista(dentista: DentistaResponseModel) {
    return dentista.nome.trim().charAt(0).toUpperCase() || 'D';
  }

  private dentistaContemTermo(dentista: DentistaResponseModel, termo: string) {
    return [
      dentista.nome,
      dentista.email,
      dentista.cpf,
      dentista.cro,
      dentista.especialidades.join(' ')
    ]
      .filter((valor): valor is string => Boolean(valor))
      .some(valor => this.normalizarTexto(valor).includes(termo));
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
