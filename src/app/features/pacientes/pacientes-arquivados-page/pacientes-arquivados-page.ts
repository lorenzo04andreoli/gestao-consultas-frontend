import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PacienteService } from '../paciente';
import { PacienteModel } from '../paciente.model';

@Component({
  selector: 'app-pacientes-arquivados-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './pacientes-arquivados-page.html',
  styleUrl: '../pacientes-page/pacientes-page.scss'
})
export class PacientesArquivadosPage implements OnInit {
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
    this.sucesso.set('');

    this.pacienteService.listarArquivados().subscribe({
      next: dados => {
        this.pacientes.set(dados);
      },
      error: () => {
        this.erro.set('Erro ao carregar pacientes arquivados.');
      }
    });
  }

  reativarPaciente(paciente: PacienteModel) {
    if (!paciente.id) return;

    const confirmar = confirm(`Deseja reativar ${paciente.nome}?`);

    if (!confirmar) return;

    this.erro.set('');
    this.sucesso.set('');

    this.pacienteService.reativar(paciente.id).subscribe({
      next: () => {
        this.sucesso.set('Paciente reativado com sucesso.');
        this.pacientes.update(pacientes => pacientes.filter(item => item.id !== paciente.id));
      },
      error: () => {
        this.erro.set('Erro ao reativar paciente.');
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
