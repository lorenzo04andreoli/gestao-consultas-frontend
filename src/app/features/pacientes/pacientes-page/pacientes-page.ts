import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-pacientes-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pacientes-page.html',
  styleUrl: './pacientes-page.scss'
})
export class PacientesPage implements OnInit {
  pacientes = signal<PacienteModel[]>([]);

  erro = signal('');
  sucesso = signal('');

  modalAberto = signal(false);
  modoModal: 'cadastro' | 'edicao' = 'cadastro';

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
      cpf: paciente.cpf,
      telefone: paciente.telefone
    };

    this.modalAberto.set(true);
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

  fecharModal() {
    this.modalAberto.set(false);
    this.limparFormulario();
  }

  salvar() {
    this.erro.set('');
    this.sucesso.set('');

    if (this.modoModal === 'edicao' && this.pacienteSelecionadoId) {
      this.pacienteService.atualizar(this.pacienteSelecionadoId, this.pacienteForm).subscribe({
        next: () => {
          this.sucesso.set('Paciente atualizado com sucesso.');
          this.fecharModal();
          this.carregarPacientes();
        },
        error: () => {
          this.erro.set('Erro ao atualizar paciente.');
        }
      });

      return;
    }

    this.pacienteService.criar(this.pacienteForm).subscribe({
      next: () => {
        this.sucesso.set('Paciente cadastrado com sucesso.');
        this.fecharModal();
        this.carregarPacientes();
      },
      error: () => {
        this.erro.set('Erro ao cadastrar paciente.');
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

  limparFormulario() {
    this.pacienteForm = {
      nome: '',
      email: '',
      cpf: '',
      telefone: ''
    };
  }
}
