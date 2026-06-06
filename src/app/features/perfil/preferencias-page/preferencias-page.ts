import { Component } from '@angular/core';
import { TemaAplicacao, ThemeService } from '../../../core/theme/theme';

@Component({
  selector: 'app-preferencias-page',
  standalone: true,
  templateUrl: './preferencias-page.html',
  styleUrl: './preferencias-page.scss'
})
export class PreferenciasPage {
  constructor(public themeService: ThemeService) {}

  selecionarTema(tema: TemaAplicacao) {
    this.themeService.definirTema(tema);
  }

  temaAtual(tema: TemaAplicacao) {
    return this.themeService.tema() === tema;
  }
}
