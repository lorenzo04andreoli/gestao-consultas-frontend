import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  email = '';
  senha = '';
  erro = '';
  carregando = false;
  mostrarSenha = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  entrar() {
    this.erro = '';
    this.carregando = true;

    this.authService.login(this.email, this.senha).subscribe({
      next: (response) => {
        this.authService.salvarToken(response.token);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.erro = 'E-mail ou senha inválidos.';
        this.carregando = false;
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }

  alternarVisibilidadeSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }
}
