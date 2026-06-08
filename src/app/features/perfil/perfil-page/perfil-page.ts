import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { ProfilePhotoService } from '../../../core/profile/profile-photo';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { DentistaService } from '../../dentistas/dentista';
import { UsuarioResponseModel } from '../../usuarios/usuario.model';
import { UsuarioService } from '../../usuarios/usuario';

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './perfil-page.html',
  styleUrl: './perfil-page.scss'
})
export class PerfilPage implements OnInit {
  usuario = signal<UsuarioResponseModel | null>(null);
  dentista = signal<DentistaResponseModel | null>(null);
  carregando = signal(true);
  erro = signal('');
  solicitacaoAberta = signal(false);
  modalFotoAberto = signal(false);
  fotoPendente = signal('');
  solicitacaoDados = '';
  feedback = signal('');

  constructor(
    public authService: AuthService,
    private profilePhotoService: ProfilePhotoService,
    private confirmation: ConfirmationService,
    private usuarioService: UsuarioService,
    private dentistaService: DentistaService
  ) {}

  ngOnInit() {
    this.profilePhotoService.carregar(this.authService.email());
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

  fotoPerfil() {
    return this.profilePhotoService.foto();
  }

  abrirModalFoto() {
    this.fotoPendente.set('');
    this.modalFotoAberto.set(true);
  }

  fecharModalFoto() {
    this.fotoPendente.set('');
    this.modalFotoAberto.set(false);
  }

  fotoModal() {
    return this.fotoPendente() || this.fotoPerfil();
  }

  alterarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo) return;

    const reader = new FileReader();

    reader.onload = () => {
      const foto = String(reader.result || '');
      this.fotoPendente.set(foto);
    };

    reader.readAsDataURL(arquivo);
    input.value = '';
  }

  salvarFoto() {
    const foto = this.fotoPendente();

    if (!foto) return;

    this.profilePhotoService.definir(this.authService.email(), foto);
    this.fecharModalFoto();
    this.feedback.set('Foto de perfil atualizada.');
  }

  async confirmarRemocaoFoto() {
    const confirmar = await this.confirmation.confirmar({
      title: 'Remover foto',
      message: 'A foto atual sera removida do seu perfil neste navegador.',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.profilePhotoService.remover(this.authService.email());
    this.fecharModalFoto();
    this.feedback.set('Foto de perfil removida.');
  }

  alternarSolicitacao() {
    this.solicitacaoAberta.update(aberta => !aberta);
    this.feedback.set('');
  }

  enviarSolicitacao() {
    const texto = this.solicitacaoDados.trim();

    if (!texto) {
      this.feedback.set('Descreva quais dados precisam ser alterados.');
      return;
    }

    this.solicitacaoDados = '';
    this.solicitacaoAberta.set(false);
    this.feedback.set('Solicitacao de alteracao registrada.');
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
