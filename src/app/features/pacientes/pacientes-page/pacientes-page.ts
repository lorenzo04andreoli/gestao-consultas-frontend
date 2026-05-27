import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-pacientes-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './pacientes-page.html',
  styleUrl: './pacientes-page.scss'
})
export class PacientesPage implements OnInit {
  pacientes = signal<PacienteModel[]>([]);

  erro = signal('');
  sucesso = signal('');

  modalAberto = signal(false);
  modoModal: 'cadastro' | 'edicao' = 'cadastro';
  termoBusca = '';

  pacienteForm: PacienteModel = {
    nome: '',
    email: '',
    cpf: '',
    telefone: ''
  };

  pacienteSelecionadoId: number | null = null;

  constructor(
    private pacienteService: PacienteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarPacientes();
  }

  carregarPacientes() {
    this.erro.set('');

    this.pacienteService.listar().subscribe({
      next: (dados) => {
        this.pacientes.set(dados);
        this.abrirPacienteDaRota(dados);
      },
      error: () => {
        this.erro.set('Erro ao carregar pacientes.');
      }
    });
  }

  abrirModalCadastro() {
    this.modoModal = 'cadastro';
    this.pacienteSelecionadoId = null;
    this.limparFormulario();
    this.modalAberto.set(true);
  }

  abrirModalEdicao(paciente: PacienteModel) {
    this.modoModal = 'edicao';
    this.pacienteSelecionadoId = paciente.id ?? null;

    this.pacienteForm = {
      nome: paciente.nome,
      email: paciente.email,
      cpf: this.formatarCpf(paciente.cpf),
      telefone: this.formatarTelefone(paciente.telefone)
    };

    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.limparFormulario();
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.formularioValido()) return;

    const payload: PacienteModel = {
      ...this.pacienteForm,
      nome: this.pacienteForm.nome.trim(),
      email: this.pacienteForm.email.trim(),
      cpf: this.apenasNumeros(this.pacienteForm.cpf),
      telefone: this.apenasNumeros(this.pacienteForm.telefone)
    };

    if (this.modoModal === 'edicao' && this.pacienteSelecionadoId) {
      this.pacienteService.atualizar(this.pacienteSelecionadoId, payload).subscribe({
        next: () => {
          this.sucesso.set('Paciente atualizado com sucesso.');
          this.fecharModal();
          this.carregarPacientes();
        },
        error: (err) => {
          this.erro.set(this.extrairMensagemErro(err, 'Erro ao atualizar paciente.'));
        }
      });

      return;
    }

    this.pacienteService.criar(payload).subscribe({
      next: () => {
        this.sucesso.set('Paciente cadastrado com sucesso.');
        this.fecharModal();
        this.carregarPacientes();
      },
      error: (err) => {
        this.erro.set(this.extrairMensagemErro(err, 'Erro ao cadastrar paciente.'));
      }
    });
  }

  deletarPaciente() {
    if (!this.pacienteSelecionadoId) return;

    const confirmar = confirm('Deseja realmente excluir este paciente?');

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.pacienteService.deletar(this.pacienteSelecionadoId).subscribe({
      next: () => {
        this.sucesso.set('Paciente excluído com sucesso.');
        this.fecharModal();
        this.carregarPacientes();
      },
      error: () => {
        this.erro.set('Erro ao excluir paciente.');
      }
    });
  }

  excluirPaciente(paciente: PacienteModel) {
    if (!paciente.id) return;

    const confirmar = confirm(`Deseja realmente excluir ${paciente.nome}?`);

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.pacienteService.deletar(paciente.id).subscribe({
      next: () => {
        this.sucesso.set('Paciente excluído com sucesso.');
        this.carregarPacientes();
      },
      error: () => {
        this.erro.set('Erro ao excluir paciente.');
      }
    });
  }

  atualizarCpf(valor: string) {
    this.pacienteForm.cpf = this.formatarCpf(valor);
  }

  atualizarTelefone(valor: string) {
    this.pacienteForm.telefone = this.formatarTelefone(valor);
  }

  limparFormulario() {
    this.pacienteForm = {
      nome: '',
      email: '',
      cpf: '',
      telefone: ''
    };
  }

  pacientesFiltrados() {
    const termo = this.normalizarTexto(this.termoBusca);

    if (!termo) return this.pacientes();

    return this.pacientes().filter(paciente => this.pacienteContemTermo(paciente, termo));
  }

  totalPacientesFiltrados() {
    return this.pacientesFiltrados().length;
  }

  inicialPaciente(paciente: PacienteModel) {
    return paciente.nome.trim().charAt(0).toUpperCase() || 'P';
  }

  limparBusca() {
    this.termoBusca = '';
  }

  private abrirPacienteDaRota(pacientes: PacienteModel[]) {
    const id = Number(this.route.snapshot.queryParamMap.get('editar'));
    if (!id) return;

    const paciente = pacientes.find(item => item.id === id);
    if (!paciente) return;

    this.abrirModalEdicao(paciente);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  private pacienteContemTermo(paciente: PacienteModel, termo: string) {
    return [paciente.nome, paciente.email, paciente.cpf, paciente.telefone]
      .filter(Boolean)
      .some(valor => this.normalizarTexto(valor).includes(termo));
  }

  private normalizarTexto(valor: string) {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private formularioValido() {
    const nome = this.pacienteForm.nome.trim();
    const email = this.pacienteForm.email.trim();
    const cpf = this.apenasNumeros(this.pacienteForm.cpf);

    if (!nome || !email || !cpf) {
      this.erro.set('Preencha nome, e-mail e CPF.');
      return false;
    }

    if (!email.includes('@')) {
      this.erro.set('Informe um e-mail válido.');
      return false;
    }

    if (cpf.length !== 11) {
      this.erro.set('Informe um CPF com 11 dígitos.');
      return false;
    }

    return true;
  }

  private formatarCpf(valor: string) {
    const numeros = this.apenasNumeros(valor).slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  private formatarTelefone(valor: string) {
    const numeros = this.apenasNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  private apenasNumeros(valor: string) {
    return (valor || '').replace(/\D/g, '');
  }

  private extrairMensagemErro(err: unknown, mensagemPadrao: string) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'error' in err &&
      typeof err.error === 'object' &&
      err.error !== null &&
      'message' in err.error &&
      typeof err.error.message === 'string'
    ) {
      return err.error.message;
    }

    return mensagemPadrao;
  }
}
