import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';
import { EspecialidadeService } from '../../especialidades/especialidade';
import { EspecialidadeModel } from '../../especialidades/especialidade.model';
import { DentistaService } from '../dentista';
import {
  DentistaAtualizacaoRequestModel,
  DentistaRequestModel,
  DentistaResponseModel
} from '../dentista.model';

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

  erro = signal('');
  sucesso = signal('');
  modalAberto = signal(false);
  modoModal: 'cadastro' | 'edicao' = 'cadastro';
  dentistaSelecionadoId: number | null = null;

  dentistaForm = {
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    cro: '',
    ativo: true,
    especialidadeIds: [] as number[]
  };

  constructor(
    public authService: AuthService,
    private dentistaService: DentistaService,
    private especialidadeService: EspecialidadeService
  ) {}

  ngOnInit() {
    this.carregarDentistas();
    this.carregarEspecialidades();
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

  abrirModalCadastro() {
    this.modoModal = 'cadastro';
    this.dentistaSelecionadoId = null;
    this.carregarEspecialidades();
    this.limparFormulario();
    this.modalAberto.set(true);
  }

  abrirModalEdicao(dentista: DentistaResponseModel) {
    this.modoModal = 'edicao';
    this.dentistaSelecionadoId = dentista.id;
    this.carregarEspecialidades();

    this.dentistaForm = {
      nome: dentista.nome,
      cpf: dentista.cpf ?? '',
      email: dentista.email,
      senha: '',
      cro: dentista.cro,
      ativo: dentista.ativo,
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

    if (this.modoModal === 'cadastro' && !this.dentistaForm.senha.trim()) {
      this.erro.set('Informe a senha inicial do dentista.');
      return;
    }

    if (this.dentistaForm.especialidadeIds.length === 0) {
      this.erro.set('Selecione pelo menos uma especialidade.');
      return;
    }

    const request$ = this.modoModal === 'edicao' && this.dentistaSelecionadoId
      ? this.dentistaService.atualizar(this.dentistaSelecionadoId, this.montarPayloadAtualizacao(this.dentistaForm.ativo))
      : this.dentistaService.criar(this.montarPayloadCadastro(this.dentistaForm.ativo));

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

    const payload: DentistaAtualizacaoRequestModel = {
      nome: dentista.nome,
      cpf: dentista.cpf ?? '',
      email: dentista.email,
      cro: dentista.cro,
      ativo: false,
      especialidadeIds: this.obterEspecialidadeIdsPorNome(dentista.especialidades)
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

  limparFormulario() {
    this.dentistaForm = {
      nome: '',
      cpf: '',
      email: '',
      senha: '',
      cro: '',
      ativo: true,
      especialidadeIds: []
    };
  }

  private montarPayloadCadastro(ativo: boolean): DentistaRequestModel {
    return {
      nome: this.dentistaForm.nome.trim(),
      cpf: this.dentistaForm.cpf.trim(),
      email: this.dentistaForm.email.trim(),
      senha: this.dentistaForm.senha.trim(),
      cro: this.dentistaForm.cro.trim(),
      ativo,
      especialidadeIds: this.dentistaForm.especialidadeIds
    };
  }

  private montarPayloadAtualizacao(ativo: boolean): DentistaAtualizacaoRequestModel {
    return {
      nome: this.dentistaForm.nome.trim(),
      cpf: this.dentistaForm.cpf.trim(),
      email: this.dentistaForm.email.trim(),
      cro: this.dentistaForm.cro.trim(),
      ativo,
      especialidadeIds: this.dentistaForm.especialidadeIds
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
