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
      error: () => {
        this.erro.set('Erro ao carregar dentistas.');
      }
    });
  }

  carregarEspecialidades() {
    this.especialidadeService.listar().subscribe({
      next: (dados) => {
        this.especialidades.set(dados);
      },
      error: () => {
        this.erro.set('Erro ao carregar especialidades.');
      }
    });
  }

  carregarUsuariosDentistas() {
    this.usuarioService.listar().subscribe({
      next: (dados) => {
        this.usuariosDentistas.set(dados.filter(usuario => usuario.perfil === 'DENTISTA'));
      },
      error: () => {
        this.erro.set('Erro ao carregar usuários dentistas.');
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

    if (!this.dentistaForm.usuarioId) {
      this.erro.set('Selecione o usuário vinculado ao dentista.');
      return;
    }

    if (this.dentistaForm.especialidadeIds.length === 0) {
      this.erro.set('Selecione pelo menos uma especialidade.');
      return;
    }

    const payload: DentistaRequestModel = {
      nome: this.dentistaForm.nome.trim(),
      cpf: this.dentistaForm.cpf.trim(),
      email: this.dentistaForm.email.trim(),
      cro: this.dentistaForm.cro.trim(),
      ativo: this.dentistaForm.ativo,
      usuario: {
        id: this.dentistaForm.usuarioId
      },
      especialidades: this.dentistaForm.especialidadeIds.map(id => ({ id }))
    };

    this.dentistaService.criar(payload).subscribe({
      next: () => {
        this.sucesso.set('Dentista cadastrado com sucesso.');
        this.fecharModal();
        this.carregarDentistas();
      },
      error: () => {
        this.erro.set('Erro ao cadastrar dentista.');
      }
    });
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
}
