import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { ProfilePhotoService } from '../../../core/profile/profile-photo';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { DentistaResponseModel } from '../../dentistas/dentista.model';
import { DentistaService } from '../../dentistas/dentista';
import { SolicitacaoAlteracaoResponseModel } from '../../solicitacoes-alteracao/solicitacao-alteracao.model';
import { SolicitacaoAlteracaoService } from '../../solicitacoes-alteracao/solicitacao-alteracao';
import { UsuarioAtualizacaoModel, UsuarioResponseModel } from '../../usuarios/usuario.model';
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
  enviandoSolicitacao = signal(false);
  erro = signal('');
  solicitacoes = signal<SolicitacaoAlteracaoResponseModel[]>([]);
  solicitacaoAberta = signal(false);
  modalFotoAberto = signal(false);
  modalDadosAdminAberto = signal(false);
  salvandoDadosAdmin = signal(false);
  fotoPendente = signal('');
  solicitacaoAssunto = '';
  solicitacaoDados = '';
  feedback = signal('');
  adminForm: UsuarioAtualizacaoModel = this.criarAdminFormVazio();

  constructor(
    public authService: AuthService,
    private profilePhotoService: ProfilePhotoService,
    private confirmation: ConfirmationService,
    private usuarioService: UsuarioService,
    private dentistaService: DentistaService,
    private solicitacaoService: SolicitacaoAlteracaoService
  ) {}

  ngOnInit() {
    this.profilePhotoService.carregar();
    this.carregarPerfil();
    this.carregarSolicitacoes();
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

  abrirModalDadosAdmin() {
    const usuario = this.usuario();

    if (!usuario) {
      this.feedback.set('Dados do usuário ainda não foram carregados.');
      return;
    }

    this.adminForm = {
      nome: usuario.nome,
      cpf: usuario.cpf,
      email: usuario.email,
      perfil: 'ADMIN',
      ativo: usuario.ativo
    };
    this.feedback.set('');
    this.modalDadosAdminAberto.set(true);
  }

  fecharModalDadosAdmin() {
    this.modalDadosAdminAberto.set(false);
    this.adminForm = this.criarAdminFormVazio();
  }

  salvarDadosAdmin() {
    const usuario = this.usuario();

    if (!usuario) return;

    const payload: UsuarioAtualizacaoModel = {
      nome: this.adminForm.nome.trim(),
      cpf: this.adminForm.cpf.trim(),
      email: this.adminForm.email.trim(),
      perfil: 'ADMIN',
      ativo: this.adminForm.ativo
    };

    if (!payload.nome || !payload.cpf || !payload.email) {
      this.feedback.set('Preencha nome, CPF e e-mail.');
      return;
    }

    this.salvandoDadosAdmin.set(true);
    this.feedback.set('');

    this.usuarioService.atualizar(usuario.id, payload).subscribe({
      next: usuarioAtualizado => {
        this.usuario.set(usuarioAtualizado);
        this.fecharModalDadosAdmin();
        this.feedback.set('Dados do perfil atualizados.');
        this.salvandoDadosAdmin.set(false);
      },
      error: err => {
        this.feedback.set(this.extrairMensagemErro(err, 'Erro ao atualizar dados do perfil.'));
        this.salvandoDadosAdmin.set(false);
      }
    });
  }

  fotoModal() {
    return this.fotoPendente() || this.fotoPerfil();
  }

  alterarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.feedback.set('Selecione um arquivo de imagem.');
      input.value = '';
      return;
    }

    if (arquivo.size > 2_000_000) {
      this.feedback.set('A foto deve ter no maximo 2 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const foto = String(reader.result || '');
      this.fotoPendente.set(foto);
      this.feedback.set('');
    };

    reader.readAsDataURL(arquivo);
    input.value = '';
  }

  salvarFoto() {
    const foto = this.fotoPendente();

    if (!foto) return;

    this.profilePhotoService.definir(foto).subscribe({
      next: () => {
        this.fecharModalFoto();
        this.feedback.set('Foto de perfil atualizada.');
      },
      error: err => {
        this.feedback.set(this.extrairMensagemErro(err, 'Erro ao atualizar foto de perfil.'));
      }
    });
  }

  async confirmarRemocaoFoto() {
    const confirmar = await this.confirmation.confirmar({
      title: 'Remover foto',
      message: 'A foto atual sera removida do seu perfil.',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.profilePhotoService.remover().subscribe({
      next: () => {
        this.fecharModalFoto();
        this.feedback.set('Foto de perfil removida.');
      },
      error: err => {
        this.feedback.set(this.extrairMensagemErro(err, 'Erro ao remover foto de perfil.'));
      }
    });
  }

  alternarSolicitacao() {
    this.solicitacaoAberta.update(aberta => !aberta);
    this.feedback.set('');
  }

  enviarSolicitacao() {
    const assunto = this.solicitacaoAssunto.trim();
    const texto = this.solicitacaoDados.trim();

    if (!assunto) {
      this.feedback.set('Informe o assunto da solicitacao.');
      return;
    }

    if (!texto) {
      this.feedback.set('Descreva quais dados precisam ser alterados.');
      return;
    }

    this.enviandoSolicitacao.set(true);
    this.feedback.set('');

    this.solicitacaoService.criar({ assunto, descricao: texto }).subscribe({
      next: solicitacao => {
        this.solicitacoes.update(solicitacoes => [solicitacao, ...solicitacoes]);
        this.solicitacaoAssunto = '';
        this.solicitacaoDados = '';
        this.solicitacaoAberta.set(false);
        this.feedback.set('Solicitação enviada ao administrador.');
        this.enviandoSolicitacao.set(false);
      },
      error: err => {
        this.feedback.set(this.extrairMensagemErro(err, 'Erro ao enviar solicitação.'));
        this.enviandoSolicitacao.set(false);
      }
    });
  }

  statusSolicitacaoLabel(status: string) {
    return status === 'PENDENTE' ? 'Pendente' : 'Respondida';
  }

  dataFormatada(data?: string | null) {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
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

  private carregarSolicitacoes() {
    if (this.authService.isAdmin()) return;

    this.solicitacaoService.listarMinhas().subscribe({
      next: solicitacoes => {
        this.solicitacoes.set(solicitacoes);
      },
      error: err => {
        this.feedback.set(this.extrairMensagemErro(err, 'Erro ao carregar solicitações.'));
      }
    });
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }

  private criarAdminFormVazio(): UsuarioAtualizacaoModel {
    return {
      nome: '',
      cpf: '',
      email: '',
      perfil: 'ADMIN',
      ativo: true
    };
  }

}
