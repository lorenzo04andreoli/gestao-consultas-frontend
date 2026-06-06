import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { DentistaService } from '../../dentistas/dentista';
import { UsuarioResponseModel } from '../../usuarios/usuario.model';
import { UsuarioService } from '../../usuarios/usuario';

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  templateUrl: './perfil-page.html',
  styleUrl: './perfil-page.scss'
})
export class PerfilPage implements OnInit {
  usuario = signal<UsuarioResponseModel | null>(null);
  dentista = signal<DentistaResponseModel | null>(null);
  carregando = signal(true);
  erro = signal('');

  constructor(
    public authService: AuthService,
    private usuarioService: UsuarioService,
    private dentistaService: DentistaService
  ) {}

  ngOnInit() {
    this.carregarPerfil();
  }

  carregarPerfil() {
    this.carregando.set(true);
    this.erro.set('');

    if (this.authService.isAdmin()) {
      this.carregarPerfilAdmin();
      return;
    }

    this.carregarPerfilDentista();
  }

  inicialPerfil() {
    const nome = this.nomePrincipal();
    return nome.charAt(0).toUpperCase() || 'U';
  }

  nomePrincipal() {
    return this.usuario()?.nome ?? this.dentista()?.nome ?? this.authService.email() ?? 'Usuario';
  }

  emailPrincipal() {
    return this.usuario()?.email ?? this.dentista()?.email ?? this.authService.email() ?? '-';
  }

  perfilLabel() {
    return this.authService.perfil() === 'ADMIN' ? 'Administrador' : 'Dentista';
  }

  statusLabel(ativo?: boolean) {
    return ativo === false ? 'Inativo' : 'Ativo';
  }

  especialidadesFormatadas() {
    return this.dentista()?.especialidades.join(', ') || '-';
  }

  private carregarPerfilAdmin() {
    this.usuarioService.listar().subscribe({
      next: usuarios => {
        const email = this.authService.email();
        this.usuario.set(usuarios.find(usuario => usuario.email === email) ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar perfil.'));
        this.carregando.set(false);
      }
    });
  }

  private carregarPerfilDentista() {
    this.dentistaService.listar().subscribe({
      next: dentistas => {
        const email = this.authService.email();
        this.dentista.set(dentistas.find(dentista => dentista.email === email) ?? null);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar perfil.'));
        this.carregando.set(false);
      }
    });
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
