import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { UsuarioService } from '../../usuarios/usuario';
import { UsuarioResponseModel } from '../../usuarios/usuario.model';
import { DentistaService } from '../dentista';
import { DentistaRequestModel, DentistaResponseModel } from '../dentista.model';

@Component({
  selector: 'app-dentistas-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dentistas-page.html',
  styleUrl: './dentistas-page.scss'
})
export class DentistasPage implements OnInit {
  dentistas = signal<DentistaResponseModel[]>([]);
  especialidades = signal<EspecialidadeModel[]>([]);
  usuariosDentistas = signal<UsuarioResponseModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  modalAberto = signal(false);
  modoModal: 'cadastro' | 'edicao' = 'cadastro';
  dentistaSelecionadoId: number | null = null;

  dentistaForm = {
    nome: '',
    cpf: '',
    email: '',
    cro: '',
    ativo: true,
    usuarioId: null as number | null,
    especialidadeIds: [] as number[]
  };

  constructor(
    public authService: AuthService,
    private dentistaService: DentistaService,
    private especialidadeService: EspecialidadeService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.carregarDentistas();
    this.carregarEspecialidades();

    if (this.authService.isAdmin()) {
      this.carregarUsuariosDentistas();
    }
  }

  carregarDentistas() {
    this.erro.set('');

    this.dentistaService.listar().subscribe({
      next: (dados) => {
        this.dentistas.set(dados);
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar dentistas.'));
      }
    });
  }

  carregarEspecialidades() {
    this.especialidadeService.listar().subscribe({
      next: (dados) => {
        this.especialidades.set(dados);
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar especialidades.'));
      }
    });
  }

  carregarUsuariosDentistas() {
    this.usuarioService.listar().subscribe({
      next: (dados) => {
        this.usuariosDentistas.set(dados.filter(usuario => usuario.perfil === 'DENTISTA'));
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao carregar usuários dentistas.'));
      }
    });
  }

  abrirModalCadastro() {
    this.modoModal = 'cadastro';
    this.dentistaSelecionadoId = null;
    this.carregarEspecialidades();
    this.carregarUsuariosDentistas();
    this.limparFormulario();
    this.modalAberto.set(true);
  }

  abrirModalEdicao(dentista: DentistaResponseModel) {
    this.modoModal = 'edicao';
    this.dentistaSelecionadoId = dentista.id;
    this.carregarEspecialidades();
    this.carregarUsuariosDentistas();

    this.dentistaForm = {
      nome: dentista.nome,
      cpf: dentista.cpf ?? '',
      email: dentista.email,
      cro: dentista.cro,
      ativo: dentista.ativo,
      usuarioId: dentista.usuarioId ?? null,
      especialidadeIds: this.obterEspecialidadeIdsPorNome(dentista.especialidades)
    };

    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.dentistaSelecionadoId = null;
    this.limparFormulario();
  }

  alternarEspecialidade(especialidadeId: number, marcado: boolean) {
    const atuais = this.dentistaForm.especialidadeIds;

    this.dentistaForm.especialidadeIds = marcado
      ? [...atuais, especialidadeId]
      : atuais.filter(id => id !== especialidadeId);
  }

  especialidadeSelecionada(especialidadeId: number) {
    return this.dentistaForm.especialidadeIds.includes(especialidadeId);
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.dentistaForm.nome.trim() || !this.dentistaForm.cpf.trim() || !this.dentistaForm.email.trim() || !this.dentistaForm.cro.trim()) {
      this.erro.set('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!this.dentistaForm.usuarioId) {
      this.erro.set('Selecione o usuário vinculado ao dentista.');
      return;
    }

    if (this.dentistaForm.especialidadeIds.length === 0) {
      this.erro.set('Selecione pelo menos uma especialidade.');
      return;
    }

    const payload = this.montarPayload(this.dentistaForm.ativo);
    const request$ = this.modoModal === 'edicao' && this.dentistaSelecionadoId
      ? this.dentistaService.atualizar(this.dentistaSelecionadoId, payload)
      : this.dentistaService.criar(payload);

    request$.subscribe({
      next: () => {
        this.sucesso.set(
          this.modoModal === 'edicao'
            ? 'Dentista atualizado com sucesso.'
            : 'Dentista cadastrado com sucesso.'
        );
        this.fecharModal();
        this.carregarDentistas();
      },
      error: (err) => {
        this.erro.set(
          this.extrairMensagemErro(
            err,
            this.modoModal === 'edicao'
              ? 'Erro ao atualizar dentista.'
              : 'Erro ao cadastrar dentista.'
          )
        );
      }
    });
  }

  desativarDentista(dentista: DentistaResponseModel) {
    if (!dentista.ativo) return;

    const confirmar = confirm(`Deseja desativar ${dentista.nome}?`);

    if (!confirmar) return;

    if (!dentista.usuarioId) {
      this.erro.set('Dentista sem usuário vinculado.');
      return;
    }

    const payload: DentistaRequestModel = {
      nome: dentista.nome,
      cpf: dentista.cpf ?? '',
      email: dentista.email,
      cro: dentista.cro,
      ativo: false,
      usuario: {
        id: dentista.usuarioId
      },
      especialidades: this.obterEspecialidadeIdsPorNome(dentista.especialidades).map(id => ({ id }))
    };

    this.erro.set('');
    this.sucesso.set('');

    this.dentistaService.atualizar(dentista.id, payload).subscribe({
      next: () => {
        this.sucesso.set('Dentista desativado com sucesso.');
        this.carregarDentistas();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao desativar dentista.'));
      }
    });
  }

  usuarioVinculadoLabel(usuarioId?: number) {
    if (!usuarioId) return '-';

    const usuario = this.usuariosDentistas().find(item => item.id === usuarioId);
    return usuario ? `${usuario.nome} - ${usuario.email}` : `ID ${usuarioId}`;
  }

  limparFormulario() {
    this.dentistaForm = {
      nome: '',
      cpf: '',
      email: '',
      cro: '',
      ativo: true,
      usuarioId: null,
      especialidadeIds: []
    };
  }

  private montarPayload(ativo: boolean): DentistaRequestModel {
    return {
      nome: this.dentistaForm.nome.trim(),
      cpf: this.dentistaForm.cpf.trim(),
      email: this.dentistaForm.email.trim(),
      cro: this.dentistaForm.cro.trim(),
      ativo,
      usuario: {
        id: this.dentistaForm.usuarioId as number
      },
      especialidades: this.dentistaForm.especialidadeIds.map(id => ({ id }))
    };
  }

  private obterEspecialidadeIdsPorNome(nomes: string[]) {
    return this.especialidades()
      .filter(especialidade => especialidade.id && nomes.includes(especialidade.nome))
      .map(especialidade => especialidade.id as number);
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.erro ?? mensagemPadrao;
    }

    return mensagemPadrao;
  }
}
