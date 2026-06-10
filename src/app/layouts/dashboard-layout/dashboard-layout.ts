import { Component, ElementRef, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth';
import { NotificacaoResponseModel } from '../../core/notifications/notification.model';
import { NotificationService } from '../../core/notifications/notification';
import { ProfilePhotoService } from '../../core/profile/profile-photo';
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
    private profilePhotoService: ProfilePhotoService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private elementRef: ElementRef<HTMLElement>,
    private router: Router
  ) {
    this.profilePhotoService.carregar();
    this.notificationService.carregar();
  }

  inicialPerfil() {
    return this.authService.email()?.charAt(0).toUpperCase() ?? 'U';
  }

  fotoPerfil() {
    return this.profilePhotoService.foto();
  }

  notificacoes() {
    return this.notificationService.notificacoes().slice(0, 6);
  }

  totalNaoLidas() {
    return this.notificationService.totalNaoLidas();
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
  fecharMenusAoClicarFora(event: MouseEvent) {
    const alvo = event.target as Node | null;
    const menuPerfil = this.elementRef.nativeElement.querySelector<HTMLElement>('.profile-menu');
    const menuNotificacoes = this.elementRef.nativeElement.querySelector<HTMLElement>('.notification-menu');

    if (alvo && menuPerfil?.contains(alvo)) {
      this.fecharMenuNotificacoes();
      return;
    }

    if (alvo && menuNotificacoes?.contains(alvo)) {
      this.fecharMenuPerfil();
      return;
    }

    this.fecharMenuPerfil();
    this.fecharMenuNotificacoes();
  }

  fecharMenuPerfil() {
    const menuPerfil = this.elementRef.nativeElement.querySelector<HTMLDetailsElement>('.profile-menu');

    if (menuPerfil) {
      menuPerfil.open = false;
    }
  }

  fecharMenuNotificacoes() {
    const menuNotificacoes = this.elementRef.nativeElement.querySelector<HTMLDetailsElement>('.notification-menu');

    if (menuNotificacoes) {
      menuNotificacoes.open = false;
    }
  }

  abrirMenuNotificacoes() {
    this.notificationService.carregar();
  }

  abrirNotificacao(notificacao: NotificacaoResponseModel) {
    const navegar = () => {
      this.fecharMenuNotificacoes();

      if (notificacao.link) {
        this.router.navigateByUrl(notificacao.link);
      }
    };

    if (notificacao.lida) {
      navegar();
      return;
    }

    this.notificationService.marcarComoLida(notificacao.id).subscribe({
      next: atualizada => {
        this.notificationService.notificacoes.update(notificacoes =>
          notificacoes.map(item => item.id === atualizada.id ? atualizada : item)
        );
        this.notificationService.totalNaoLidas.update(total => Math.max(total - 1, 0));
        navegar();
      },
      error: navegar
    });
  }

  marcarTodasNotificacoesComoLidas() {
    this.notificationService.marcarTodasComoLidas().subscribe({
      next: notificacoes => {
        this.notificationService.notificacoes.set(notificacoes);
        this.notificationService.totalNaoLidas.set(0);
      }
    });
  }

  dataNotificacao(data?: string | null) {
    if (!data) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
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
    this.fecharMenuNotificacoes();
    this.authService.logout();
  }
}
