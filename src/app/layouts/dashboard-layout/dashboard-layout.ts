import { Component, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth';
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
    private elementRef: ElementRef<HTMLElement>
  ) {}

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
