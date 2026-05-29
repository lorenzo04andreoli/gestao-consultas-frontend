import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  criarPacienteForm,
  extrairMensagemErro,
  formatarCpf,
  formatarTelefone,
  montarPacienteForm,
  montarPacientePayload,
  validarPacienteForm
} from '../paciente-form';
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
  termoBusca = '';
  pacienteForm = criarPacienteForm();
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

  abrirModalEdicao(paciente: PacienteModel) {
    this.pacienteSelecionadoId = paciente.id ?? null;
    this.pacienteForm = montarPacienteForm(paciente);
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
    this.limparFormulario();
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    const mensagemErro = validarPacienteForm(this.pacienteForm);

    if (!this.pacienteSelecionadoId || mensagemErro) {
      this.erro.set(mensagemErro);
      return;
    }

    this.pacienteService
      .atualizar(this.pacienteSelecionadoId, montarPacientePayload(this.pacienteForm))
      .subscribe({
        next: () => {
          this.sucesso.set('Paciente atualizado com sucesso.');
          this.fecharModal();
          this.carregarPacientes();
        },
        error: (err) => {
          this.erro.set(extrairMensagemErro(err, 'Erro ao atualizar paciente.'));
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
    this.pacienteForm.cpf = formatarCpf(valor);
  }

  atualizarTelefone(valor: string) {
    this.pacienteForm.telefone = formatarTelefone(valor);
  }

  limparFormulario() {
    this.pacienteForm = criarPacienteForm();
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
}
