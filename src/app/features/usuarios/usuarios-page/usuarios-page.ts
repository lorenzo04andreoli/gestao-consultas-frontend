import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PerfilUsuario, UsuarioModel, UsuarioResponseModel } from '../usuario.model';
import { UsuarioService } from '../usuario';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './usuarios-page.html',
  styleUrl: './usuarios-page.scss'
})
export class UsuariosPage implements OnInit {
  usuarios = signal<UsuarioResponseModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  modalAberto = signal(false);

  usuarioForm: UsuarioModel = {
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    perfil: 'DENTISTA'
  };

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.erro.set('');

    this.usuarioService.listar().subscribe({
      next: (dados) => {
        this.usuarios.set(dados);
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar usuários.'));
      }
    });
  }

  abrirModalCadastro() {
    this.limparFormulario();
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.limparFormulario();
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    const payload: UsuarioModel = {
      nome: this.usuarioForm.nome.trim(),
      cpf: this.usuarioForm.cpf?.trim(),
      email: this.usuarioForm.email.trim(),
      senha: this.usuarioForm.senha?.trim(),
      perfil: this.usuarioForm.perfil
    };

    if (!payload.nome || !payload.cpf || !payload.email || !payload.senha || !payload.perfil) {
      this.erro.set('Preencha todos os campos obrigatórios.');
      return;
    }

    this.usuarioService.criar(payload).subscribe({
      next: () => {
        this.sucesso.set('Usuário cadastrado com sucesso.');
        this.fecharModal();
        this.carregarUsuarios();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao cadastrar usuário.'));
      }
    });
  }

  perfilLabel(perfil: PerfilUsuario) {
    return perfil === 'ADMIN' ? 'Administrador' : 'Dentista';
  }

  limparFormulario() {
    this.usuarioForm = {
      nome: '',
      cpf: '',
      email: '',
      senha: '',
      perfil: 'DENTISTA'
    };
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
