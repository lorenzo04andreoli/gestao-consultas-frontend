import { Component, ElementRef, HostListener } from '@angular/core';
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

  @HostListener('document:click', ['$event'])
  fecharMenuPerfilAoClicarFora(event: MouseEvent) {
    const alvo = event.target as Node | null;
    const menuPerfil = this.elementRef.nativeElement.querySelector<HTMLElement>('.profile-menu');

    if (alvo && menuPerfil?.contains(alvo)) return;

    this.fecharMenuPerfil();
  }

  fecharMenuPerfil() {
    const menuPerfil = this.elementRef.nativeElement.querySelector<HTMLDetailsElement>('.profile-menu');

    if (menuPerfil) {
      menuPerfil.open = false;
    }
  }

  manterSubmenuAberto(grupoAtual: string) {
    this.elementRef.nativeElement
      .querySelectorAll<HTMLDetailsElement>('.nav-group[data-menu-group]')
      .forEach(grupo => {
        grupo.open = grupo.dataset['menuGroup'] === grupoAtual;
      });
  }

  sair() {
    this.fecharMenuPerfil();
    this.authService.logout();
  }
}
