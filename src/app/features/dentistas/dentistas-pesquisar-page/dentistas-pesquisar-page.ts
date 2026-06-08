import { Component, ElementRef, HostListener, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth';
import { DentistaResponseModel } from '../dentista.model';
import { DentistaService } from '../dentista';

@Component({
  selector: 'app-dentistas-pesquisar-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet],
  templateUrl: './dentistas-pesquisar-page.html',
  styleUrl: './dentistas-pesquisar-page.scss'
})
export class DentistasPesquisarPage implements OnInit {
  dentistas = signal<DentistaResponseModel[]>([]);
  carregando = signal(false);
  erro = signal('');
  resultadosAbertos = signal(false);
  buscaControl = new FormControl('', { nonNullable: true });
  termoBusca = toSignal(
    this.buscaControl.valueChanges.pipe(
      startWith(this.buscaControl.value),
      debounceTime(250),
      map(valor => this.normalizarTexto(valor)),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );

  dentistasFiltrados = computed(() => {
    const termo = this.termoBusca();

    if (!termo) return this.dentistas().slice(0, 8);

    return this.dentistas()
      .filter(dentista => this.dentistaContemTermo(dentista, termo))
      .slice(0, 12);
  });

  constructor(
    public authService: AuthService,
    private dentistaService: DentistaService,
    private elementRef: ElementRef<HTMLElement>
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

  limparBusca() {
    this.buscaControl.setValue('');
    this.resultadosAbertos.set(true);
  }

  abrirResultados() {
    this.resultadosAbertos.set(true);
  }

  @HostListener('document:click', ['$event'])
  fecharResultadosAoClicarFora(event: MouseEvent) {
    const alvo = event.target as Node | null;
    const pesquisa = this.elementRef.nativeElement.querySelector('.search-card');

    if (alvo && pesquisa?.contains(alvo)) return;

    this.resultadosAbertos.set(false);
  }

  @HostListener('document:keydown.escape')
  fecharResultados() {
    this.resultadosAbertos.set(false);
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
