import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  termoBusca = '';

  constructor(private pacienteService: PacienteService) {}

  ngOnInit() {
    this.carregarPacientes();
  }

  carregarPacientes() {
    this.erro.set('');

    this.pacienteService.listar().subscribe({
      next: (dados) => {
        this.pacientes.set(dados);
      },
      error: () => {
        this.erro.set('Erro ao carregar pacientes.');
      }
    });
  }

  arquivarPaciente(paciente: PacienteModel) {
    if (!paciente.id) return;

    const confirmar = confirm(`Deseja realmente arquivar ${paciente.nome}?`);

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.pacienteService.desativar(paciente.id).subscribe({
      next: () => {
        this.sucesso.set('Paciente arquivado com sucesso.');
        this.pacientes.update(pacientes => pacientes.filter(item => item.id !== paciente.id));
      },
      error: () => {
        this.erro.set('Erro ao arquivar paciente.');
      }
    });
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

