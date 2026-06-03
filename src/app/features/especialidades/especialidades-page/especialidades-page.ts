import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { EspecialidadeService } from '../especialidade';
import { EspecialidadeModel } from '../especialidade.model';

@Component({
  selector: 'app-especialidades-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './especialidades-page.html',
  styleUrl: './especialidades-page.scss'
})
export class EspecialidadesPage implements OnInit {
  especialidades = signal<EspecialidadeModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  modalAberto = signal(false);
  modoModal = signal<'criar' | 'editar'>('criar');
  especialidadeEditandoId = signal<number | null>(null);

  especialidadeForm: EspecialidadeModel = {
    nome: ''
  };

  constructor(
    public authService: AuthService,
    private especialidadeService: EspecialidadeService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.carregarEspecialidades();
  }

  carregarEspecialidades() {
    this.erro.set('');

    this.especialidadeService.listar().subscribe({
      next: (dados) => {
        this.especialidades.set(
          [...dados].sort((a, b) => a.nome.localeCompare(b.nome))
        );
      },
      error: () => {
        this.erro.set('Erro ao carregar especialidades.');
      }
    });
  }

  abrirModalCadastro() {
    this.limparFormulario();
    this.modoModal.set('criar');
    this.especialidadeEditandoId.set(null);
    this.modalAberto.set(true);
  }

  abrirModalEdicao(especialidade: EspecialidadeModel) {
    if (!especialidade.id) return;

    this.especialidadeForm = { ...especialidade };
    this.modoModal.set('editar');
    this.especialidadeEditandoId.set(especialidade.id);
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.limparFormulario();
  }

  salvar() {
    const nome = this.especialidadeForm.nome.trim();

    this.erro.set('');
    this.sucesso.set('');

    if (!nome) {
      this.erro.set('Informe o nome da especialidade.');
      return;
    }

    const id = this.especialidadeEditandoId();
    const request = this.modoModal() === 'editar' && id
      ? this.especialidadeService.atualizar(id, { nome })
      : this.especialidadeService.criar({ nome });

    request.subscribe({
      next: () => {
        this.sucesso.set(
          this.modoModal() === 'editar'
            ? 'Especialidade atualizada com sucesso.'
            : 'Especialidade cadastrada com sucesso.'
        );
        this.fecharModal();
        this.carregarEspecialidades();
      },
      error: err => {
        this.erro.set(
          this.extrairMensagemErro(
            err,
            this.modoModal() === 'editar'
              ? 'Erro ao atualizar especialidade.'
              : 'Erro ao cadastrar especialidade.'
          )
        );
      }
    });
  }

  async excluirEspecialidade(especialidade: EspecialidadeModel) {
    if (!especialidade.id) return;

    const confirmar = await this.confirmation.confirmar({
      title: 'Excluir especialidade',
      message: `${especialidade.nome} será removida se não estiver vinculada a nenhum dentista.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.especialidadeService.excluir(especialidade.id).subscribe({
      next: () => {
        this.sucesso.set('Especialidade excluída com sucesso.');
        this.especialidades.update(especialidades =>
          especialidades.filter(item => item.id !== especialidade.id)
        );
      },
      error: err => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao excluir especialidade.'));
      }
    });
  }

  limparFormulario() {
    this.especialidadeForm = {
      nome: ''
    };
    this.especialidadeEditandoId.set(null);
  }

  totalEspecialidades() {
    return this.especialidades().length;
  }

  inicialEspecialidade(especialidade: EspecialidadeModel) {
    return especialidade.nome.trim().charAt(0).toUpperCase() || 'E';
  }

  tituloModal() {
    return this.modoModal() === 'editar' ? 'Editar especialidade' : 'Cadastrar especialidade';
  }

  textoBotaoSalvar() {
    return this.modoModal() === 'editar' ? 'Salvar alterações' : 'Cadastrar';
  }

  private extrairMensagemErro(err: any, mensagemPadrao: string) {
    return err?.error?.message || mensagemPadrao;
  }
}
