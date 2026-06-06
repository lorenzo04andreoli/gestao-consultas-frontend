import { Component, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth';
import { ThemeService } from '../../core/theme/theme';
import { ConfirmationDialog } from '../../shared/confirmation/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmationDialog],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout {
  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  inicialPerfil() {
    return this.authService.email()?.charAt(0).toUpperCase() ?? 'U';
  }

  perfilLabel() {
    return this.authService.perfil() === 'ADMIN' ? 'Administrador' : 'Dentista';
  }

  logoSrc() {
    return this.themeService.tema() === 'escuro'
      ? '/dentix-logo copy.svg'
      : '/dentix-logo.svg';
  }

  manterSubmenuAberto(grupoAtual: string) {
    this.elementRef.nativeElement
      .querySelectorAll<HTMLDetailsElement>('.nav-group[data-menu-group]')
      .forEach(grupo => {
        grupo.open = grupo.dataset['menuGroup'] === grupoAtual;
      });
  }

  sair() {
    this.authService.logout();
  }
}
