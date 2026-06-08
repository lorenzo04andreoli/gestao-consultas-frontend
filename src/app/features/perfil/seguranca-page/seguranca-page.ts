import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { TwoFactorService, TwoFactorSetup } from '../../../core/profile/two-factor';
import { UsuarioResponseModel } from '../../usuarios/usuario.model';
import { UsuarioService } from '../../usuarios/usuario';

@Component({
  selector: 'app-seguranca-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './seguranca-page.html',
  styleUrl: './seguranca-page.scss'
})
export class SegurancaPage implements OnInit {
  usuario = signal<UsuarioResponseModel | null>(null);
  setup = signal<TwoFactorSetup | null>(null);
  carregando = signal(false);
  erro = signal('');
  feedback = signal('');
  codigo = '';

  constructor(
    private usuarioService: UsuarioService,
    private twoFactorService: TwoFactorService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.carregarStatus();
  }

  twoFactorAtivo() {
    return Boolean(this.usuario()?.twoFactorAtivo);
  }

  carregarStatus() {
    this.carregando.set(true);
    this.erro.set('');

    this.usuarioService.perfilAutenticado().subscribe({
      next: usuario => {
        this.usuario.set(usuario);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar opções de segurança.');
        this.carregando.set(false);
      }
    });
  }

  iniciarTwoFactor() {
    this.carregando.set(true);
    this.erro.set('');
    this.feedback.set('');

    this.twoFactorService.iniciar().subscribe({
      next: setup => {
        this.setup.set(setup);
        this.codigo = '';
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao iniciar autenticação em duas etapas.');
        this.carregando.set(false);
      }
    });
  }

  confirmarTwoFactor() {
    const codigo = this.codigo.trim();

    if (!/^\d{6}$/.test(codigo)) {
      this.erro.set('Informe o código de 6 dígitos.');
      return;
    }

    this.carregando.set(true);
    this.erro.set('');

    this.twoFactorService.confirmar(codigo).subscribe({
      next: usuario => {
        this.usuario.set(usuario);
        this.setup.set(null);
        this.codigo = '';
        this.feedback.set('Autenticação em duas etapas ativada.');
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Código inválido. Confira o aplicativo autenticador.');
        this.carregando.set(false);
      }
    });
  }

  cancelarConfiguracao() {
    this.setup.set(null);
    this.codigo = '';
    this.erro.set('');
  }

  async desativarTwoFactor() {
    const confirmar = await this.confirmation.confirmar({
      title: 'Desativar 2FA',
      message: 'Sua conta deixará de exigir o código do aplicativo autenticador no login.',
      confirmLabel: 'Desativar',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.carregando.set(true);
    this.erro.set('');
    this.feedback.set('');

    this.twoFactorService.desativar().subscribe({
      next: usuario => {
        this.usuario.set(usuario);
        this.feedback.set('Autenticação em duas etapas desativada.');
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao desativar autenticação em duas etapas.');
        this.carregando.set(false);
      }
    });
  }
}
