import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-pacientes-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pacientes-page.html',
  styleUrl: './pacientes-page.scss'
})
export class PacientesPage implements OnInit {
  pacientes = signal<PacienteModel[]>([]);

  erro = signal('');
  sucesso = signal('');
  buscaControl = new FormControl('', { nonNullable: true });
  paginaAtual = signal(0);
  itensPorPagina = signal(10);
  totalPacientes = signal(0);
  totalPaginas = signal(0);

  constructor(
    private pacienteService: PacienteService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit() {
    this.carregarPacientes();

    this.buscaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.paginaAtual.set(0);
        this.carregarPacientes();
      });
  }

  carregarPacientes() {
    this.erro.set('');

    this.pacienteService
      .listarPaginado(this.paginaAtual(), this.itensPorPagina(), this.buscaControl.value)
      .subscribe({
      next: pagina => {
        this.pacientes.set(pagina.content);
        this.totalPacientes.set(pagina.totalElements);
        this.totalPaginas.set(pagina.totalPages);
      },
      error: () => {
        this.erro.set('Erro ao carregar pacientes.');
      }
    });
  }

  async arquivarPaciente(paciente: PacienteModel) {
    if (!paciente.id) return;

    const confirmar = await this.confirmation.confirmar({
      title: 'Arquivar paciente',
      message: `${paciente.nome} sairá da listagem principal, mas continuará disponível em Arquivados.`,
      confirmLabel: 'Arquivar',
      cancelLabel: 'Manter ativo',
      tone: 'danger'
    });

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.pacienteService.desativar(paciente.id).subscribe({
      next: () => {
        this.sucesso.set('Paciente arquivado com sucesso.');
        this.carregarPacientes();
      },
      error: () => {
        this.erro.set('Erro ao arquivar paciente.');
      }
    });
  }

  inicialPaciente(paciente: PacienteModel) {
    return paciente.nome.trim().charAt(0).toUpperCase() || 'P';
  }

  limparBusca() {
    this.buscaControl.setValue('');
  }

  totalPacientesFiltrados() {
    return this.totalPacientes();
  }

  paginas() {
    return Array.from({ length: this.totalPaginas() }, (_, index) => index);
  }

  irParaPagina(pagina: number) {
    if (pagina < 0 || pagina >= this.totalPaginas() || pagina === this.paginaAtual()) return;

    this.paginaAtual.set(pagina);
    this.carregarPacientes();
  }
}

