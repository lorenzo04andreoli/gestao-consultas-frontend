import { Injectable, signal } from '@angular/core';

export type TemaAplicacao = 'claro' | 'escuro';

const STORAGE_KEY = 'dentix-tema';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  tema = signal<TemaAplicacao>(this.lerTemaSalvo());

  constructor() {
    this.aplicarTema(this.tema());
  }

  definirTema(tema: TemaAplicacao) {
    this.tema.set(tema);
    localStorage.setItem(STORAGE_KEY, tema);
    this.aplicarTema(tema);
  }

  aplicarTemaAtual() {
    this.aplicarTema(this.tema());
  }

  suspenderTema() {
    document.body.classList.remove('theme-dark', 'theme-light');
  }

  private lerTemaSalvo(): TemaAplicacao {
    const tema = localStorage.getItem(STORAGE_KEY);
    return tema === 'escuro' ? 'escuro' : 'claro';
  }

  private aplicarTema(tema: TemaAplicacao) {
    document.body.classList.toggle('theme-dark', tema === 'escuro');
    document.body.classList.toggle('theme-light', tema === 'claro');
  }
}
