import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../../core/auth/auth';
import { ThemeService } from '../../../core/theme/theme';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage implements OnInit, OnDestroy {
  @ViewChildren('codigo2faCampo') codigo2faCampos?: QueryList<ElementRef<HTMLInputElement>>;

  email = '';
  senha = '';
  codigo2fa = '';
  codigo2faDigits = ['', '', '', '', '', ''];
  codigo2faIndexes = [0, 1, 2, 3, 4, 5];
  erro = '';
  carregando = false;
  mostrarSenha = false;
  aguardando2fa = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.themeService.suspenderTema();
  }

  ngOnDestroy() {
    this.themeService.aplicarTemaAtual();
  }

  entrar() {
    this.erro = '';
    this.carregando = true;

    this.authService.login(this.email, this.senha, this.codigo2fa.trim())
      .pipe(
        timeout(10000),
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          if (this.requerCodigo2fa(response)) {
            this.aguardando2fa = true;
            this.limparCodigo2fa();
            this.cdr.detectChanges();
            window.setTimeout(() => this.focarCampoCodigo(0));
            return;
          }

          if (!response.token) {
            this.erro = 'Não foi possível iniciar a sessão.';
            this.cdr.detectChanges();
            return;
          }

          this.authService.salvarToken(response.token);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.erro = this.aguardando2fa
            ? 'Código de autenticação inválido.'
            : 'E-mail ou senha inválidos.';
          this.cdr.detectChanges();
        }
      });
  }

  alternarVisibilidadeSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  trocarCredenciais() {
    this.aguardando2fa = false;
    this.limparCodigo2fa();
    this.erro = '';
  }

  atualizarDigito(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const digito = input.value.replace(/\D/g, '').slice(-1);

    this.codigo2faDigits[index] = digito;
    input.value = digito;
    this.atualizarCodigo2fa();

    if (digito && index < this.codigo2faDigits.length - 1) {
      this.focarCampoCodigo(index + 1);
    }
  }

  voltarDigito(event: KeyboardEvent, index: number) {
    if (event.key !== 'Backspace' || this.codigo2faDigits[index] || index === 0) return;

    this.focarCampoCodigo(index - 1);
  }

  colarCodigo(event: ClipboardEvent) {
    const codigo = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';

    if (!codigo) return;

    event.preventDefault();

    this.codigo2faDigits = this.codigo2faDigits.map((_, index) => codigo[index] ?? '');
    this.atualizarCodigo2fa();
    this.cdr.detectChanges();
    this.focarCampoCodigo(Math.min(codigo.length, 5));
  }

  private requerCodigo2fa(response: { requer2fa?: boolean; requer2FA?: boolean; requires2fa?: boolean }) {
    return response.requer2fa === true
      || response.requer2FA === true
      || response.requires2fa === true;
  }

  private limparCodigo2fa() {
    this.codigo2fa = '';
    this.codigo2faDigits = ['', '', '', '', '', ''];
  }

  private atualizarCodigo2fa() {
    this.codigo2fa = this.codigo2faDigits.join('');
  }

  private focarCampoCodigo(index: number) {
    this.codigo2faCampos?.get(index)?.nativeElement.focus();
  }
}
